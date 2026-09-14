import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bodyHash, parseDocument, contentHash, metadataFor } from "../skills/memo/scripts/spec/metadata.mjs";
import { lifecycle } from "../skills/memo/scripts/spec/maintenance.mjs";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { GitHub } from "../skills/memo/scripts/spec/github.mjs";
import { hash, readJson, writeJson, metadataPath, scan } from "../skills/memo/scripts/spec/io.mjs";
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
const stored = (env, relative) => fs.readFileSync(path.join(env.GEI_SPEC_HOME, relative), "utf8");
const disk = stored;
const stateOnDisk = (env, relative) => JSON.parse(stored(env, metadataPath(relative)));
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
    if (pathname === "/repos/fixture/knowledge") return this.exists === false ? this.response({ message: "Not Found" }, 404) : this.response({ private: this.private !== false, full_name: "fixture/knowledge", default_branch: "main", permissions: this.permissions ?? { push: true } });
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
      if (this.rejectWrites) return this.response({ message: "Resource not accessible by integration" }, 403);
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
  assert.deepEqual(fs.readdirSync(env.GEI_SPEC_HOME), ["metadata", "projects"]);
});

test("Markdown revisions survive restart and reject previous coordinate contracts and other bindings", async t => {
  const { env, store } = fixture(t);
  const saved = await seed(store);
  assert.match(saved.revision, /^r_[a-f0-9]{16}$/u);
  const restarted = new SpecStore({ env });
  assert.equal((await restarted.read({ paths: [name], revision: saved.revision })).files[0].content, disk(env, name));
  const oid = store.oid(store.config(), saved.revision);
  const oldReference = `r_${hash(`${store.target(store.config())}:${oid}`).slice(0, 16)}`;
  writeJson(path.join(env.GEI_SPEC_STATE, "revisions", oldReference + ".json"), { target: store.target(store.config()), oid });
  await assert.rejects(store.edit({ base_revision: oldReference, summary: "Old virtual coordinates", edits: [{ op: "replace_lines", path: name, start_line: 1, end_line: 1, new_text: "Wrong" }] }), { code: "REVISION" });
  await assert.rejects(store.read({ paths: [name], revision: `${store.target(store.config())}:${oid}` }), { code: "REVISION" });
  const legacy = `${store.target(store.config())}:markdown:${store.oid(store.config(), saved.revision)}`;
  const read = await restarted.read({ paths: [name], revision: legacy });
  assert.equal(read.revision, saved.revision);
  await assert.rejects(store.read({ paths: [name], revision: "r_0000000000000000" }), { code: "REVISION" });
  writeJson(store.configFile, { ...store.config(), generation: "another-binding" });
  await assert.rejects(store.read({ paths: [name], revision: saved.revision }), { code: "REVISION" });
  await assert.rejects(store.read({ paths: [name], revision: legacy }), { code: "REVISION" });
});

test("numbered reads and base-relative line replacements avoid repeating old content", async t => {
  const { store, env } = fixture(t);
  const saved = await seed(store, { [name]: "Title\r\nold A\r\nold B\r\nkeep\r\nold C\r\n" });
  const read = await store.read({ paths: [name], start_line: 2, max_lines: 4, line_numbers: true });
  assert.equal(read.files[0].content, "2: old A\n3: old B\n4: keep\n5: old C");
  assert.equal(read.files[0].line_numbers, true);
  await store.edit({ base_revision: saved.revision, summary: "Replace two sections", edits: [
    { op: "replace_lines", path: name, start_line: 2, end_line: 3, new_text: "new A\n" },
    { op: "replace_lines", path: name, start_line: 5, end_line: 5, new_text: "new C\nextra" },
  ] });
  assert.equal(disk(env, name), "Title\r\nnew A\r\nkeep\r\nnew C\r\nextra\r\n");
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Old line numbers", edits: [
    { op: "replace_lines", path: name, start_line: 4, end_line: 4, new_text: "Wrong" },
  ] }), { code: "REVISION_CONFLICT" });
});

test("line ranges reject overlap, mixed addressing, and invalid bounds before any publication", async t => {
  const { store, env } = fixture(t);
  const saved = await seed(store, { [name]: "one\ntwo\nthree" });
  const range = { op: "replace_lines", path: name, start_line: 1, end_line: 2, new_text: "replacement" };
  for (const edits of [
    [range, { ...range, start_line: 2, end_line: 3 }],
    [range, { op: "replace", path: name, old_text: "three", new_text: "other" }],
    [{ ...range, end_line: 9 }],
    [{ ...range, start_line: 0 }],
  ]) {
    await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Invalid ranges", edits: [
      { op: "create", path: "projects/example/new.md", content: "Must not exist" }, ...edits,
    ] }), error => error.code === "RANGE" && error.details.applied === false && error.details.read.paths[0] === name);
    assert.equal(disk(env, name), "one\ntwo\nthree");
    assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, "projects/example/new.md")), false);
  }
});

test("line replacement deletion and final newline handling preserve untouched bytes", async t => {
  for (const [original, start, end, replacement, expected] of [
    ["one\ntwo\nthree", 2, 2, "", "one\nthree"],
    ["one\ntwo", 2, 2, "new\n", "one\nnew"],
    ["one\ntwo\n", 2, 2, "new", "one\nnew\n"],
    ["one\r\ntwo\nthree", 2, 2, "new\nmore", "one\r\nnew\nmore\nthree"],
    ["one\ntwo\n", 1, 3, "", ""],
    ["", 1, 1, "new", "new"],
  ]) {
    const { store, env } = fixture(t);
    const saved = await seed(store, { [name]: original });
    await store.edit({ base_revision: saved.revision, summary: "Replace lines", edits: [
      { op: "replace_lines", path: name, start_line: start, end_line: end, new_text: replacement },
    ] });
    assert.equal(disk(env, name), expected);
  }
});

test("match errors carry bounded numbered context and a pinned reread request", async t => {
  const { store, env } = fixture(t);
  const saved = await seed(store, { [name]: "# Rules\r\nID: 123-abc\r\nRule: enabled\r\nRule: enabled\r\n" });
  for (const [old_text, code] of [["ID: 123-abx", "NO_MATCH"], ["Rule: enabled", "AMBIGUOUS_MATCH"]]) {
    await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Diagnose match", edits: [
      { op: "replace", path: name, old_text, new_text: "Updated" },
    ] }), error => {
      assert.equal(error.code, code);
      assert.equal(error.details.read.revision, saved.revision);
      assert.equal(error.details.read.line_numbers, true);
      assert.match(error.details.context, /2: ID: 123-abc/);
      assert.ok(Buffer.byteLength(error.details.context) <= 2400);
      return true;
    });
  }
  assert.match(disk(env, name), /ID: 123-abc/);
});

test("exact replacement rejects overlapping occurrences instead of guessing the first", async t => {
  const { store, env } = fixture(t);
  const saved = await seed(store, { [name]: "aaa" });
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Ambiguous overlap", edits: [
    { op: "replace", path: name, old_text: "aa", new_text: "b" },
  ] }), error => error.code === "AMBIGUOUS_MATCH" && error.details.matches === 2);
  assert.equal(disk(env, name), "aaa");
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

test("numbered long-line pages fit the content budget and columns still address raw text", async t => {
  const { store } = fixture(t);
  const content = "字".repeat(18000) + "end";
  await seed(store, { [name]: content });
  const first = await store.read({ paths: [name], line_numbers: true });
  assert.ok(Buffer.byteLength(first.files[0].content) <= 48000);
  const next = await store.read({ paths: [name], revision: first.revision, start_line: first.files[0].next_line,
    start_column: first.files[0].next_column, line_numbers: true });
  assert.equal(first.files[0].content.slice(3) + next.files[0].content.slice(3), content);
  assert.equal(next.files[0].truncated, false);
});

