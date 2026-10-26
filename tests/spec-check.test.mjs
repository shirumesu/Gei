import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { SourceDrift } from "../skills/memo/scripts/spec/maintenance.mjs";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const allowedReasons = new Set(["broken_reference", "duplicate_content", "source_changed", "source_unavailable"]);
const prose = "Shared constraint about checkout layout and release notes. ".repeat(4);

function git(cwd, args, when) {
  execFileSync("git", ["-c", "commit.gpgsign=false", "-c", "user.name=Gei Test", "-c", "user.email=gei@example.com", ...args], {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Gei Test",
      GIT_AUTHOR_EMAIL: "gei@example.com",
      GIT_COMMITTER_NAME: "Gei Test",
      GIT_COMMITTER_EMAIL: "gei@example.com",
      ...(when ? { GIT_AUTHOR_DATE: when, GIT_COMMITTER_DATE: when } : {}),
    },
    stdio: "pipe",
  });
}
function write(root, relative, text) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
function commit(root, message, when) {
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", message], when);
}

function fixture() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "gei-spec-"));
  const home = path.join(parent, "knowledge");
  const state = path.join(parent, "state");
  const checkout = path.join(parent, "checkout");
  fs.mkdirSync(home);
  fs.mkdirSync(checkout);
  git(home, ["init", "-b", "main"]);
  git(checkout, ["init", "-b", "main"]);
  write(checkout, "src/old.js", "export const oldSource = 1;\n");
  commit(checkout, "old source", "2024-01-01T00:00:00Z");
  write(checkout, "src/same.js", "export const sameSource = 1;\n");
  commit(checkout, "same source", "2024-05-01T00:00:00Z");
  write(checkout, "src/lib.js", "export const changedSource = 1;\n");
  commit(checkout, "changed source", "2024-07-01T00:00:00Z");

  const legacyHeader = `---\ngei: {"version":5,"kind":"knowledge","sources":{"src/lib.js":"0123456789abcdef"}}\n---\n`;
  write(home, "projects/example/notes/drift.md", "---\nsources:\n  - src/lib.js\n---\n# Drift\n\nDriftTokenAlpha is the marker for this note.\n");
  write(home, "projects/example/notes/missing.md", "---\nsources:\n  - \"src/missing file.js\"\n---\n# Missing source\n\nThe checkout has no such file.\n");
  write(home, "projects/example/notes/broken.md", "# Broken\n\nSee [the missing note](gone.md) before editing the route.\n");
  write(home, "projects/example/notes/dup-a.md", `# Duplicate A\n\n${prose}\n`);
  write(home, "projects/example/notes/dup-b.md", `# Duplicate B\n\n${prose}\n`);
  write(home, "projects/example/INDEX.md", "# Example\n\nIndexTokenAlpha routes the example project.\n");
  write(home, "projects/example/notes/old-line.md", `${legacyHeader}# Old line\n\nLegacyMarker stays in the body.\n`);
  commit(home, "initial knowledge", "2024-03-01T00:00:00Z");
  write(home, "projects/example/notes/same.md", "---\nsources:\n  - src/same.js\n---\n# Same time\n\nThis document and its source share one commit time.\n");
  commit(home, "same-time document", "2024-05-01T00:00:00Z");
  write(home, "projects/example/notes/fresh.md", "---\nsources: [\"src/old.js\"]\n---\n# Current\n\nThis note was committed after its source.\n");
  commit(home, "fresher document", "2024-08-01T00:00:00Z");
  return { parent, home, state, checkout, legacyHeader };
}

