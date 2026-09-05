import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildProjectContext, clipLines, CONTEXT_BYTES, getGeiSpecHome,
  PROJECT_INDEX_BYTES, resolveProject, SHARED_INDEX_BYTES,
} from "../hooks/knowledge.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-knowledge-"));
  t.after(() => {
    const actual = fs.realpathSync(root);
    assert.equal(path.dirname(actual), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(actual).startsWith("gei-knowledge-"));
    fs.rmSync(actual, { recursive: true, force: true });
  });
  const checkout = path.join(root, "project with spaces");
  fs.mkdirSync(checkout);
  return { root, checkout, geiSpecHome: path.join(root, "knowledge") };
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function git(cwd, ...args) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  }).trim();
}

function initRepo(cwd) {
  git(cwd, "init", "-q");
  git(cwd, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.org",
    "commit", "--allow-empty", "-qm", "fixture");
}

test("startup supplies actionable background/maintenance routes without creating files", t => {
  const f = fixture(t);
  const text = buildProjectContext(f.checkout, f);
  assert.match(text, /No usable INDEX.md/u);
  assert.match(text, /No separate user confirmation/u);
  assert.match(text, /a decision is accepted/u);
  assert.match(text, /conditions before applying/u);
  assert.equal(fs.existsSync(f.geiSpecHome), false);
  assert.deepEqual(fs.readdirSync(f.checkout), []);
});

test("repository subdirectories and linked worktrees share knowledge but retain checkout", t => {
  const f = fixture(t);
  initRepo(f.checkout);
  const child = path.join(f.checkout, "src");
  fs.mkdirSync(child);
  const worktree = path.join(f.root, "linked worktree");
  git(f.checkout, "worktree", "add", "--detach", worktree, "HEAD");
  const main = resolveProject(f.checkout, f);
  const sub = resolveProject(child, f);
  const linked = resolveProject(worktree, f);
  assert.equal(main.specRoot, sub.specRoot);
  assert.equal(main.specRoot, linked.specRoot);
  assert.equal(main.manifest.name, linked.manifest.name);
  assert.equal(linked.checkoutRoot, fs.realpathSync(worktree));
  assert.equal(main.projectRoot, fs.realpathSync(f.checkout));
  const nested = path.join(child, "nested-repo");
  fs.mkdirSync(nested);
  initRepo(nested);
  assert.notEqual(resolveProject(nested, f).specRoot, main.specRoot);
});

test("existing v2 root id and content survive startup; only legacy routes are injected", t => {
  const f = fixture(t);
  const project = resolveProject(f.checkout, f);
  const legacy = "# Overview\nLEGACY_FULL_CONTENT_MUST_NOT_LOAD\n";
  const metadata = JSON.stringify({ ...project.manifest, schemaVersion: 2 });
  write(path.join(project.specRoot, "project.json"), metadata);
  write(path.join(project.specRoot, "OVERVIEW.md"), legacy);
  write(path.join(project.specRoot, "CHANGELOG.md"), "UNRELEASED_NOT_AUTOMATIC\n");
  const text = buildProjectContext(f.checkout, f);
  assert.match(text, /Legacy files/u);
  assert.doesNotMatch(text, /LEGACY_FULL_CONTENT|UNRELEASED_NOT_AUTOMATIC/u);
  assert.equal(fs.readFileSync(path.join(project.specRoot, "OVERVIEW.md"), "utf8"), legacy);
  assert.equal(fs.readFileSync(path.join(project.specRoot, "project.json"), "utf8"), metadata);
  assert.equal(fs.existsSync(path.join(project.specRoot, "INDEX.md")), false);
});

test("only indexes load, detailed topics and old layers remain on demand", t => {
  const f = fixture(t);
  const project = resolveProject(f.checkout, f);
  write(path.join(project.specRoot, "INDEX.md"), "# Store\nPurpose: fixture\n- refund -> topics/orders/README.md\n");
  write(path.join(project.specRoot, "topics/orders/README.md"), "TOPIC_BODY_NOT_AUTOMATIC");
  write(path.join(project.specRoot, "topics/orders/notes/retry.md"), "NOTE_BODY_NOT_AUTOMATIC");
  write(path.join(project.specRoot, "OVERVIEW.md"), "OLD_BACKGROUND");
  write(path.join(f.geiSpecHome, "context/INDEX.md"), "- loopback -> notes/loopback.md");
  write(path.join(f.geiSpecHome, "context/notes/loopback.md"), "SHARED_BODY_NOT_AUTOMATIC");
  const text = buildProjectContext(f.checkout, f);
  assert.match(text, /refund -> topics\/orders/u);
  assert.match(text, /loopback -> notes/u);
  assert.doesNotMatch(text, /BODY_NOT_AUTOMATIC|OLD_BACKGROUND|Legacy files/u);
});

test("UTF-8 clipping respects budgets and never emits partial routing lines", t => {
  const f = fixture(t);
  const project = resolveProject(f.checkout, f);
  const line = "- 订单退款取舍 → [记录](topics/orders/README.md)\n";
  const huge = line.repeat(1000);
  for (const limit of [PROJECT_INDEX_BYTES, SHARED_INDEX_BYTES]) {
    const clipped = clipLines(huge, limit);
    assert.ok(Buffer.byteLength(clipped) <= limit);
    assert.match(clipped, /Clipped/u);
    assert.doesNotMatch(clipped, /\uFFFD/u);
    const routes = clipped.split("\n").filter(row => row.startsWith("-"));
    assert.ok(routes.every(row => row === line.trim()));
  }
  write(path.join(project.specRoot, "INDEX.md"), huge);
  write(path.join(f.geiSpecHome, "context/INDEX.md"), huge);
  assert.ok(Buffer.byteLength(buildProjectContext(f.checkout, f)) <= CONTEXT_BYTES);
});