test("search scopes literal full-text matches by knowledge prefix, not current checkout", async t => {
  const { store } = fixture(t);
  await seed(store, { [name]: "First\nNeedle one\n", "projects/another/INDEX.md": "NEEDLE two", "context/INDEX.md": "Needle shared" });
  const scoped = await store.search({ query: "needle", path_prefix: "projects/example/" });
  assert.deepEqual(scoped.results.map(result => result.path), [name]);
  assert.equal(scoped.results[0].line, 2);
  assert.equal((await store.search({ query: "needle" })).results.length, 2);
  assert.equal((await store.search({ query: "needle", path_prefix: "context/" })).results.length, 1);
  assert.equal((await store.search({ query: "Needle.*" })).results.length, 0);
});

test("GitHub tools and installed Hook entrypoints work without the former local directory", async t => {
  const hookIndex = `projects/${path.basename(source).toLowerCase()}/INDEX.md`;
  const { store, env } = remoteFixture(t, { [hookIndex]: "# Remote-only project\n", "context/INDEX.md": "# Remote-only shared\n" });
  await store.connect({ repo: "fixture/knowledge", apply: true });
  assert.equal(fs.existsSync(env.GEI_SPEC_HOME), false);
  const read = await store.read({ paths: [hookIndex] });
  await store.edit({ base_revision: read.revision, summary: "Remote-only update", edits: [
    { op: "replace_lines", path: hookIndex, start_line: 1, end_line: 1, new_text: "# Remote-only updated" },
  ] });
  for (const hook of ["inject_context.mjs", "inject_shared.mjs"]) {
    const result = await run([path.join(source, "hooks", hook)], env, JSON.stringify({ cwd: source }));
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Spec: github; cache/);
    assert.match(result.stdout, /Remote-only/);
  }
  assert.equal(fs.existsSync(env.GEI_SPEC_HOME), false);
});

test("project Hook waits for a concurrent GitHub shared-index refresh", async t => {
  const projectIndex = `projects/${path.basename(source).toLowerCase()}/INDEX.md`;
  const projectContent = "# Project\n\n- [Final project route](topics/runtime/README.md)\n";
  const sharedContent = "# Shared\n\n- Final shared condition\n";
  const { store, api, env } = remoteFixture(t, {
    [projectIndex]: projectContent, "context/INDEX.md": sharedContent,
  });
  await store.connect({ repo: "fixture/knowledge", apply: true });
  const config = store.config();
  writeJson(store.headFile(config), { oid: api.head, checkedAt: "2000-01-01T00:00:00.000Z" });
  const entered = Promise.withResolvers();
  const fetcher = store.github.fetcher;
  store.github.fetcher = async (url, options) => {
    if (url.includes("/git/ref/heads/")) {
      entered.resolve();
      await new Promise(resolve => setTimeout(resolve, 900));
    }
    return fetcher(url, options);
  };
  const shared = store.index("context/INDEX.md");
  await entered.promise;
  const [sharedResult, projectResult] = await Promise.all([
    shared, run([path.join(source, "hooks/inject_context.mjs")], env, JSON.stringify({ cwd: source })),
  ]);
  assert.equal(sharedResult.content, sharedContent);
  assert.equal(projectResult.code, 0, projectResult.stderr);
  const output = JSON.parse(projectResult.stdout);
  assert.ok(output.hookSpecificOutput, projectResult.stdout);
  assert.ok(output.hookSpecificOutput.additionalContext.endsWith(projectContent.trim()));
  assert.equal(fs.existsSync(env.GEI_SPEC_HOME), false);
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
  assert.deepEqual(preview.upload_paths.sort(), [name, metadataPath(name)].sort()); assert.equal((await store.status()).mode, "local");
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

test("connection uses API access rather than user push metadata for integration tokens", async t => {
  const { store, api } = remoteFixture(t, { [name]: "# Existing\n" });
  api.permissions = { contents: "write", metadata: "read" };
  await store.connect({ repo: "fixture/knowledge", apply: true });
  assert.equal(api.commits, 0);
  const read = await store.read({ paths: [name] });
  const saved = await store.edit({ base_revision: read.revision, summary: "Integration write", edits: [{ op: "replace", path: name, old_text: "Existing", new_text: "Updated" }] });
  assert.equal(saved.applied, true);
  api.rejectWrites = true;
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Denied write", edits: [{ op: "replace", path: name, old_text: "Updated", new_text: "Denied" }] }), { code: "SUBMISSION_UNCONFIRMED" });
  assert.equal(api.revisions.get(api.head)[name], "# Updated\n");
  const denied = remoteFixture(t);
  await seed(denied.store);
  denied.api.permissions = { push: false };
  denied.api.rejectWrites = true;
  await assert.rejects(denied.store.connect({ repo: "fixture/knowledge", apply: true }), { code: "GITHUB" });
  assert.equal(denied.store.config().mode, "local");
  assert.equal(denied.api.commits, 0);
});

test("connection accepts checkout newline conversion without rewriting either copy", async t => {
  const remote = "# Example\nRule.\n";
  const local = remote.replaceAll("\n", "\r\n");
  const added = "projects/example/topics/new.md";
  const { store, api, env } = remoteFixture(t, { [name]: remote });
  await seed(store, { [added]: "New.\r\n" });
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, name), local);
  const preview = await store.connect({ repo: "fixture/knowledge" });
  assert.deepEqual(preview.upload_paths.sort(), [added, metadataPath(added)].sort());
  assert.equal((await store.status()).mode, "local");
  await store.connect({ repo: "fixture/knowledge", apply: true });
  assert.equal(api.commits, 1);
  assert.equal(api.revisions.get(api.head)[name], remote);
  assert.equal(api.revisions.get(api.head)[added], "New.\r\n");
  assert.equal(disk(env, name), local);
  const read = await store.read({ paths: [name] });
  assert.equal(read.files[0].content, remote);
  await assert.rejects(store.edit({ base_revision: read.revision, summary: "Exact means exact", edits: [
    { op: "replace", path: name, old_text: local, new_text: "Changed" },
  ] }), { code: "NO_MATCH" });
});

