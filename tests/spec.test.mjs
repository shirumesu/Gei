import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { GitHub } from "../skills/memo/scripts/spec/github.mjs";
import { hash, readJson, writeJson } from "../skills/memo/scripts/spec/io.mjs";
import { tools } from "../skills/memo/scripts/spec/tools.mjs";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(source, "bin/gei.mjs");
const name = "projects/example/INDEX.md";
function fixture(t, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-spec-test-"));
  const env = { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state"), GEI_GITHUB_TOKEN: "fixture-token" };
  const store = new SpecStore({ env, ...extra });
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("gei-spec-test-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { root, env, store };
}
const disk = (env, relative) => fs.readFileSync(path.join(env.GEI_SPEC_HOME, relative), "utf8");
async function seed(store, files = { [name]: "# Example\nOld rule.\n" }) {
  const read = await store.read({ paths: Object.keys(files) });
  return store.edit({ base_revision: read.revision, summary: "Create knowledge", edits: Object.entries(files).map(([name, content]) => ({ op: "create", path: name, content })) });
}
function run(command, env, input = "", cwd = source) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, command, { env, cwd, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", data => { stdout += data; });
    child.stderr.on("data", data => { stderr += data; });
    child.on("close", code => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}

// An immutable Git tree fixture behind the real HTTP adapter, including compare-and-set.
class GitHubApi {
  constructor(files = {}) { this.revisions = new Map(); this.blobs = new Map(); this.calls = []; this.commits = 0; this.advance(files); }
  advance(files) {
    const oid = hash(JSON.stringify(files) + this.revisions.size).slice(0, 40);
    this.revisions.set(oid, { ...files }); this.head = oid;
    for (const content of Object.values(files)) this.blobs.set(hash(content).slice(0, 40), content);
    return oid;
  }
  response(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }); }
  fetch = async (url, options) => {
    this.calls.push({ url, options });
    if (this.offline) throw new Error("offline");
    const pathname = new URL(url).pathname;
    if (pathname === "/user") return this.response({ login: "fixture" });
    if (pathname === "/user/repos") { this.created = JSON.parse(options.body); this.exists = true; return this.response({ private: true, full_name: "fixture/knowledge", default_branch: "main" }, 201); }
    if (pathname === "/repos/fixture/knowledge") return this.exists === false ? this.response({ message: "Not Found" }, 404) : this.response({ private: this.private !== false, full_name: "fixture/knowledge", default_branch: "main", permissions: { push: true } });
    if (pathname.includes("/git/ref/heads/")) return this.response({ object: { sha: this.head } });
    if (pathname.includes("/git/trees/")) {
      const files = this.revisions.get(pathname.split("/").at(-1));
      if (!files) return this.response({ message: "Not Found" }, 404);
      return this.response({ tree: Object.entries(files).map(([name, content]) => ({ path: name, sha: hash(content).slice(0, 40), type: "blob", mode: "100644" })), truncated: false });
    }
    if (pathname.includes("/git/blobs/")) {
      const content = this.blobs.get(pathname.split("/").at(-1));
      return this.response({ content: Buffer.from(content).toString("base64"), encoding: "base64", size: Buffer.byteLength(content) });
    }
    if (pathname === "/graphql") {
      const { input } = JSON.parse(options.body).variables;
      assert.equal(input.branch.repositoryNameWithOwner, "fixture/knowledge");
      assert.equal(input.branch.branchName, "main");
      if (this.beforeCommit) { this.beforeCommit(); this.beforeCommit = null; }
      if (input.expectedHeadOid !== this.head) return this.response({ errors: [{ message: "Expected branch to point to supplied head" }] });
      const files = { ...this.revisions.get(this.head) };
      for (const item of input.fileChanges.additions) files[item.path] = Buffer.from(item.contents, "base64").toString("utf8");
      for (const item of input.fileChanges.deletions) delete files[item.path];
      const oid = this.advance(files); this.commits++;
      if (this.loseResponse) { this.loseResponse = false; throw new Error("connection lost after commit"); }
      return this.response({ data: { createCommitOnBranch: { commit: { oid, url: `https://github.com/fixture/knowledge/commit/${oid}` } } } });
    }
    throw new Error(`Unexpected route: ${pathname}`);
  };
}
function remoteFixture(t, files = {}) {
  const api = new GitHubApi(files);
  const local = fixture(t);
  const github = new GitHub({ env: local.env, fetcher: api.fetch });
  return { ...local, api, store: new SpecStore({ env: local.env, github }) };
}

test("local CLI creates and atomically edits Markdown without credentials or Git", async t => {
  const { env, store } = fixture(t);
  const read = JSON.parse((await run([cli, "spec", "read"], env, JSON.stringify({ paths: [name] }))).stdout);
  const result = await run([cli, "spec", "edit"], env, JSON.stringify({ base_revision: read.revision, summary: "Create project index", edits: [{ op: "create", path: name, content: "# 中文\r\nRule: \"C:\\notes\"\r\n" }] }));
  assert.equal(result.code, 0, result.stderr);
  const saved = JSON.parse(result.stdout);
  await store.edit({ base_revision: saved.revision, summary: "Update rule", edits: [{ op: "replace", path: name, old_text: "Rule:", new_text: "条件:" }] });
  assert.equal(disk(env, name), "# 中文\r\n条件: \"C:\\notes\"\r\n");
  assert.deepEqual(fs.readdirSync(env.GEI_SPEC_HOME), ["projects"]);
});

test("ambiguous and failed later edits never partially update a batch", async t => {
  const { env, store } = fixture(t);
  const initial = await seed(store, { [name]: "same\nsame\n" });
  await assert.rejects(store.edit({ base_revision: initial.revision, summary: "Change", edits: [{ op: "replace", path: name, old_text: "same", new_text: "new" }] }), error => error.code === "AMBIGUOUS_MATCH" && error.details.matches === 2);
  await assert.rejects(store.edit({ base_revision: initial.revision, summary: "Change", edits: [
    { op: "create", path: "projects/example/topics/new.md", content: "new" },
    { op: "replace", path: name, old_text: "absent", new_text: "new" },
  ] }), { code: "NO_MATCH" });
  assert.equal(disk(env, name), "same\nsame\n");
  assert.ok(!fs.existsSync(path.join(env.GEI_SPEC_HOME, "projects/example/topics/new.md")));
});

test("move plus INDEX repair and ordered replacements persist as one revision", async t => {
  const { env, store } = fixture(t);
  const initial = await seed(store, { [name]: "[Topic](topics/old.md)\n", "projects/example/topics/old.md": "Old body" });
  const result = await store.edit({ base_revision: initial.revision, summary: "Move topic", edits: [
    { op: "create", path: "projects/example/topics/new.md", content: "Old body" },
    { op: "replace", path: "projects/example/topics/new.md", old_text: "Old", new_text: "New" },
    { op: "delete", path: "projects/example/topics/old.md" },
    { op: "replace", path: name, old_text: "old.md", new_text: "new.md" },
  ] });
  assert.equal(result.paths.length, 3);
  assert.equal(disk(env, name), "[Topic](topics/new.md)\n");
  assert.equal(disk(env, "projects/example/topics/new.md"), "New body");
  assert.ok(!fs.existsSync(path.join(env.GEI_SPEC_HOME, "projects/example/topics/old.md")));
});

test("two actual processes from one revision cannot overwrite each other", async t => {
  const { env, store } = fixture(t);
  const initial = await seed(store);
  const requests = ["First", "Second"].map(text => run([cli, "edit"], env, JSON.stringify({ base_revision: initial.revision, summary: text,
    edits: [{ op: "replace", path: name, old_text: "Old rule.", new_text: text }] })));
  const results = await Promise.all(requests);
  assert.equal(results.filter(result => result.code === 0).length, 1);
  assert.equal(JSON.parse(results.find(result => result.code !== 0).stderr).code, "REVISION_CONFLICT");
  assert.match(disk(env, name), /First|Second/);
});

test("read dependencies and native file changes invalidate a stale revision", async t => {
  const { env, store } = fixture(t);
  const initial = await seed(store, { [name]: "Rule A", "projects/example/topics/body.md": "Body" });
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, name), "Rule B");
  await assert.rejects(store.edit({ base_revision: initial.revision, summary: "Edit body", edits: [{ op: "replace", path: "projects/example/topics/body.md", old_text: "Body", new_text: "Based on A" }] }), error => error.code === "REVISION_CONFLICT" && error.details.changed_paths.includes(name));
  assert.equal(disk(env, "projects/example/topics/body.md"), "Body");
});