test("explicit relocation metadata preserves the existing knowledge directory", t => {
  const f = fixture(t);
  const original = resolveProject(f.checkout, f);
  write(path.join(original.specRoot, "project.json"), JSON.stringify(original.manifest));
  const moved = path.join(f.root, "moved");
  fs.renameSync(f.checkout, moved);
  write(path.join(original.specRoot, "project.json"), JSON.stringify({ ...original.manifest, root: moved }));
  assert.equal(resolveProject(moved, f).specRoot, original.specRoot);
  const child = path.join(moved, "child");
  fs.mkdirSync(child);
  assert.equal(resolveProject(child, f).specRoot, original.specRoot);
  assert.equal(resolveProject(child, f).checkoutRoot, fs.realpathSync(moved));
});

test("relocated Git roots keep their knowledge in a new linked worktree", t => {
  const f = fixture(t);
  initRepo(f.checkout);
  const original = resolveProject(f.checkout, f);
  const moved = path.join(f.root, "relocated-repository");
  fs.renameSync(f.checkout, moved);
  write(path.join(original.specRoot, "project.json"), JSON.stringify({
    ...original.manifest, root: moved, gitCommonDir: path.join(moved, ".git"),
  }));
  const worktree = path.join(f.root, "new-worktree");
  git(moved, "worktree", "add", "--detach", worktree, "HEAD");
  assert.equal(resolveProject(worktree, f).specRoot, original.specRoot);
  assert.equal(resolveProject(worktree, f).checkoutRoot, fs.realpathSync(worktree));
});

test("manifest aliases work and ambiguous matches are reported", t => {
  const f = fixture(t);
  write(path.join(f.geiSpecHome, "projects/unrelated/project.json"), "null");
  write(path.join(f.geiSpecHome, "projects/stable/project.json"), JSON.stringify({
    id: "stable", root: path.join(f.root, "old"), aliases: [f.checkout],
  }));
  assert.equal(resolveProject(f.checkout, f).projectId, "stable");
  write(path.join(f.geiSpecHome, "projects/other/project.json"), JSON.stringify({ id: "other", root: f.checkout }));
  assert.throws(() => resolveProject(f.checkout, f), /Multiple project manifests/u);
});

test("home override expands tilde and damaged active metadata is visible", t => {
  const f = fixture(t);
  assert.equal(getGeiSpecHome({ GEI_SPEC_HOME: "~/knowledge" }), path.join(os.homedir(), "knowledge"));
  const project = resolveProject(f.checkout, f);
  write(path.join(project.specRoot, "project.json"), "{broken");
  assert.throws(() => buildProjectContext(f.checkout, f), SyntaxError);
});

test("both host configs run from a copied plugin layout and return valid bounded JSON", t => {
  const f = fixture(t);
  const packageRoot = path.join(f.root, "plugin-package", "gei");
  for (const name of [".codex-plugin", ".claude-plugin", "assets", "skills", "docs", "hooks", "LICENSE", "README.md", "README.en.md", "CHANGELOG.md"]) {
    fs.cpSync(path.join(sourceRoot, name), path.join(packageRoot, name), { recursive: true });
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, ".codex-plugin/plugin.json"), "utf8"));
  for (const relative of [manifest.skills, manifest.hooks, manifest.interface.composerIcon, manifest.interface.logo]) {
    assert.ok(fs.existsSync(path.join(packageRoot, relative)), relative);
  }
  for (const configName of ["codex-hooks.json", "hooks.json"]) {
    const config = JSON.parse(fs.readFileSync(path.join(packageRoot, "hooks", configName), "utf8"));
    const hooks = config.hooks.SessionStart[0].hooks;
    assert.equal(hooks.length, 2);
    for (const hook of hooks) {
      const suffix = hook.command.match(/\}\/([^"\n]+)"$/u)?.[1];
      assert.ok(suffix, hook.command);
      const script = path.join(packageRoot, suffix);
      assert.ok(fs.existsSync(script));
      const result = spawnSync(process.execPath, [script], {
        input: JSON.stringify({ cwd: f.checkout }), encoding: "utf8", windowsHide: true,
        env: { ...process.env, GEI_SPEC_HOME: f.geiSpecHome,
          PLUGIN_ROOT: packageRoot, CLAUDE_PLUGIN_ROOT: packageRoot },
      });
      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout).hookSpecificOutput;
      assert.equal(output.hookEventName, "SessionStart");
      assert.ok(output.additionalContext);
      assert.ok(Buffer.byteLength(output.additionalContext) <= CONTEXT_BYTES);
    }
  }
  assert.equal(fs.existsSync(f.geiSpecHome), false);
});

test("malformed hook input reports a diagnostic, not invented project context", t => {
  const f = fixture(t);
  const result = spawnSync(process.execPath, [path.join(sourceRoot, "hooks/inject_context.mjs")], {
    input: "{invalid", encoding: "utf8", windowsHide: true,
    env: { ...process.env, GEI_SPEC_HOME: f.geiSpecHome },
  });
  assert.match(JSON.parse(result.stdout).systemMessage, /knowledge discovery failed/u);
  assert.equal(fs.existsSync(f.geiSpecHome), false);
});