test("connection still rejects meaningful whitespace and final newline differences", async t => {
  for (const local of ["Rule.  \r\n", "Rule.", "Other.\r\n"]) {
    const { store, api } = remoteFixture(t, { [name]: "Rule.\n" });
    await seed(store, { [name]: local });
    await assert.rejects(store.connect({ repo: "fixture/knowledge", apply: true }), { code: "MIGRATION_CONFLICT" });
    assert.equal((await store.status()).mode, "local");
    assert.equal(api.commits, 0);
  }
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
    fs.rmSync(path.join(env.GEI_SPEC_HOME, metadataPath(name)));
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

test("maintenance reviews preserve Markdown and do not turn inactivity into deletion", async t => {
  let now = Date.parse("2026-01-01T00:00:00Z");
  const { store, env } = fixture(t, { clock: () => now });
  const topic = "projects/example/topics/design.md";
  const saved = await seed(store, { [name]: "# Example\n", [topic]: "---\ntitle: Design\n---\n# Design\nA rare, durable constraint.\n" });
  const first = await store.check({ path_prefix: "projects/example/" });
  assert.equal(first.gc_eligible, 0);
  assert.equal(first.counts.unverified, 2);
  const before = disk(env, topic);
  const reviewed = await store.edit({ base_revision: saved.revision, summary: "Verify stable constraint", reviews: [{ path: topic, outcome: "verify", basis: "Requirement still applies", review_days: 90 }] });
  const read = await store.read({ paths: [topic] });
  assert.match(read.files[0].content, /^---\ntitle: Design\n---\n/u);
  assert.ok(read.files[0].content.endsWith("# Design\nA rare, durable constraint.\n"));
  assert.equal(stateOnDisk(env, topic).verified_at, new Date(now).toISOString());
  now += 100 * 86400000;
  const check = await store.check({ path_prefix: "projects/example/" });
  assert.ok(check.results.find(item => item.path === topic).reasons.includes("review_due"));
  assert.equal(check.gc_eligible, 0);
  assert.deepEqual((await store.gc({ path_prefix: "all" })).deleted, []);
  const unchanged = disk(env, topic);
  await store.search({ path_prefix: "projects/example/", query: "constraint" });
  assert.equal(disk(env, topic), unchanged);
  const changed = await store.edit({ base_revision: reviewed.revision, summary: "Ordinary correction", edits: [{ op: "replace", path: topic, old_text: "rare,", new_text: "infrequent," }] });
  assert.ok((await store.check({ path_prefix: "all" })).results.find(item => item.path === topic).reasons.includes("content_changed"));
  assert.notEqual(disk(env, topic), before);
  await assert.rejects(store.edit({ base_revision: changed.revision, summary: "Cannot destroy knowledge", reviews: [{ path: topic, outcome: "verify", basis: "Old", delete_after: "2026-01-01T00:00:00Z", deletion_reason: "Old" }] }), { code: "RETENTION" });
});

test("maintenance deferral cools an unresolved item without renewing evidence", async t => {
  let now = Date.parse("2026-01-01T00:00:00Z");
  const { store, env } = fixture(t, { clock: () => now });
  const task = "projects/example/tasks/release.md";
  const saved = await seed(store, { [task]: "# Release\nCommit exists; deployment unknown.\n" });
  await store.edit({ base_revision: saved.revision, summary: "Deployment needs evidence", reviews: [{ path: task, outcome: "defer", basis: "Deployment target unavailable" }] });
  const read = await store.read({ paths: [task] });
  assert.equal(stateOnDisk(env, task).kind, "handoff");
  assert.equal(stateOnDisk(env, task).verified_at, undefined);
  assert.equal((await store.check({ path_prefix: "all" })).cooling, 1);
  now += 31 * 86400000;
  assert.equal((await store.check({ path_prefix: "all" })).candidates, 1);
  assert.deepEqual((await store.gc({ path_prefix: "all" })).deleted, []);
});

test("GC preview is inert and apply repairs navigation with recoverable local deletion", async t => {
  const now = Date.parse("2026-04-01T00:00:00Z");
  const { store, env } = fixture(t, { clock: () => now });
  const transient = "projects/example/notes/scratch.md";
  const saved = await seed(store, { [name]: "# Example\n- [Scratch](notes/scratch.md)\n", [transient]: "# Scratch\nDisposable result.\n" });
  await store.edit({ base_revision: saved.revision, summary: "Declare disposable result", reviews: [{ path: transient, outcome: "verify", kind: "transient", basis: "One-off result", delete_after: "2026-03-01T00:00:00Z", deletion_reason: "Explicit one-off retention ended" }] });
  const original = disk(env, transient);
  const originalStored = stored(env, transient), originalIndex = stored(env, name);
  const preview = await store.gc({ path_prefix: "projects/example/" });
  assert.deepEqual(preview.deleted, [transient]);
  assert.equal(disk(env, transient), original);
  assert.equal(preview.applied, false);
  await assert.rejects(store.gc({ path_prefix: "all", apply: true }), { code: "REVISION_CONFLICT" });
  await assert.rejects(store.gc({ path_prefix: "all", apply: true, base_revision: preview.revision, plan_id: preview.plan_id }), { code: "PLAN_CHANGED" });
  const result = await store.gc({ path_prefix: "projects/example/", apply: true, base_revision: preview.revision, plan_id: preview.plan_id });
  assert.equal(result.applied, true);
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, transient)), false);
  assert.equal(disk(env, name), "# Example\n");
  const recovery = await store.restore({ backup: result.backup });
  assert.deepEqual(recovery.conflicts, []);
  await store.restore({ backup: result.backup, apply: true });
  assert.equal(disk(env, transient), original);
  assert.equal(stored(env, transient), originalStored);
  assert.equal(stored(env, name), originalIndex);
  assert.equal(disk(env, name), "# Example\n- [Scratch](notes/scratch.md)\n");
});

