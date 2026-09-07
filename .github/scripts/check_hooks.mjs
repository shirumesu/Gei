import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildProjectContext, buildSharedContext, clipLines, ensureWorkspace,
  resolveProject, CONTEXT_BYTES, SHARED_CONTEXT_BYTES,
} from "../../hooks/knowledge.mjs";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "gei-hooks-"));
const home = path.join(temporary, "knowledge");
const options = { geiSpecHome: home };
const mkdir = name => { const dir = path.join(temporary, name); fs.mkdirSync(dir, { recursive: true }); return dir; };
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
const runHook = (root, script, cwd, extra = {}) => jsonOutput(execFileSync(process.execPath,
  [path.join(root, "hooks", script)], { input: JSON.stringify({ cwd }), encoding: "utf8",
    env: { ...process.env, GEI_SPEC_HOME: home, PLUGIN_ROOT: root, CLAUDE_PLUGIN_ROOT: root, ...extra }, windowsHide: true }));
const jsonOutput = output => output.trim() ? JSON.parse(output) : null;
let passed = 0;
async function check(name, action) { await action(); console.log(`PASS ${++passed}: ${name}`); }

try {
  const plain = mkdir("plain");
  let workspace;
  await check("new directory allocates only identity/index; repeat startup preserves content", () => {
    buildProjectContext(plain, options);
    workspace = resolveProject(plain, options);
    assert.deepEqual(fs.readdirSync(workspace.specRoot).sort(), ["INDEX.md", "project.json"]);
    assert.equal(json(path.join(workspace.specRoot, "project.json")).schemaVersion, 3);
    assert.deepEqual(fs.readdirSync(plain), []);
    const index = path.join(workspace.specRoot, "INDEX.md");
    fs.writeFileSync(index, "# Known purpose\nPreserve this decision.\n");
    const before = fs.statSync(index).mtimeMs;
    assert.match(buildProjectContext(plain, options), /Preserve this decision/);
    assert.equal(fs.statSync(index).mtimeMs, before);
  });
  await check("non-Git children remain independent; exact relocation alias retains identity", () => {
    const child = mkdir("plain/child");
    assert.notEqual(ensureWorkspace(child, options).projectId, workspace.projectId);
    const moved = mkdir("moved");
    const manifestPath = path.join(workspace.specRoot, "project.json");
    fs.writeFileSync(manifestPath, JSON.stringify({ ...workspace.manifest, aliases: [moved] }));
    assert.equal(resolveProject(moved, options).projectId, workspace.projectId);
    assert.equal(resolveProject(moved, options).checkoutRoot, fs.realpathSync.native(moved));
  });
  await check("relocation aliases resolve filesystem links without absorbing children", () => {
    const moved = mkdir("relocated");
    const alias = path.join(temporary, "relocation-alias");
    fs.symlinkSync(moved, alias, process.platform === "win32" ? "junction" : "dir");
    const manifestPath = path.join(workspace.specRoot, "project.json");
    const manifest = json(manifestPath);
    fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, aliases: [...manifest.aliases, alias] }));
    assert.equal(ensureWorkspace(moved, options).projectId, workspace.projectId);
    assert.equal(resolveProject(alias, options).projectId, workspace.projectId);
    assert.notEqual(ensureWorkspace(mkdir("relocated/child"), options).projectId, workspace.projectId);
    assert.match(runHook(source, "inject_context.mjs", moved).hookSpecificOutput.additionalContext,
      /Preserve this decision/);
  });
  await check("Git subdirectories/worktrees share identity; nested repositories do not", () => {
    const repo = mkdir("repo");
    git(repo, "init");
    fs.writeFileSync(path.join(repo, "tracked"), "fixture\n");
    git(repo, "add", "tracked");
    git(repo, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture");
    const sub = mkdir("repo/sub");
    const linked = path.join(temporary, "linked");
    git(repo, "worktree", "add", "--detach", linked);
    const main = ensureWorkspace(repo, options);
    assert.equal(ensureWorkspace(sub, options).projectId, main.projectId);
    assert.equal(ensureWorkspace(linked, options).projectId, main.projectId);
    assert.equal(resolveProject(linked, options).checkoutRoot, fs.realpathSync.native(linked));
    git(sub, "init");
    assert.notEqual(ensureWorkspace(sub, options).projectId, main.projectId);
  });
  await check("concurrent first sessions publish complete files without leftovers", async () => {
    const cwd = mkdir("concurrent");
    await Promise.all(Array.from({ length: 6 }, () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(source, "hooks/inject_context.mjs")], {
        env: { ...process.env, GEI_SPEC_HOME: home }, windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
      });
      let output = "";
      child.stdout.on("data", chunk => { output += chunk; });
      child.on("error", reject);
      child.on("close", code => {
        try { assert.equal(code, 0); assert.ok(jsonOutput(output).hookSpecificOutput); resolve(); }
        catch (error) { reject(error); }
      });
      child.stdin.end(JSON.stringify({ cwd }));
    })));
    const result = resolveProject(cwd, options);
    assert.deepEqual(fs.readdirSync(result.specRoot).sort(), ["INDEX.md", "project.json"]);
  });
  await check("separate Git metadata preserves old identities across worktrees; bare/internal directories allocate", () => {
    const repo = mkdir("separate-repo");
    const metadata = path.join(temporary, "git-storage");
    git(repo, "init", "--separate-git-dir", metadata);
    fs.writeFileSync(path.join(repo, "tracked"), "fixture\n");
    git(repo, "add", "tracked");
    git(repo, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture");
    const old = path.join(home, "projects", "preserved-id");
    fs.mkdirSync(old);
    fs.writeFileSync(path.join(old, "project.json"), JSON.stringify({ schemaVersion: 3, id: "preserved-id", root: repo, gitCommonDir: metadata }));
    const linked = path.join(temporary, "separate-worktree");
    git(repo, "worktree", "add", "--detach", linked);
    assert.equal(ensureWorkspace(repo, options).projectId, "preserved-id");
    assert.equal(ensureWorkspace(linked, options).projectId, "preserved-id");
    const bare = mkdir("bare.git");
    git(bare, "init", "--bare");
    assert.ok(ensureWorkspace(bare, options).manifestExists);
    assert.equal(ensureWorkspace(path.join(temporary, "repo/.git"), options).projectId,
      resolveProject(path.join(temporary, "repo"), options).projectId);
  });
  await check("legacy sources remain intact and discoverable after allocation", () => {
    const cwd = mkdir("legacy");
    const result = resolveProject(cwd, options);
    fs.mkdirSync(result.specRoot, { recursive: true });
    const legacy = path.join(result.specRoot, "OVERVIEW.md");
    fs.writeFileSync(legacy, "UNIQUE_LEGACY_BODY");
    const output = buildProjectContext(cwd, options);
    assert.match(output, /\[OVERVIEW.md\]\(OVERVIEW.md\)/);
    assert.ok(!output.includes("UNIQUE_LEGACY_BODY"));
    assert.equal(fs.readFileSync(legacy, "utf8"), "UNIQUE_LEGACY_BODY");
  });
  await check("project/shared outputs stay separate and bounded without loading detail", () => {
    const shared = path.join(home, "context");
    fs.mkdirSync(shared);
    fs.writeFileSync(path.join(shared, "INDEX.md"), "# SHARED_ONLY\n" + "- 中文入口\n".repeat(1200));
    fs.writeFileSync(path.join(workspace.specRoot, "INDEX.md"), "# PROJECT_ONLY\n" + "- 中文入口\n".repeat(1200));
    fs.mkdirSync(path.join(workspace.specRoot, "topics"));
    fs.writeFileSync(path.join(workspace.specRoot, "topics", "private.md"), "DETAIL_NOT_INJECTED");
    const projectText = buildProjectContext(plain, options);
    const sharedText = buildSharedContext(options);
    assert.ok(Buffer.byteLength(projectText) <= CONTEXT_BYTES);
    assert.ok(Buffer.byteLength(sharedText) <= SHARED_CONTEXT_BYTES);
    assert.ok(!projectText.includes("SHARED_ONLY") && !projectText.includes("DETAIL_NOT_INJECTED"));
    assert.ok(!sharedText.includes("PROJECT_ONLY"));
    assert.match(projectText, /Clipped/);
    assert.equal(clipLines("中文字".repeat(10), 1), "");
    fs.writeFileSync(path.join(shared, "INDEX.md"), "# Shared\n");
    const before = fs.statSync(path.join(shared, "INDEX.md")).mtimeMs;
    buildSharedContext(options);
    assert.equal(fs.statSync(path.join(shared, "INDEX.md")).mtimeMs, before);
  });
  await check("unavailable storage and invalid input report failure without source writes", () => {
    const blocked = path.join(temporary, "blocked-store");
    fs.writeFileSync(blocked, "file, not directory");
    assert.ok(runHook(source, "inject_context.mjs", plain, { GEI_SPEC_HOME: blocked }).systemMessage);
    const invalid = execFileSync(process.execPath, [path.join(source, "hooks/inject_context.mjs")], { input: "{bad", encoding: "utf8", windowsHide: true });
    assert.ok(jsonOutput(invalid).systemMessage);
    assert.throws(() => ensureWorkspace(path.join(temporary, "missing"), options));
    assert.deepEqual(fs.readdirSync(plain), ["child"]);
  });
  await check("both host configurations run all three hooks from a copied plugin", () => {
    const packaged = mkdir("package");
    for (const entry of [".codex-plugin", ".claude-plugin", "assets", "skills", "docs", "hooks", "LICENSE", "README.md", "README.en.md", "CHANGELOG.md"]) {
      fs.cpSync(path.join(source, entry), path.join(packaged, entry), { recursive: true });
    }
    for (const name of ["hooks.json", "codex-hooks.json"]) {
      const hooks = json(path.join(packaged, "hooks", name)).hooks.SessionStart[0].hooks;
      assert.equal(hooks.length, 3);
      const limits = { "inject_using_gei.mjs": 2048, "inject_context.mjs": CONTEXT_BYTES, "inject_shared.mjs": SHARED_CONTEXT_BYTES };
      for (const hook of hooks) {
        const script = hook.command.match(/hooks\/([^"\s]+)/u)[1];
        const output = runHook(packaged, script, plain).hookSpecificOutput.additionalContext;
        assert.ok(Buffer.byteLength(output) <= limits[script]);
        assert.ok(output.length < 10000);
      }
    }
  });
  await check("marketplace and manifest entries point to the maintained distribution", () => {
    const manifest = json(path.join(source, ".codex-plugin/plugin.json"));
    const marketplace = json(path.join(source, ".agents/plugins/marketplace.json"));
    const entry = marketplace.plugins.find(plugin => plugin.name === manifest.name);
    assert.equal(entry.source.source, "url");
    assert.equal(entry.source.url.replace(/\.git$/u, ""), manifest.repository);
    assert.equal(json(path.join(source, ".claude-plugin/marketplace.json")).plugins[0].source, "./");
    for (const relative of [manifest.skills, manifest.hooks, manifest.interface.composerIcon, manifest.interface.logo]) {
      assert.ok(fs.existsSync(path.join(source, relative)), relative);
    }
  });
  console.log(`${passed} Hook checks passed.`);
} finally {
  const resolved = fs.realpathSync(temporary);
  assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("gei-hooks-"));
  fs.rmSync(resolved, { recursive: true });
}
