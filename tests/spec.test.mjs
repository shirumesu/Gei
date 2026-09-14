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

test("short revisions survive restart, accept previous references, and never select another binding", async t => {
  const { env, store } = fixture(t);
  const saved = await seed(store);
  assert.match(saved.revision, /^r_[a-f0-9]{16}$/u);
  const restarted = new SpecStore({ env });
  assert.equal((await restarted.read({ paths: [name], revision: saved.revision })).files[0].content, disk(env, name));
  const legacy = `${store.target(store.config())}:${store.oid(store.config(), saved.revision)}`;
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

test("connection accepts checkout newline conversion without rewriting either copy", async t => {
  const remote = "# Example\nRule.\n";
  const local = remote.replaceAll("\n", "\r\n");
  const added = "projects/example/topics/new.md";
  const { store, api, env } = remoteFixture(t, { [name]: remote });
  await seed(store, { [name]: local, [added]: "New.\r\n" });
  const preview = await store.connect({ repo: "fixture/knowledge" });
  assert.deepEqual(preview.upload_paths, [added]);
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
  assert.equal(first.counts.missing_metadata, 2);
  const before = disk(env, topic);
  const reviewed = await store.edit({ base_revision: saved.revision, summary: "Verify stable constraint", reviews: [{ path: topic, outcome: "keep", reason: "Requirement still applies", evidence: ["Confirmed compatibility requirement"], review_days: 90 }] });
  const read = await store.read({ paths: [topic] });
  assert.match(read.files[0].content, /^---\ntitle: Design\ngei: /u);
  assert.ok(read.files[0].content.endsWith("# Design\nA rare, durable constraint.\n"));
  assert.equal(read.files[0].knowledge.metadata.verified_at, new Date(now).toISOString());
  now += 100 * 86400000;
  const check = await store.check({ path_prefix: "projects/example/" });
  assert.ok(check.results.find(item => item.path === topic).reasons.includes("review_due"));
  assert.equal(check.gc_eligible, 0);
  assert.deepEqual((await store.gc({ path_prefix: "all" })).deleted, []);
  const unchanged = disk(env, topic);
  await store.search({ path_prefix: "projects/example/", query: "constraint" });
  assert.equal(disk(env, topic), unchanged);
  const changed = await store.edit({ base_revision: reviewed.revision, summary: "Ordinary correction", edits: [{ op: "replace", path: topic, old_text: "rare,", new_text: "infrequent," }] });
  assert.ok((await store.read({ paths: [topic] })).files[0].knowledge.reasons.includes("content_changed"));
  assert.notEqual(disk(env, topic), before);
  await assert.rejects(store.edit({ base_revision: changed.revision, summary: "Cannot destroy knowledge", reviews: [{ path: topic, outcome: "keep", reason: "Old", evidence: ["No visits"], delete_after: "2026-01-01T00:00:00Z", deletion_reason: "Old" }] }), { code: "RETENTION" });
});

test("maintenance deferral cools an unresolved item without renewing evidence", async t => {
  let now = Date.parse("2026-01-01T00:00:00Z");
  const { store } = fixture(t, { clock: () => now });
  const task = "projects/example/tasks/release.md";
  const saved = await seed(store, { [task]: "# Release\nCommit exists; deployment unknown.\n" });
  await store.edit({ base_revision: saved.revision, summary: "Deployment needs evidence", reviews: [{ path: task, outcome: "defer", reason: "Deployment target unavailable" }] });
  const read = await store.read({ paths: [task] });
  assert.equal(read.files[0].knowledge.metadata.kind, "handoff");
  assert.equal(read.files[0].knowledge.metadata.verified_at, undefined);
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
  await store.edit({ base_revision: saved.revision, summary: "Declare disposable result", reviews: [{ path: transient, outcome: "keep", kind: "transient", reason: "One-off result", evidence: ["Completed temporary probe"], delete_after: "2026-03-01T00:00:00Z", deletion_reason: "Explicit one-off retention ended" }] });
  const original = disk(env, transient);
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
  assert.equal(disk(env, name), "# Example\n- [Scratch](notes/scratch.md)\n");
});

test("GC blocks substantive, reference-style, and cross-project dependencies", async t => {
  const { store } = fixture(t);
  const transient = "projects/example/old.md";
  const saved = await seed(store, { [transient]: "# Old\n", [name]: "# Example\nUse [Old](old.md) to decide the requirement.\n", "projects/other/INDEX.md": "# Other\n[Important][old]\n\n[old]: ../example/old.md\n" });
  await store.edit({ base_revision: saved.revision, summary: "Explicit temporary retention", reviews: [{ path: transient, outcome: "keep", kind: "transient", reason: "Temporary", evidence: ["Probe"], delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Temporary retention ended" }] });
  const preview = await store.gc({ path_prefix: "projects/example/" });
  assert.deepEqual(preview.deleted, []);
  assert.equal(preview.blocked.length, 1);
  assert.equal(preview.blocked[0].incoming_total, 2);
  await assert.rejects(store.edit({ base_revision: preview.revision, summary: "Unrepaired deletion", reviews: [{ path: transient, outcome: "delete", reason: "No longer needed" }] }), { code: "DEPENDENCY" });
  await store.edit({ base_revision: preview.revision, summary: "Resolve dependencies and delete", edits: [
    { op: "replace", path: name, old_text: "Use [Old](old.md) to decide the requirement.", new_text: "The confirmed requirement is now recorded here." },
    { op: "replace", path: "projects/other/INDEX.md", old_text: "[Important][old]\n\n[old]: ../example/old.md", new_text: "Requirement moved to current native documentation." },
  ], reviews: [{ path: transient, outcome: "delete", reason: "Relevant requirement preserved in current owners" }] });
});

test("changed transient content revokes mechanical disposal and stale GC cannot apply", async t => {
  const { store } = fixture(t);
  const transient = "projects/example/temp.md";
  const saved = await seed(store, { [transient]: "# Temp\nOld result.\n" });
  await store.edit({ base_revision: saved.revision, summary: "Set finite retention", reviews: [{ path: transient, outcome: "keep", kind: "transient", reason: "Disposable", evidence: ["Temporary result"], delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Expired result" }] });
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
  await store.edit({ base_revision: saved.revision, summary: "Verify target setup", checkout_root: checkout, reviews: [{ path: topic, outcome: "keep", reason: "Checked current config", evidence: ["config.txt"], sources: ["config.txt"], scope: { environment: "other-installation", platform: "Windows" }, review_days: 30 }] });
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
  const command = await run([cli, "spec", "check", "--all", "--limit", "2"], env);
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
  await store.edit({ base_revision: read.revision, summary: "Declare retention", reviews: [{ path: transient, outcome: "keep", kind: "transient", reason: "Disposable result", evidence: ["Temporary check"], delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Expired explicitly" }] });
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
  await store.edit({ base_revision: saved.revision, summary: "Finite retention", reviews: [{ path: transient, outcome: "keep", kind: "transient", reason: "Disposable", evidence: ["Probe"], delete_after: "2026-01-02T00:00:00Z", deletion_reason: "Intentional one-day retention" }] });
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
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "No evidence", edits: [{ op: "create", path: name, content: "must not appear" }], reviews: [{ path: topic, outcome: "keep", reason: "Looks old" }] }), { code: "REVIEW" });
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, name)), false);
  saved = await store.edit({ base_revision: saved.revision, summary: "Baseline config", checkout_root: checkout, reviews: [{ path: topic, outcome: "keep", reason: "Observed config", evidence: ["config"], sources: ["config"] }] });
  fs.writeFileSync(path.join(checkout, "config"), "v2");
  await store.edit({ base_revision: saved.revision, summary: "Need implementation diagnosis", checkout_root: checkout, reviews: [{ path: topic, outcome: "defer", reason: "Config changed; runtime unavailable" }] });
  assert.equal((await store.check({ path_prefix: "projects/example/", checkout_root: checkout })).cooling, 1);
  fs.writeFileSync(path.join(checkout, "config"), "v3");
  assert.equal((await store.check({ path_prefix: "projects/example/", checkout_root: checkout })).candidates, 1);
});

test("GC cannot mistake navigation with trailing prose or escaped targets for safe links", async t => {
  const { store } = fixture(t);
  const transient = "projects/example/old(result).md";
  const saved = await seed(store, { [transient]: "# Old\n", [name]: "# Example\n- [Old](old\\(result\\).md) is required (keep this explanation)\n" });
  await store.edit({ base_revision: saved.revision, summary: "Intentional retention", reviews: [{ path: transient, outcome: "keep", kind: "transient", reason: "Temporary", evidence: ["Probe"], delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Expired" }] });
  const preview = await store.gc({ path_prefix: "all" });
  assert.deepEqual(preview.deleted, []);
  assert.equal(preview.blocked.length, 1);
});

test("actual Hook strips lifecycle frontmatter and scheduled runner previews by default", async t => {
  const { store, env, root } = fixture(t);
  const checkout = path.join(root, 'example'); fs.mkdirSync(checkout);
  const saved = await seed(store);
  await store.edit({ base_revision: saved.revision, summary: 'Verify index', reviews: [{ path: name, outcome: 'keep', reason: 'Current project background', evidence: ['Current source'] }] });
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
  await store.edit({ base_revision: saved.revision, summary: 'Explicit disposable records', reviews: [a,b].map(path => ({path,outcome:'keep',kind:'transient',reason:'Disposable',evidence:['Probe'],delete_after:'2020-01-01T00:00:00Z',deletion_reason:'Retention ended'})) });
  const preview = await store.gc({path_prefix:'all'});
  assert.deepEqual(preview.deleted, []);
  assert.equal(preview.blocked.length, 2);
});