test("GC blocks substantive, reference-style, and cross-project dependencies", async t => {
  const { store } = fixture(t);
  const transient = "projects/example/old.md";
  const saved = await seed(store, { [transient]: "# Old\n", [name]: "# Example\nUse [Old](old.md) to decide the requirement.\n", "projects/other/INDEX.md": "# Other\n[Important][old]\n\n[old]: ../example/old.md\n" });
  await store.edit({ base_revision: saved.revision, summary: "Explicit temporary retention", reviews: [{ path: transient, outcome: "verify", kind: "transient", basis: "Temporary", delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Temporary retention ended" }] });
  const preview = await store.gc({ path_prefix: "projects/example/" });
  assert.deepEqual(preview.deleted, []);
  assert.equal(preview.blocked.length, 1);
  assert.equal(preview.blocked[0].incoming_total, 2);
  await assert.rejects(store.edit({ base_revision: preview.revision, summary: "Unrepaired deletion", reviews: [{ path: transient, outcome: "delete", basis: "No longer needed" }] }), { code: "DEPENDENCY" });
  await store.edit({ base_revision: preview.revision, summary: "Resolve dependencies and delete", edits: [
    { op: "replace", path: name, old_text: "Use [Old](old.md) to decide the requirement.", new_text: "The confirmed requirement is now recorded here." },
    { op: "replace", path: "projects/other/INDEX.md", old_text: "[Important][old]\n\n[old]: ../example/old.md", new_text: "Requirement moved to current native documentation." },
  ], reviews: [{ path: transient, outcome: "delete", basis: "Relevant requirement preserved in current owners" }] });
});

test("same-named indexes and topics do not create dependencies across projects", async t => {
  const { store, env } = fixture(t);
  const retired = "projects/retired/INDEX.md", topic = "projects/retired/topics/README.md";
  const other = "projects/current/INDEX.md", otherTopic = "projects/current/topics/README.md";
  const original = "# Current\n- [Topic](topics/README.md)\nUse `README.md` for native project instructions.\n";
  await seed(store, { [retired]: "# Retired\n- [Topic](topics/README.md)\n", [topic]: "# Topic\n", [other]: original, [otherTopic]: "# Current topic\n" });
  const check = await store.check({ path_prefix: "projects/retired/" });
  assert.deepEqual(check.results.find(item => item.path === retired).incoming, []);
  assert.deepEqual(check.results.find(item => item.path === topic).incoming.map(item => item.path), [retired]);
  await store.edit({ base_revision: check.revision, summary: "Remove retired project", reviews: [retired, topic].map(path => ({ path, outcome: "delete", basis: "Project explicitly retired" })) });
  assert.equal(disk(env, other), original);
  assert.equal(disk(env, otherTopic), "# Current topic\n");
});

test("textual dependencies resolve local and knowledge-root paths without basename guessing", async t => {
  const { store } = fixture(t);
  const target = "projects/example/README.md";
  const local = "projects/example/decision.md", cross = "projects/other/decision.md";
  await seed(store, { [target]: "# Requirement\n", [local]: "Consult `README.md` before changing scope.\n", [cross]: "Consult projects/example/README.md and ../example/README.md.\n" });
  const check = await store.check({ path_prefix: "projects/example/" });
  assert.deepEqual(check.results.find(item => item.path === target).incoming.map(item => item.path).sort(), [local, cross].sort());
  await assert.rejects(store.edit({ base_revision: check.revision, summary: "Incomplete removal", reviews: [{ path: target, outcome: "delete", basis: "Superseded" }] }), { code: "DEPENDENCY" });
});

test("changed transient content revokes mechanical disposal and stale GC cannot apply", async t => {
  const { store } = fixture(t);
  const transient = "projects/example/temp.md";
  const saved = await seed(store, { [transient]: "# Temp\nOld result.\n" });
  await store.edit({ base_revision: saved.revision, summary: "Set finite retention", reviews: [{ path: transient, outcome: "verify", kind: "transient", basis: "Disposable", delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Expired result" }] });
  const preview = await store.gc({ path_prefix: "all" });
  await store.edit({ base_revision: preview.revision, summary: "Add a new finding", edits: [{ op: "replace", path: transient, old_text: "Old result.", new_text: "A new accepted constraint." }] });
  await assert.rejects(store.gc({ path_prefix: "all", apply: true, base_revision: preview.revision, plan_id: preview.plan_id }), { code: "REVISION_CONFLICT" });
  assert.deepEqual((await store.gc({ path_prefix: "all" })).deleted, []);
  assert.ok((await store.check({ path_prefix: "all" })).results[0].reasons.includes("destruction_content_changed"));
});

test("source and environment observations remain scoped and unavailable evidence cannot delete", async t => {
  const { store, root } = fixture(t);
  const topic = "projects/example/notes/environment.md";
  const checkout = path.join(root, "checkout"); fs.mkdirSync(checkout); fs.writeFileSync(path.join(checkout, "config.txt"), "original");
  const saved = await seed(store, { [topic]: "# Environment\nConditional setup.\n" });
  await store.edit({ base_revision: saved.revision, summary: "Verify target setup", checkout_root: checkout, reviews: [{ path: topic, outcome: "verify", basis: "Checked current config", sources: ["config.txt"], scope: { environment: "other-installation", platform: "Windows" }, review_days: 30 }] });
  const unknown = await store.check({ path_prefix: "projects/example/" });
  assert.ok(unknown.results[0].reasons.includes("environment_unconfirmed"));
  assert.ok(unknown.results[0].reasons.includes("source_unavailable"));
  fs.writeFileSync(path.join(checkout, "config.txt"), "changed");
  const changed = await store.check({ path_prefix: "projects/example/", checkout_root: checkout });
  assert.ok(changed.results[0].reasons.includes("source_changed"));
  assert.equal(changed.gc_eligible, 0);
});

test("maintenance pagination and actual CLI/MCP expose bounded read-only scope", async t => {
  const { store, env } = fixture(t);
  await seed(store, Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`projects/example/n${index}.md`, `# ${index}\n`])));
  const first = await store.check({ path_prefix: "all", max_results: 5 });
  const next = await store.check({ path_prefix: "all", max_results: 5, offset: first.next_offset, revision: first.revision });
  assert.equal(first.remaining, 7); assert.equal(next.remaining, 2);
  assert.equal(new Set([...first.results, ...next.results].map(item => item.path)).size, 10);
  const command = await run([cli, "spec", "check", "--all", "--limit", "2", "--json"], env);
  assert.equal(command.code, 0, command.stderr);
  assert.equal(JSON.parse(command.stdout).results.length, 2);
  const mcp = path.join(source, "skills/memo/scripts/spec/mcp.mjs");
  const response = await run([mcp], env, JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "spec_gc", arguments: { path_prefix: "all" } } }) + "\n");
  assert.equal(JSON.parse(response.stdout).result.structuredContent.applied, false);
});

test("remote GC commits one batch, handles a lost reply, and refuses offline apply", async t => {
  const transient = "projects/example/temp.md";
  const { store, api } = remoteFixture(t, { [name]: "# Example\n- [Temp](temp.md)\n", [transient]: "# Temp\n" });
  await store.connect({ repo: "fixture/knowledge", apply: true });
  const read = await store.read({ paths: [transient] });
  await store.edit({ base_revision: read.revision, summary: "Declare retention", reviews: [{ path: transient, outcome: "verify", kind: "transient", basis: "Disposable result", delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Expired explicitly" }] });
  const preview = await store.gc({ path_prefix: "all" });
  api.offline = true;
  await assert.rejects(store.gc({ path_prefix: "all", apply: true, base_revision: preview.revision, plan_id: preview.plan_id }));
  assert.ok(api.revisions.get(api.head)[transient]);
  api.offline = false; api.loseResponse = true;
  const before = api.commits;
  const result = await store.gc({ path_prefix: "all", apply: true, base_revision: preview.revision, plan_id: preview.plan_id });
  assert.equal(result.applied, true); assert.equal(result.verified_after_retry, true);
  assert.equal(api.commits, before + 1);
  assert.equal(api.revisions.get(api.head)[name], "# Example\n");
  assert.equal(api.revisions.get(api.head)[transient], undefined);
});

test("GC plan identity rejects deadline expansion without a content change", async t => {
  let now = Date.parse("2026-01-01T00:00:00Z");
  const { store } = fixture(t, { clock: () => now });
  const transient = "projects/example/temp.md";
  const saved = await seed(store, { [transient]: "# Temporary\n" });
  await store.edit({ base_revision: saved.revision, summary: "Finite retention", reviews: [{ path: transient, outcome: "verify", kind: "transient", basis: "Disposable", delete_after: "2026-01-02T00:00:00Z", deletion_reason: "Intentional one-day retention" }] });
  const preview = await store.gc({ path_prefix: "all" });
  assert.deepEqual(preview.deleted, []);
  now += 2 * 86400000;
  await assert.rejects(store.gc({ path_prefix: "all", apply: true, base_revision: preview.revision, plan_id: preview.plan_id }), { code: "PLAN_CHANGED" });
  assert.equal((await store.read({ paths: [transient] })).files[0].exists, true);
});

test("maintenance hints are bounded by check cadence and disabled with Spec", async t => {
  let now = Date.parse("2026-01-01T00:00:00Z");
  const { store } = fixture(t, { clock: () => now });
  await seed(store);
  assert.match(store.maintenanceHint("projects/example/"), /spec_check/u);
  await store.check({ path_prefix: "projects/example/" });
  assert.equal(store.maintenanceHint("projects/example/"), "");
  now += 8 * 86400000;
  assert.match(store.maintenanceHint("projects/example/"), /spec_check/u);
  await store.setEnabled(false);
  assert.equal(store.maintenanceHint("projects/example/"), "");
  await assert.rejects(store.check({ path_prefix: "all" }), { code: "DISABLED" });
  await assert.rejects(store.gc({ path_prefix: "all" }), { code: "DISABLED" });
});

test("review evidence failure is atomic and changed sources reopen a defer", async t => {
  const { store, root, env } = fixture(t);
  const topic = "projects/example/note.md";
  const checkout = path.join(root, "code"); fs.mkdirSync(checkout); fs.writeFileSync(path.join(checkout, "config"), "v1");
  let saved = await seed(store, { [topic]: "# Conditional\n" });
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "No evidence", edits: [{ op: "create", path: name, content: "must not appear" }], reviews: [{ path: topic, outcome: "verify", basis: "" }] }), { code: "ARGUMENT" });
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, name)), false);
  saved = await store.edit({ base_revision: saved.revision, summary: "Baseline config", checkout_root: checkout, reviews: [{ path: topic, outcome: "verify", basis: "Observed config", sources: ["config"] }] });
  fs.writeFileSync(path.join(checkout, "config"), "v2");
  await store.edit({ base_revision: saved.revision, summary: "Need implementation diagnosis", checkout_root: checkout, reviews: [{ path: topic, outcome: "defer", basis: "Config changed; runtime unavailable" }] });
  assert.equal((await store.check({ path_prefix: "projects/example/", checkout_root: checkout })).cooling, 1);
  fs.writeFileSync(path.join(checkout, "config"), "v3");
  assert.equal((await store.check({ path_prefix: "projects/example/", checkout_root: checkout })).candidates, 1);
});