test("range reads and search are bounded and remain on the requested snapshot", async t => {
  const { store } = fixture(t);
  const initial = await seed(store, { [name]: Array.from({ length: 100 }, (_, i) => `Line ${i}`).join("\n") });
  const first = await store.read({ paths: [name], max_lines: 5 });
  assert.equal(first.files[0].next_line, 6);
  assert.equal(first.files[0].truncated, true);
  await store.edit({ base_revision: initial.revision, summary: "Change line", edits: [{ op: "replace", path: name, old_text: "Line 99", new_text: "Current 99" }] });
  const old = await store.read({ paths: [name], revision: first.revision, start_line: 100 });
  assert.equal(old.files[0].content, "Line 99");
  const found = await store.search({ query: "line", path_prefix: "projects/example/", max_results: 3 });
  assert.equal(found.results.length, 3); assert.equal(found.truncated, true);
});

test("recovery completes an interrupted batch before exposing documents", async t => {
  const { env, store } = fixture(t);
  await seed(store);
  writeJson(path.join(env.GEI_SPEC_STATE, "transaction.json"), { files: { [name]: "Recovered", "projects/example/topics/new.md": "Complete" } });
  const result = await store.read({ paths: [name, "projects/example/topics/new.md"] });
  assert.deepEqual(result.files.map(file => file.content), ["Recovered", "Complete"]);
  assert.ok(!fs.existsSync(path.join(env.GEI_SPEC_STATE, "transaction.json")));
});