class McpClient {
  constructor(env) {
    this.stderr = "";
    this.buffer = "";
    this.waiters = [];
    this.id = 0;
    this.child = spawn(process.execPath, [path.join(repoRoot, "skills/memo/scripts/spec/mcp.mjs")], {
      cwd: repoRoot, env, stdio: ["pipe", "pipe", "pipe"],
    });
    this.child.stdout.on("data", chunk => {
      this.buffer += chunk;
      let newline = this.buffer.indexOf("\n");
      while (newline >= 0) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        newline = this.buffer.indexOf("\n");
        if (!line.trim()) continue;
        const waiter = this.waiters.shift();
        if (waiter) waiter(JSON.parse(line));
      }
    });
    this.child.stderr.on("data", chunk => { this.stderr += chunk; });
  }
  request(method, params) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout ${method}\n${this.stderr}`)), 20000);
      this.waiters.push(message => {
        clearTimeout(timer);
        if (message.id !== id) reject(new Error(`response id ${message.id} for ${id}: ${JSON.stringify(message)}`));
        else resolve(message);
      });
      this.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }
  async call(name, args) {
    const message = await this.request("tools/call", { name, arguments: args });
    return message.result;
  }
  async close() {
    this.child.stdin.end();
    await new Promise(resolve => {
      const timer = setTimeout(() => { this.child.kill(); resolve(); }, 2000);
      this.child.on("close", () => { clearTimeout(timer); resolve(); });
    });
  }
}

test("sources list ignores a legacy JSON line and reads YAML sequences", () => {
  assert.deepEqual(SourceDrift.list("---\nsources:\n  - src/a.js\n  - 'src/b.js'\n---\n# Title\n"), ["src/a.js", "src/b.js"]);
  assert.deepEqual(SourceDrift.list("---\nsources: [\"src/a.js\", src/b.js]\n---\n"), ["src/a.js", "src/b.js"]);
  assert.deepEqual(SourceDrift.list("---\ngei: {\"sources\":{\"src/hidden.js\":\"0123456789abcdef\"}}\n---\n# Title\n"), []);
  assert.deepEqual(SourceDrift.list("# No frontmatter\n"), []);
  assert.ok(Array.from(prose).length >= 160);
});

test("git commit time reports a newer source and a missing path", () => {
  const { parent, home, checkout } = fixture();
  try {
    const drift = fs.readFileSync(path.join(home, "projects/example/notes/drift.md"), "utf8");
    const fresh = fs.readFileSync(path.join(home, "projects/example/notes/fresh.md"), "utf8");
    const missing = fs.readFileSync(path.join(home, "projects/example/notes/missing.md"), "utf8");
    const same = fs.readFileSync(path.join(home, "projects/example/notes/same.md"), "utf8");
    const oldLine = fs.readFileSync(path.join(home, "projects/example/notes/old-line.md"), "utf8");
    const driftTime = SourceDrift.commitTime(home, "projects/example/notes/drift.md");
    const libTime = SourceDrift.commitTime(checkout, "src/lib.js");
    assert.ok(libTime > driftTime);
    const changed = SourceDrift.assess(drift, { checkoutRoot: checkout, docTime: driftTime });
    assert.deepEqual(changed.reasons, ["source_changed"]);
    assert.deepEqual(changed.source_changes, [{ path: "src/lib.js", status: "changed" }]);
    const current = SourceDrift.assess(fresh, { checkoutRoot: checkout, docTime: SourceDrift.commitTime(home, "projects/example/notes/fresh.md") });
    assert.deepEqual(current.reasons, []);
    const absent = SourceDrift.assess(missing, { checkoutRoot: checkout, docTime: driftTime });
    assert.deepEqual(absent.reasons, ["source_unavailable"]);
    assert.deepEqual(absent.source_changes, [{ path: "src/missing file.js", status: "unavailable" }]);
    const tied = SourceDrift.assess(same, { checkoutRoot: checkout, docTime: SourceDrift.commitTime(home, "projects/example/notes/same.md") });
    assert.deepEqual(tied.reasons, []);
    const ignored = SourceDrift.assess(oldLine, { checkoutRoot: checkout, docTime: driftTime });
    assert.deepEqual(ignored.reasons, []);
    assert.deepEqual(SourceDrift.assess(drift, { docTime: driftTime }).reasons, []);
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});

test("MCP check, read, search, and edit against a temp git checkout", { timeout: 30000 }, async () => {
  const { parent, home, state, checkout, legacyHeader } = fixture();
  const client = new McpClient({ ...process.env, GEI_SPEC_HOME: home, GEI_SPEC_STATE: state });
  try {
    const initialized = await client.request("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "gei-test", version: "0" } });
    assert.equal(initialized.result.serverInfo.name, "gei-spec");
    const listed = await client.request("tools/list", {});
    assert.deepEqual(listed.result.tools.map(tool => tool.name), ["spec_check", "spec_read", "spec_search", "spec_edit", "spec_status"]);
    const removed = await client.call(["spec", "gc"].join("_"), {});
    assert.equal(removed.isError, true);
    assert.equal(removed.structuredContent.code, "UNKNOWN_TOOL");

    const checked = await client.call("spec_check", { path_prefix: "projects/example/", checkout_root: checkout });
    assert.equal(checked.isError, undefined);
    const report = checked.structuredContent;
    console.log(JSON.stringify({ documents: report.documents, candidates: report.candidates, counts: report.counts,
      results: report.results.map(item => ({ path: item.path, reasons: item.reasons, source_changes: item.source_changes, broken: item.broken?.map(ref => ref.target) })) }, null, 2));
    assert.equal(report.documents, 9);
    const byPath = Object.fromEntries(report.results.map(item => [item.path, item]));
    assert.deepEqual(Object.keys(byPath).sort(), [
      "projects/example/notes/broken.md",
      "projects/example/notes/drift.md",
      "projects/example/notes/dup-a.md",
      "projects/example/notes/dup-b.md",
      "projects/example/notes/missing.md",
    ]);
    for (const item of report.results) for (const reason of item.reasons) assert.ok(allowedReasons.has(reason), reason);
    assert.deepEqual(byPath["projects/example/notes/broken.md"].reasons, ["broken_reference"]);
    assert.deepEqual(byPath["projects/example/notes/broken.md"].broken.map(ref => ref.target), ["projects/example/notes/gone.md"]);
    assert.deepEqual(byPath["projects/example/notes/drift.md"].reasons, ["source_changed"]);
    assert.deepEqual(byPath["projects/example/notes/drift.md"].source_changes, [{ path: "src/lib.js", status: "changed" }]);
    assert.deepEqual(byPath["projects/example/notes/missing.md"].reasons, ["source_unavailable"]);
    assert.ok(byPath["projects/example/notes/dup-a.md"].reasons.includes("duplicate_content"));
    assert.ok(byPath["projects/example/notes/dup-b.md"].reasons.includes("duplicate_content"));
    assert.equal(byPath["projects/example/notes/fresh.md"], undefined);
    assert.equal(byPath["projects/example/notes/same.md"], undefined);
    assert.equal(byPath["projects/example/notes/old-line.md"], undefined);
    assert.equal(byPath["projects/example/INDEX.md"], undefined);
    assert.match(checked.content[0].text, /src\/lib\.js — changed/);
    assert.equal(report.review_sample, undefined);
    assert.equal(report.cooling, undefined);

    const read = await client.call("spec_read", { paths: ["projects/example/notes/drift.md", "projects/example/notes/old-line.md", "projects/example/INDEX.md"] });
    assert.equal(read.isError, undefined);
    const files = Object.fromEntries(read.structuredContent.files.map(file => [file.path, file]));
    assert.equal(files["projects/example/notes/drift.md"].lifecycle, undefined);
    assert.equal(files["projects/example/notes/drift.md"].body_start_line, 5);
    assert.match(files["projects/example/notes/drift.md"].content, /DriftTokenAlpha/);
    assert.match(files["projects/example/notes/drift.md"].content, /sources:/);
    assert.match(files["projects/example/notes/old-line.md"].content, /gei:/);
    assert.equal(files["projects/example/INDEX.md"].body_start_line, 1);

    const found = await client.call("spec_search", { query: "DriftTokenAlpha", path_prefix: "projects/example/" });
    assert.equal(found.structuredContent.results[0].path, "projects/example/notes/drift.md");
    const rejectedSearch = await client.call("spec_search", { query: "IndexTokenAlpha", path_prefix: "projects/example/", include_lifecycle: true });
    assert.equal(rejectedSearch.isError, true);
    assert.equal(rejectedSearch.structuredContent.code, "ARGUMENT");

    const rejectedEdit = await client.call("spec_edit", {
      base_revision: read.structuredContent.revision,
      summary: "Rejected extra field",
      reviews: [{ path: "projects/example/INDEX.md", outcome: "verify", basis: "not a parameter" }],
      edits: [{ op: "replace", path: "projects/example/INDEX.md", old_text: "IndexTokenAlpha", new_text: "IndexTokenBeta" }],
    });
    assert.equal(rejectedEdit.isError, true);
    assert.equal(rejectedEdit.structuredContent.code, "ARGUMENT");
    assert.match(rejectedEdit.structuredContent.message, /reviews/);

    const edited = await client.call("spec_edit", {
      base_revision: read.structuredContent.revision,
      summary: "Edit plain Markdown and drop the old line",
      edits: [
        { op: "replace", path: "projects/example/INDEX.md", old_text: "IndexTokenAlpha", new_text: "IndexTokenBeta" },
        { op: "replace", path: "projects/example/notes/old-line.md", old_text: legacyHeader, new_text: "---\ntype: facts\ndescription: Legacy marker kept after the old line was removed.\n---\n" },
        { op: "create", path: "projects/example/notes/plain.md", content: "---\ntype: facts\ndescription: Plain marker note with no lifecycle field.\n---\n# Plain\n\nPlainMarker has no lifecycle field.\n" },
      ],
    });
    assert.equal(edited.isError, undefined);
    assert.equal(edited.structuredContent.applied, true);
    const after = await client.call("spec_read", { paths: ["projects/example/INDEX.md", "projects/example/notes/old-line.md", "projects/example/notes/plain.md"], revision: edited.structuredContent.revision });
    const updated = Object.fromEntries(after.structuredContent.files.map(file => [file.path, file]));
    assert.match(updated["projects/example/INDEX.md"].content, /IndexTokenBeta/);
    assert.doesNotMatch(updated["projects/example/notes/old-line.md"].content, /gei:/);
    assert.match(updated["projects/example/notes/old-line.md"].content, /LegacyMarker/);
    assert.match(updated["projects/example/notes/plain.md"].content, /PlainMarker/);
    assert.match(updated["projects/example/notes/plain.md"].content, /type: facts/);
    assert.match(updated["projects/example/notes/plain.md"].content, /description: Plain marker note/);
    const searched = await client.call("spec_search", { query: "PlainMarker", path_prefix: "projects/example/", revision: edited.structuredContent.revision });
    assert.equal(searched.structuredContent.results[0].path, "projects/example/notes/plain.md");
  } finally {
    await client.close();
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("CLI help no longer offers the removed maintenance commands", () => {
  const help = execFileSync(process.execPath, [path.join(repoRoot, "skills/memo/scripts/spec/cli.mjs"), "--help"], { encoding: "utf8" });
  assert.match(help, /check --scope/);
  assert.doesNotMatch(help, new RegExp(["migrate", "metadata"].join("-")));
  assert.doesNotMatch(help, /\n {2}gc /u);
  const unknown = spawn(process.execPath, [path.join(repoRoot, "skills/memo/scripts/spec/cli.mjs"), ["migrate", "metadata"].join("-")]);
  return new Promise((resolve, reject) => {
    let stderr = "";
    unknown.stderr.on("data", chunk => { stderr += chunk; });
    unknown.on("close", code => {
      try {
        assert.equal(code, 1);
        assert.match(stderr, /Unknown command/);
        resolve();
      } catch (error) { reject(error); }
    });
  });
});