test("GC cannot mistake navigation with trailing prose or escaped targets for safe links", async t => {
  const { store } = fixture(t);
  const transient = "projects/example/old(result).md";
  const saved = await seed(store, { [transient]: "# Old\n", [name]: "# Example\n- [Old](old\\(result\\).md) is required (keep this explanation)\n" });
  await store.edit({ base_revision: saved.revision, summary: "Intentional retention", reviews: [{ path: transient, outcome: "verify", kind: "transient", basis: "Temporary", delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Expired" }] });
  const preview = await store.gc({ path_prefix: "all" });
  assert.deepEqual(preview.deleted, []);
  assert.equal(preview.blocked.length, 1);
});

test("actual Hook strips lifecycle frontmatter and scheduled runner previews by default", async t => {
  const { store, env, root } = fixture(t);
  const checkout = path.join(root, 'example'); fs.mkdirSync(checkout);
  const saved = await seed(store);
  await store.edit({ base_revision: saved.revision, summary: 'Verify index', reviews: [{ path: name, outcome: 'verify', basis: 'Current project background' }] });
  const hook = await run([path.join(source, 'hooks/inject_context.mjs')], env, JSON.stringify({cwd:checkout}));
  assert.equal(hook.code, 0, hook.stderr);
  const context = JSON.parse(hook.stdout).hookSpecificOutput.additionalContext;
  assert.ok(context.includes('Old rule.')); assert.ok(!context.includes('gei: {'));
  const runner = await run([path.join(source,'skills/memo/scripts/spec/gc-run.mjs'),'--scope','all'], env);
  assert.equal(runner.code, 0, runner.stderr);
  assert.equal(JSON.parse(runner.stdout).preview, true);
  assert.equal(JSON.parse(runner.stdout).applied, false);
});

test("GC preserves link items carrying inline-code meaning or nested explanations", async t => {
  const { store } = fixture(t);
  const a = 'projects/example/a.md', b = 'projects/example/b.md';
  const saved = await seed(store, { [name]: '# Example\n- [A](a.md) `required`\n- [B](b.md)\n  - This explains the current requirement.\n', [a]: '# A\n', [b]: '# B\n' });
  await store.edit({ base_revision: saved.revision, summary: 'Explicit disposable records', reviews: [a,b].map(path => ({path,outcome:'verify',kind:'transient',basis:'Disposable',delete_after:'2020-01-01T00:00:00Z',deletion_reason:'Retention ended'})) });
  const preview = await store.gc({path_prefix:'all'});
  assert.deepEqual(preview.deleted, []);
  assert.equal(preview.blocked.length, 2);
});

test("stored coordinates survive edits and migration across legacy and mixed frontmatter", async t => {
  const cases = [
    ["legacy", "# Title\nNeedle\nTail\n", "# Title\nNeedle\nTail\n", 2],
    ["other", "---\ntitle: Kept\n---\n# Title\nNeedle\nTail\n", "---\ntitle: Kept\n---\n# Title\nNeedle\nTail\n", 5],
    ["managed", '---\ngei: {"invalid":"hidden needle evidence"}\n---\n# Title\nNeedle\nTail\n', "# Title\nNeedle\nTail\n", 2],
    ["mixed", '\uFEFF---\r\ntitle: Kept\r\ngei: {"invalid":"hidden needle evidence"}\r\ntags: [one, two]\r\n---\r\n# Title\r\nNeedle\r\nTail\r\n', '\uFEFF---\r\ntitle: Kept\r\ntags: [one, two]\r\n---\r\n# Title\r\nNeedle\r\nTail\r\n', 6],
  ];
  for (const [label, raw, visible, line] of cases) {
    const { store, env } = fixture(t);
    const file = `projects/example/${label}.md`;
    fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, file)), { recursive: true });
    fs.writeFileSync(path.join(env.GEI_SPEC_HOME, file), raw);
    const read = await store.read({ paths: [file] });
    assert.equal(read.files[0].content, raw, label);
    assert.equal(read.files[0].knowledge, undefined);
    assert.equal(stored(env, file), raw, "read does not migrate the document");
    const matches = await store.search({ path_prefix: "projects/example/", query: "Needle", revision: read.revision });
    const actualLine = raw.split("\n").findIndex(row => row.replace(/\r$/u, "") === "Needle") + 1;
    assert.ok(matches.results.some(item => item.line === actualLine));
    assert.equal((await store.read({ paths: [file], revision: read.revision, start_line: actualLine, max_lines: 1, line_numbers: true })).files[0].content, `${actualLine}: Needle`);
    await assert.rejects(store.edit({ base_revision: read.revision, summary: "Find recovery context", edits: [{ op: "replace", path: file, old_text: "Needle absent", new_text: "Changed" }] }), error => {
      assert.ok(error.details.context.includes(`${actualLine}: Needle`));
      return error.code === "NO_MATCH";
    });
    const updated = await store.edit({ base_revision: read.revision, summary: "Replace visible line", edits: [{ op: "replace_lines", path: file, start_line: actualLine, end_line: actualLine, new_text: "Changed" }] });
    assert.equal((await store.read({ paths: [file] })).files[0].content, visible.replace("Needle", "Changed"));
    if (raw.includes("gei:")) { assert.ok(!stored(env, file).includes("gei:")); assert.ok(stateOnDisk(env, file).legacy_fields); }
    const next = await store.edit({ base_revision: updated.revision, summary: "Replace complete view", edits: [{ op: "replace", path: file, old_text: visible.replace("Needle", "Changed"), new_text: visible.replace("Needle", "Final") }] });
    assert.equal((await store.read({ paths: [file], revision: next.revision })).files[0].content, visible.replace("Needle", "Final"));
    assert.equal((await store.read({ paths: [file], revision: read.revision })).files[0].content, raw);
  }
});

test("large internal evidence cannot consume content pages or appear in search and errors", async t => {
  const { store, env } = fixture(t);
  fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, name)), { recursive: true });
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, name), "# Title\nSecond\nThird\n");
  writeJson(path.join(env.GEI_SPEC_HOME, metadataPath(name)), { hidden: "secret-marker " + "x".repeat(60000) });
  const read = await store.read({ paths: [name], max_lines: 2 });
  assert.equal(read.files[0].content, "# Title\nSecond");
  assert.equal(read.files[0].next_line, 3);
  assert.equal((await store.read({ paths: [name], revision: read.revision, start_line: 3 })).files[0].content, "Third\n");
  assert.deepEqual((await store.search({ query: "secret-marker" })).results, []);
  await assert.rejects(store.edit({ base_revision: read.revision, summary: "Bad range", edits: [{ op: "replace_lines", path: name, start_line: 5, end_line: 5, new_text: "Oops" }] }), error => {
    assert.equal(error.code, "RANGE"); assert.ok(!JSON.stringify(error.details).includes("secret-marker")); return true;
  });
  const checked = await store.check({ path_prefix: "all" });
  assert.deepEqual(checked.results[0].reasons, ["invalid_metadata"]);
  assert.ok(!JSON.stringify(checked).includes("secret-marker"));
  await store.edit({ base_revision: read.revision, summary: "Rebuild reviewed state", reviews: [{ path: name, outcome: "verify", basis: "All document claims checked against current source" }] });
  assert.equal((await store.check({ path_prefix: "all" })).candidates, 0);
});