test("long Unicode lines paginate with progress and search snippets include the match", async t => {
  const { store } = fixture(t);
  const content = "字".repeat(18000) + "needle at the end";
  await seed(store, { [name]: content });
  const first = await store.read({ paths: [name] });
  assert.ok(first.files[0].content.length > 0);
  assert.equal(first.files[0].next_line, 1);
  assert.ok(first.files[0].next_column > 1);
  const second = await store.read({ paths: [name], revision: first.revision, start_line: first.files[0].next_line, start_column: first.files[0].next_column });
  assert.equal(first.files[0].content + second.files[0].content, content);
  const result = await store.search({ query: "needle", path_prefix: "projects/example/" });
  assert.match(result.results[0].text, /needle/);
  assert.equal(result.results[0].snippet_truncated, true);
});

test("disable stops tools and both knowledge hooks, while router keeps other Skills", async t => {
  const { root, env, store } = fixture(t);
  await seed(store); await store.setEnabled(false);
  await assert.rejects(store.read({ paths: [name] }), { code: "DISABLED" });
  for (const hook of ["inject_context.mjs", "inject_shared.mjs"]) {
    const result = await run([path.join(source, "hooks", hook)], env, JSON.stringify({ cwd: root }));
    assert.equal(result.stdout, "");
  }
  const router = await run([path.join(source, "hooks/inject_using_gei.mjs")], { ...env, PLUGIN_ROOT: source });
  assert.match(router.stdout, /Spec is disabled/); assert.match(router.stdout, /work:/);
  await store.setEnabled(true);
  assert.equal((await store.read({ paths: [name] })).files[0].exists, true);
});

test("GitHub preview, import, exact edit, and snapshot reads use the actual adapter", async t => {
  const { store, api, env } = remoteFixture(t, { "context/INDEX.md": "Shared" });
  const local = await seed(store);
  const preview = await store.connect({ repo: "fixture/knowledge" });
  assert.deepEqual(preview.upload_paths, [name]); assert.equal((await store.status()).mode, "local");
  await store.connect({ repo: "fixture/knowledge", apply: true });
  assert.equal(api.commits, 1);
  await assert.rejects(store.edit({ base_revision: local.revision, summary: "Old binding", edits: [{ op: "delete", path: name }] }), { code: "REVISION" });
  const read = await store.read({ paths: [name, "context/INDEX.md"] });
  const edit = await store.edit({ base_revision: read.revision, summary: "Update rule", edits: [{ op: "replace", path: name, old_text: "Old rule.", new_text: "Remote rule." }] });
  assert.equal(edit.source, "github"); assert.equal(api.commits, 2);
  assert.match(api.revisions.get(api.head)[name], /Remote rule/);
  assert.match(disk(env, name), /Old rule/);
  assert.match((await store.read({ paths: [name], revision: read.revision })).files[0].content, /Old rule/);
  assert.ok(api.calls.every(call => call.options.headers.Authorization === "Bearer fixture-token"));
});