test("ordinary edits preserve verification while explicit whole-document review renews it", async t => {
  let now = Date.parse("2026-01-01T00:00:00Z");
  const { store, env } = fixture(t, { clock: () => now });
  let saved = await seed(store, { [name]: "---\ntitle: Initial\n---\n# Title\nFirst fact.\nSecond fact.\n" });
  let state = stateOnDisk(env, name);
  assert.equal(state.verified_at, undefined); assert.equal(state.review_after, undefined);
  saved = await store.edit({ base_revision: saved.revision, summary: "Verify document", reviews: [{ path: name, outcome: "verify", basis: "Both facts and applicability verified from current requirements" }] });
  const baseline = stateOnDisk(env, name);
  now += 86400000;
  saved = await store.edit({ base_revision: saved.revision, summary: "Correct first fact", edits: [{ op: "replace", path: name, old_text: "First fact.", new_text: "First corrected fact." }] });
  state = stateOnDisk(env, name);
  assert.deepEqual(state, baseline);
  assert.ok((await store.check({ path_prefix: "all" })).results[0].reasons.includes("content_changed"));
  saved = await store.edit({ base_revision: saved.revision, summary: "Verify all facts after correction", reviews: [{ path: name, outcome: "verify", basis: "Both facts verified; source references are beside each claim" }] });
  assert.equal(stateOnDisk(env, name).verified_at, new Date(now).toISOString());
  await store.edit({ base_revision: saved.revision, summary: "Change applicability header", edits: [{ op: "replace_lines", path: name, start_line: 2, end_line: 2, new_text: "title: Changed" }] });
  assert.ok((await store.check({ path_prefix: "all" })).results[0].reasons.includes("content_changed"));
});

test("old lifecycle state remains readable and defer preserves its original verification", async t => {
  const { store, env } = fixture(t, { clock: () => Date.parse("2026-04-01T00:00:00Z") });
  const body = "# Old\nUnresolved environment.\n";
  const meta = { version: 1, kind: "knowledge", created_at: "2026-01-01T00:00:00Z", review_days: 30, verified_at: "2026-01-01T00:00:00Z", verified_hash: bodyHash(body), review_after: "2026-02-01T00:00:00Z", evidence: ["Original source"] };
  fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, name)), { recursive: true });
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, name), `---\ntitle: Old\ngei: ${JSON.stringify(meta)}\n---\n${body}`);
  const check = await store.check({ path_prefix: "all" });
  assert.deepEqual(check.results[0].reasons, ["review_due"]);
  assert.equal(check.results[0].basis, "Original source");
  await store.edit({ base_revision: check.revision, summary: "Need target evidence", reviews: [{ path: name, outcome: "defer", basis: "Target environment is unavailable" }] });
  const state = stateOnDisk(env, name);
  assert.equal(state.version, 1); assert.equal(state.verified_hash, meta.verified_hash); assert.equal(state.verified_at, meta.verified_at);
  assert.equal((await store.check({ path_prefix: "all" })).cooling, 1);
});

test("formatted maintenance works through CLI and MCP without exposing internal state", async t => {
  const { store, env } = fixture(t);
  await seed(store);
  const cliResult = await run([cli, "check", "--all"], env);
  assert.equal(cliResult.code, 0, cliResult.stderr);
  assert.match(cliResult.stdout, /Maintenance check: all/u);
  assert.match(cliResult.stdout, /Document has not been verified/u);
  assert.ok(!cliResult.stdout.includes('"results"'));
  const response = await run([path.join(source, "skills/memo/scripts/spec/mcp.mjs")], env, JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "spec_check", arguments: { path_prefix: "all" } } }) + "\n");
  const result = JSON.parse(response.stdout).result;
  assert.match(result.content[0].text, /Maintenance check: all/u);
  assert.equal(result.structuredContent.candidates, 1);
  assert.ok(!JSON.stringify(result).includes("fingerprint"));
  const rawRead = await store.read({ paths: [name] });
  assert.ok(!JSON.stringify(rawRead).includes("created_at"));
  assert.ok(!JSON.stringify(rawRead).includes("knowledge"));
});

test("verification preserves meaningful BOM frontmatter and partial corrections may defer", async t => {
  const { store, env } = fixture(t);
  const original = '\uFEFF---\r\ntitle: Context\r\n---\r\n# Title\r\nFirst.\r\nSecond.\r\n';
  let saved = await seed(store, { [name]: original });
  assert.equal((await store.read({ paths: [name] })).files[0].content, original);
  saved = await store.edit({ base_revision: saved.revision, summary: "Verify context", reviews: [{ path: name, outcome: "verify", basis: "Both claims checked" }] });
  const baseline = stateOnDisk(env, name);
  assert.equal((await store.read({ paths: [name] })).files[0].content, original);
  assert.equal((await store.check({ path_prefix: "all" })).candidates, 0);
  await store.edit({ base_revision: saved.revision, summary: "Correct first claim and defer the rest", edits: [{ op: "replace_lines", path: name, start_line: 5, end_line: 5, new_text: "First corrected." }], reviews: [{ path: name, outcome: "defer", basis: "Second claim needs evidence from its target environment" }] });
  assert.equal((await store.read({ paths: [name] })).files[0].content, original.replace("First.", "First corrected."));
  const state = stateOnDisk(env, name);
  assert.equal(state.verified_at, baseline.verified_at); assert.equal(state.verified_hash, baseline.verified_hash);
  assert.equal((await store.check({ path_prefix: "all" })).cooling, 1);
});