test("remote concurrent edits are rejected; lost successful responses are reconciled", async t => {
  const { store, api } = remoteFixture(t, { [name]: "Old rule." });
  await store.connect({ repo: "fixture/knowledge", apply: true });
  const read = await store.read({ paths: [name] });
  api.beforeCommit = () => api.advance({ [name]: "Other session" });
  await assert.rejects(store.edit({ base_revision: read.revision, summary: "Update", edits: [{ op: "replace", path: name, old_text: "Old rule.", new_text: "Mine" }] }), { code: "REVISION_CONFLICT" });
  assert.equal(api.revisions.get(api.head)[name], "Other session");
  const fresh = await store.read({ paths: [name] });
  api.loseResponse = true;
  const success = await store.edit({ base_revision: fresh.revision, summary: "Update", edits: [{ op: "replace", path: name, old_text: "Other session", new_text: "Merged" }] });
  assert.equal(success.verified_after_retry, true); assert.equal(api.commits, 1);
});

test("offline cached reads never become local writes, and explicit local switch preserves old files", async t => {
  const { store, api, env } = remoteFixture(t, { [name]: "Remote" });
  await store.connect({ repo: "fixture/knowledge", apply: true });
  const read = await store.read({ paths: [name] });
  const config = readJson(store.configFile); config.cacheSeconds = 0; writeJson(store.configFile, config);
  api.offline = true;
  const cached = await store.read({ paths: [name] });
  assert.equal(cached.stale, true); assert.equal(cached.source, "cache");
  await assert.rejects(store.edit({ base_revision: read.revision, summary: "Offline", edits: [{ op: "delete", path: name }] }), { code: "NETWORK" });
  assert.ok(!fs.existsSync(path.join(env.GEI_SPEC_HOME, name)));
  await assert.rejects(store.useLocal({ apply: true }), { code: "NETWORK" });
  fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, name)), { recursive: true });
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, name), "Old local data");
  const preview = await store.useLocal({ cached_revision: read.revision }); assert.equal(preview.preview, true);
  const switched = await store.useLocal({ cached_revision: read.revision, apply: true });
  assert.equal(disk(env, name), "Remote");
  assert.equal(readJson(switched.backup).files[name], "Old local data");
  assert.equal((await store.status()).mode, "local");
});

test("connection conflicts and public repositories do not change active mode", async t => {
  const { store, api } = remoteFixture(t, { [name]: "Remote" });
  await seed(store, { [name]: "Local" });
  await assert.rejects(store.connect({ repo: "fixture/knowledge", apply: true }), { code: "MIGRATION_CONFLICT" });
  assert.equal((await store.status()).mode, "local"); assert.equal(api.commits, 0);
  api.private = false;
  await assert.rejects(store.connect({ repo: "fixture/knowledge", apply: true }), { code: "CONFIG" });
});

test("private repository creation is previewed and explicit", async t => {
  const { store, api } = remoteFixture(t);
  api.exists = false;
  await store.connect({ repo: "fixture/knowledge", create: true });
  assert.equal(api.created, undefined);
  await store.connect({ repo: "fixture/knowledge", create: true, apply: true });
  assert.equal(api.created.private, true);
  assert.equal((await store.status()).mode, "github");
});

test("connection rejects combined path collisions and rebinding before remote mutations", async t => {
  const { store, api } = remoteFixture(t, { "projects/example/topics/API.md": "Remote" });
  await seed(store, { "projects/example/topics/api.md": "Local" });
  await assert.rejects(store.connect({ repo: "fixture/knowledge", apply: true }), { code: "INVALID_PATH" });
  assert.equal(api.commits, 0);
  assert.equal((await store.status()).mode, "local");
  const other = remoteFixture(t);
  await other.store.connect({ repo: "fixture/knowledge", apply: true });
  other.api.exists = false;
  await assert.rejects(other.store.connect({ repo: "fixture/another", create: true, apply: true }), { code: "CONFIG" });
  assert.equal(other.api.created, undefined);
});