test("GC uses visible reference coordinates and ignores historical metadata references", async t => {
  const { store, env } = fixture(t);
  const target = "projects/example/probe.md", history = "projects/example/history.md";
  let saved = await seed(store, { [name]: '---\ntitle: Routes\n---\n# Routes\n- [Probe](probe.md)\n', [target]: '# Probe\n', [history]: '# History\nCurrent fact.\n' });
  saved = await store.edit({ base_revision: saved.revision, summary: "Verify old source note", reviews: [{ path: history, outcome: "verify", basis: `Previously used ${target}, now superseded by the source recorded in the body.` }, { path: target, outcome: "verify", kind: "transient", basis: "One-off probe complete", delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Explicitly disposable" }] });
  assert.equal(stateOnDisk(env, target).review_days, 30);
  const check = await store.check({ path_prefix: "all" });
  const item = check.results.find(item => item.path === target);
  assert.equal(item.incoming.length, 1); assert.equal(item.incoming[0].line, 5);
  const lineRead = await store.read({ paths: [name], revision: check.revision, start_line: item.incoming[0].line, max_lines: 1 });
  assert.equal(lineRead.files[0].content, "- [Probe](probe.md)");
  const preview = await store.gc({ path_prefix: "all" });
  assert.deepEqual(preview.deleted, [target]); assert.equal(preview.declarations[0].deletion_reason, "Explicitly disposable");
  await store.gc({ path_prefix: "all", base_revision: preview.revision, plan_id: preview.plan_id, apply: true });
  assert.equal((await store.read({ paths: [name] })).files[0].content, '---\ntitle: Routes\n---\n# Routes\n');
});

test("migration preserves verification, deferral and GC eligibility across both legacy hash formats", async t => {
  const now = Date.parse("2026-04-01T00:00:00Z");
  const { store, env } = fixture(t, { clock: () => now });
  const environment = store.environment();
  const originals = {}, expected = {}, baseline = {};
  for (const version of [1, 2]) for (const mixed of [false, true]) for (const state of ["verified", "changed", "deferred", "transient"]) {
    const file = `projects/example/v${version}-${mixed}-${state}.md`;
    const body = "# Fact\r\nConditional knowledge.\r\n";
    const meta = { version, kind: state === "transient" ? "transient" : "knowledge", created_at: "2026-01-01T00:00:00Z", review_days: 30,
      verified_at: "2026-01-01T00:00:00Z", review_after: "2026-05-01T00:00:00Z", basis: "Original evidence" };
    const raw = value => mixed ? `\uFEFF---\r\ntitle: Context\ngei: ${JSON.stringify(value)}\r\ntags: [one]\n---\r\n${body}` : `\uFEFF---\r\ngei: ${JSON.stringify(value)}\r\n---\r\n${body}`;
    meta.verified_hash = state === "changed" ? bodyHash("Prior fact") : contentHash(raw(meta), meta);
    if (state === "transient") Object.assign(meta, { delete_after: "2026-03-01T00:00:00Z", deletion_reason: "Disposable probe", deletion_hash: meta.verified_hash });
    if (state === "deferred") {
      meta.review_after = "2026-02-01T00:00:00Z";
      meta.deferred_fingerprint = lifecycle(raw(meta), { now, environment, state: { metadata: meta } }).fingerprint;
      meta.retry_after = "2026-05-01T00:00:00Z"; meta.attempt_reason = "Target evidence unavailable";
    }
    originals[file] = raw(meta);
    expected[file] = mixed ? `\uFEFF---\r\ntitle: Context\ntags: [one]\n---\r\n${body}` : `\uFEFF${body}`;
    baseline[file] = meta;
  }
  for (const [file, content] of Object.entries(originals)) {
    fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, file)), { recursive: true });
    fs.writeFileSync(path.join(env.GEI_SPEC_HOME, file), content);
  }
  const legacy = "context/unmanaged.md";
  fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, legacy)), { recursive: true });
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, legacy), "---\ntitle: Untouched\n---\n# Legacy\n");
  const before = await store.check({ path_prefix: "all", max_results: 100 });
  const gcBefore = await store.gc({ path_prefix: "all" });
  const preview = await store.migrateMetadata();
  assert.equal(preview.migrated.length, 16); assert.deepEqual(preview.blocked, []);
  assert.equal(stored(env, Object.keys(originals)[0]), Object.values(originals)[0]);
  const migrated = await store.migrateMetadata({ apply: true, base_revision: preview.revision });
  assert.equal(migrated.applied, true);
  const after = await store.check({ path_prefix: "all", max_results: 100 });
  assert.equal(after.cooling, before.cooling); assert.equal(after.cooling, 4);
  assert.deepEqual(after.results, before.results);
  assert.deepEqual((await store.gc({ path_prefix: "all" })).deleted, gcBefore.deleted);
  for (const file of Object.keys(originals)) {
    assert.equal(stored(env, file), expected[file]);
    const { migrated_hash, ...meta } = stateOnDisk(env, file);
    assert.deepEqual(meta, baseline[file]); assert.ok(migrated_hash);
    assert.equal((await store.read({ paths: [file] })).files[0].content, expected[file]);
    assert.equal((await store.read({ paths: [file], revision: preview.revision })).files[0].content, originals[file]);
  }
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, metadataPath(legacy))), false);
  assert.deepEqual((await store.migrateMetadata()).migrated, []);
  assert.equal((await store.migrateMetadata({ apply: true, base_revision: migrated.revision })).unchanged, true);
  const file = Object.keys(originals).find(file => file.includes("v1-true-verified"));
  const edited = await store.edit({ base_revision: migrated.revision, summary: "Change applicability", edits: [{ op: "replace_lines", path: file, start_line: 2, end_line: 2, new_text: "title: New context" }] });
  assert.ok((await store.check({ path_prefix: "all", max_results: 100 })).results.find(item => item.path === file).reasons.includes("content_changed"));
  await store.edit({ base_revision: edited.revision, summary: "Recheck complete note", reviews: [{ path: file, outcome: "verify", basis: "All claims and new applicability checked" }] });
  assert.equal(stateOnDisk(env, file).version, 3); assert.equal(stateOnDisk(env, file).migrated_hash, undefined);
});

test("remote migration is one commit, detects conflicts and preserves exact revision reads", async t => {
  const meta = { version: 1, kind: "knowledge", created_at: "2026-01-01T00:00:00Z", review_days: 30, verified_at: "2026-01-01T00:00:00Z", verified_hash: bodyHash("# Fact\n") };
  const raw = `---\ngei: ${JSON.stringify(meta)}\n---\n# Fact\n`;
  const { store, api, env } = remoteFixture(t, { [name]: raw });
  await store.connect({ repo: "fixture/knowledge", apply: true });
  const before = await store.read({ paths: [name] });
  assert.equal(before.files[0].content, raw); assert.equal(api.commits, 0);
  const preview = await store.migrateMetadata();
  assert.equal(api.commits, 0);
  api.loseResponse = true;
  const saved = await store.migrateMetadata({ apply: true, base_revision: preview.revision });
  assert.equal(saved.verified_after_retry, true); assert.equal(api.commits, 1);
  const files = api.revisions.get(api.head);
  assert.equal(files[name], "# Fact\n"); assert.equal(JSON.parse(files[metadataPath(name)]).verified_at, meta.verified_at);
  assert.equal((await store.read({ paths: [name] })).files[0].content, files[name]);
  assert.equal((await store.read({ paths: [name], revision: before.revision })).files[0].content, raw);
  await assert.rejects(store.migrateMetadata({ apply: true, base_revision: before.revision }), { code: "REVISION_CONFLICT" });
  api.advance({ ...files, [name]: raw });
  const blocked = await store.migrateMetadata(); assert.deepEqual(blocked.blocked, [name]);
  await assert.rejects(store.migrateMetadata({ apply: true, base_revision: blocked.revision }), { code: "METADATA_CONFLICT" });
  assert.equal(api.commits, 1);
  api.offline = true;
  await assert.rejects(store.migrateMetadata({ apply: true, base_revision: blocked.revision }), { code: "NETWORK" });
  assert.equal(fs.existsSync(env.GEI_SPEC_HOME), false);
});

test("rename moves metadata without renewal, repairs routes atomically, and deletion restores both", async t => {
  const { store, env } = fixture(t);
  const old = "projects/example/old.md", next = "projects/example/topics/new.md";
  let saved = await seed(store, { [old]: "# Decision\n", [name]: "# Example\n- [Decision](old.md)\n" });
  saved = await store.edit({ base_revision: saved.revision, summary: "Verify decision", reviews: [{ path: old, outcome: "verify", basis: "Accepted requirement confirmed" }] });
  const meta = stored(env, metadataPath(old));
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Move with missing route repair", edits: [{ op: "rename", path: old, to: next }] }), { code: "DEPENDENCY" });
  assert.equal(stored(env, old), "# Decision\n");
  saved = await store.edit({ base_revision: saved.revision, summary: "Move decision and its route", edits: [{ op: "rename", path: old, to: next }, { op: "replace", path: name, old_text: "(old.md)", new_text: "(topics/new.md)" }] });
  assert.equal(stored(env, metadataPath(next)), meta);
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, old)), false);
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, metadataPath(old))), false);
  const beforeDeletion = scan(env.GEI_SPEC_HOME);
  const deletion = await store.edit({ base_revision: saved.revision, summary: "Retire decision and route", edits: [{ op: "delete", path: next }, { op: "replace", path: name, old_text: "- [Decision](topics/new.md)\n", new_text: "" }] });
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, metadataPath(next))), false);
  await store.restore({ backup: deletion.backup, apply: true });
  assert.deepEqual(scan(env.GEI_SPEC_HOME), beforeDeletion);
  const read = await store.read({ paths: [next] });
  await assert.rejects(store.edit({ base_revision: read.revision, summary: "Reject mixed rename and range", edits: [{ op: "rename", path: next, to: old }, { op: "replace_lines", path: old, start_line: 1, end_line: 1, new_text: "# Changed" }] }), { code: "RANGE" });
});