test("MCP starts from copied host configurations, validates schema, and survives restart", async t => {
  const { root, env } = fixture(t);
  const packaged = path.join(root, "package with spaces");
  for (const name of ["skills", ".codex-plugin", ".claude-plugin", ".mcp.json"]) fs.cpSync(path.join(source, name), path.join(packaged, name), { recursive: true });
  for (const configPath of [".codex-plugin/spec.mcp.json", ".mcp.json"]) {
    const config = readJson(path.join(packaged, configPath)).mcpServers.spec;
    const args = config.args.map(arg => arg.replaceAll("${CLAUDE_PLUGIN_ROOT}", packaged));
    const cwd = config.cwd ? path.resolve(packaged, config.cwd) : root;
    const requests = [
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } } },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "spec_read", arguments: { paths: [name] } } },
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "spec_read", arguments: { paths: [name], unknown: true } } },
    ];
    const runResult = await run(args, env, requests.map(request => JSON.stringify(request)).join("\n") + "\n", cwd);
    assert.equal(runResult.code, 0, runResult.stderr);
    const responses = runResult.stdout.trim().split("\n").map(line => JSON.parse(line));
    assert.equal(responses[0].result.protocolVersion, "2025-11-25");
    assert.deepEqual(responses[1].result.tools.map(tool => tool.name), tools.map(tool => tool.name));
    assert.equal(responses[2].result.structuredContent.files[0].exists, false);
    assert.equal(responses[3].result.isError, true);
    const revision = responses[2].result.structuredContent.revision;
    const saved = await run(args, env, JSON.stringify({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "spec_edit", arguments: {
      base_revision: revision, summary: "Create through MCP", edits: [{ op: "create", path: name, content: "MCP saved" }],
    } } }) + "\n", cwd);
    assert.equal(JSON.parse(saved.stdout).result.structuredContent.applied, true);
    assert.equal(disk(env, name), "MCP saved");
    fs.rmSync(path.join(env.GEI_SPEC_HOME, name));
  }
});

test("paths cannot escape the store and portable name collisions fail atomically", async t => {
  const { store } = fixture(t);
  await assert.rejects(store.read({ paths: ["projects/example/../../secret.md"] }), { code: "INVALID_PATH" });
  const initial = await seed(store);
  await assert.rejects(store.edit({ base_revision: initial.revision, summary: "Collision", edits: [{ op: "create", path: "projects/example/index.md", content: "duplicate" }] }), { code: "INVALID_PATH" });
});

test("a crashed owner is recovered by competing processes without an empty lock or overlap", async t => {
  const { env } = fixture(t);
  const worker = path.join(source, "tests/lock-worker.mjs");
  for (let round = 0; round < 3; round++) {
    assert.equal((await run([worker, "--crash"], env)).code, 23);
    const owner = readJson(path.join(env.GEI_SPEC_STATE, "operation.lock"));
    assert.ok(owner.id && owner.pid);
    const results = await Promise.all(Array.from({ length: 8 }, () => run([worker], env)));
    for (const result of results) assert.equal(result.code, 0, result.stderr);
  }
  assert.deepEqual(readJson(path.join(env.GEI_SPEC_STATE, "counter.json")), { count: 24, active: false });
});

test("ancestor and existing-directory conflicts are rejected before journal publication", async t => {
  const { store, env } = fixture(t);
  const initial = await seed(store);
  await assert.rejects(store.edit({ base_revision: initial.revision, summary: "Invalid hierarchy", edits: [
    { op: "create", path: "projects/example/topic.md", content: "parent" },
    { op: "create", path: "projects/example/topic.md/notes.md", content: "child" },
  ] }), { code: "INVALID_PATH" });
  assert.ok(!fs.existsSync(path.join(env.GEI_SPEC_HOME, "projects/example/topic.md")));
  assert.ok(!fs.existsSync(path.join(env.GEI_SPEC_STATE, "transaction.json")));
  fs.mkdirSync(path.join(env.GEI_SPEC_HOME, "projects/example/directory.md"));
  await assert.rejects(store.edit({ base_revision: initial.revision, summary: "Directory collision", edits: [
    { op: "replace", path: name, old_text: "Old rule.", new_text: "New rule." },
    { op: "create", path: "projects/example/directory.md", content: "collision" },
  ] }), { code: "INVALID_PATH" });
  assert.match(disk(env, name), /Old rule/);
  assert.equal((await store.status()).mode, "local");
});

test("remote portability checks include documents absent from the body cache", async t => {
  const { store, api } = remoteFixture(t);
  await store.connect({ repo: "fixture/knowledge", apply: true });
  api.advance({ "projects/example/topics/API.md": "Not read yet" });
  await store.latest(store.config(), { refresh: true });
  const read = await store.read({ paths: [name] });
  await assert.rejects(store.edit({ base_revision: read.revision, summary: "Case collision", edits: [{ op: "create", path: "projects/example/topics/api.md", content: "collision" }] }), { code: "INVALID_PATH" });
  assert.equal(api.commits, 0);
  assert.equal(Object.keys(api.revisions.get(api.head)).length, 1);
});