test("ordinary legacy replacement retains state and stable GitHub edits keep metadata out of the body diff", async t => {
  const meta = { version: 2, kind: "knowledge", created_at: "2026-01-01T00:00:00Z", review_days: 90, verified_at: "2026-01-01T00:00:00Z", verified_hash: bodyHash("# Fact\nOne.\n") };
  const raw = `---\ngei: ${JSON.stringify(meta)}\n---\n# Fact\nOne.\n`;
  const { store, api } = remoteFixture(t, { [name]: raw });
  await store.connect({ repo: "fixture/knowledge", apply: true });
  let saved = await store.read({ paths: [name] });
  saved = await store.edit({ base_revision: saved.revision, summary: "Replace entire legacy file", edits: [{ op: "replace", path: name, old_text: raw, new_text: "# Fact\nTwo.\n" }] });
  let files = api.revisions.get(api.head);
  assert.equal(files[name], "# Fact\nTwo.\n"); assert.equal(JSON.parse(files[metadataPath(name)]).verified_at, meta.verified_at);
  assert.ok((await store.check({ path_prefix: "all" })).results[0].reasons.includes("content_changed"));
  const before = { ...files };
  saved = await store.edit({ base_revision: saved.revision, summary: "Correct one line", edits: [{ op: "replace_lines", path: name, start_line: 2, end_line: 2, new_text: "Three." }] });
  files = api.revisions.get(api.head);
  assert.equal(files[metadataPath(name)], before[metadataPath(name)]);
  const request = JSON.parse(api.calls.filter(call => call.url.endsWith("/graphql")).at(-1).options.body).variables.input;
  assert.deepEqual(request.fileChanges.additions.map(item => item.path), [name]);
  const markdown = files[name];
  await store.edit({ base_revision: saved.revision, summary: "Verify all claims", reviews: [{ path: name, outcome: "verify", basis: "Current source confirms the complete note" }] });
  assert.equal(api.revisions.get(api.head)[name], markdown);
  const verification = JSON.parse(api.calls.filter(call => call.url.endsWith("/graphql")).at(-1).options.body).variables.input;
  assert.deepEqual(verification.fileChanges.additions.map(item => item.path), [metadataPath(name)]);
});

test("metadata stays outside content tools, is revisioned, and survives export and recovery", async t => {
  const { store, api, env } = remoteFixture(t);
  await store.connect({ repo: "fixture/knowledge", apply: true });
  let saved = await seed(store);
  const raw = api.revisions.get(api.head)[name];
  saved = await store.edit({ base_revision: saved.revision, summary: "Add maintenance evidence", reviews: [{ path: name, outcome: "verify", basis: "internal-only-marker" }] });
  assert.equal((await store.read({ paths: [name] })).files[0].content, raw);
  assert.deepEqual((await store.search({ query: "internal-only-marker" })).results, []);
  assert.deepEqual((await store.search()).results, [{ path: name }]);
  await assert.rejects(store.read({ paths: [metadataPath(name)] }), { code: "INVALID_PATH" });
  const files = api.revisions.get(api.head);
  api.advance({ ...files, [metadataPath(name)]: files[metadataPath(name)].replace("internal-only-marker", "Changed evidence") });
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Stale maintenance premise", edits: [{ op: "replace", path: name, old_text: "Old", new_text: "New" }] }), error => error.code === "REVISION_CONFLICT" && error.details.changed_paths.includes(name));
  const expected = api.revisions.get(api.head);
  await store.useLocal({ apply: true });
  assert.deepEqual(scan(env.GEI_SPEC_HOME), expected);
  writeJson(path.join(env.GEI_SPEC_STATE, "transaction.json"), { files: { [name]: "# Recovered\n", [metadataPath(name)]: expected[metadataPath(name)] } });
  assert.equal((await store.read({ paths: [name] })).files[0].content, "# Recovered\n");
  assert.equal(stored(env, metadataPath(name)), expected[metadataPath(name)]);
});

test("migration CLI preserves malformed state without exposing it to maintenance or renewing it", async t => {
  const { store, env } = fixture(t);
  fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, name)), { recursive: true });
  const raw = "---\ngei: broken secret-marker\ngei: duplicate\n---\n# Title\n";
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, name), raw);
  const preview = await run([cli, "migrate-metadata", "--all"], env);
  assert.equal(preview.code, 0, preview.stderr);
  const plan = JSON.parse(preview.stdout); assert.deepEqual(plan.migrated, [name]);
  assert.equal(stored(env, name), raw);
  const result = await run([cli, "migrate-metadata", "--all", "--apply", "--base-revision", plan.revision], env);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(stored(env, name), "# Title\n");
  assert.deepEqual(stateOnDisk(env, name).legacy_fields, ["gei: broken secret-marker", "gei: duplicate"]);
  const report = await store.check({ path_prefix: "all" });
  assert.deepEqual(report.results[0].reasons, ["invalid_metadata"]);
  assert.ok(!JSON.stringify(report).includes("secret-marker"));
  assert.deepEqual((await store.search({ query: "secret-marker" })).results, []);
  assert.deepEqual((await store.gc({ path_prefix: "all" })).deleted, []);
});

test("ordered legacy moves retain the original baseline while recreated paths start unverified", async t => {
  const { store, env } = fixture(t);
  const next = "projects/example/moved.md";
  const body = "# Original\nAccepted fact.\n";
  const meta = { version: 1, kind: "knowledge", created_at: "2026-01-01T00:00:00Z", review_days: 90, verified_at: "2026-01-01T00:00:00Z", verified_hash: bodyHash(body) };
  fs.mkdirSync(path.dirname(path.join(env.GEI_SPEC_HOME, name)), { recursive: true });
  fs.writeFileSync(path.join(env.GEI_SPEC_HOME, name), `---\ngei: ${JSON.stringify(meta)}\n---\n${body}`);
  const read = await store.read({ paths: [name] });
  const moved = await store.edit({ base_revision: read.revision, summary: "Move a legacy note and reuse its old path", edits: [
    { op: "rename", path: name, to: next }, { op: "replace", path: next, old_text: "Accepted fact.", new_text: "Corrected fact." },
    { op: "create", path: name, content: "# New purpose\n" },
  ] });
  assert.equal(stateOnDisk(env, name).verified_at, undefined);
  assert.equal(stateOnDisk(env, next).verified_hash, meta.verified_hash);
  assert.equal(stateOnDisk(env, next).verified_at, meta.verified_at);
  assert.equal(stored(env, next), "# Original\nCorrected fact.\n");
  const record = stored(env, metadataPath(next));
  await store.edit({ base_revision: moved.revision, summary: "Move the original note back", edits: [{ op: "delete", path: name }, { op: "rename", path: next, to: name }] });
  assert.equal(stored(env, metadataPath(name)), record);
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, metadataPath(next))), false);
});
