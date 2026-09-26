import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { contentHash, withMetadata } from "../skills/memo/scripts/spec/metadata.mjs";
import { hash, scan } from "../skills/memo/scripts/spec/io.mjs";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prefix = "projects/example/";
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-check-sampling-"));
  const env = { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state") };
  const checkout = path.join(root, "checkout");
  fs.mkdirSync(checkout);
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("gei-check-sampling-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { env, checkout, store: new SpecStore({ env }) };
}
async function seed(store, files) {
  const read = await store.read({ paths: [Object.keys(files)[0]] });
  return store.edit({ base_revision: read.revision, summary: "Create check fixtures", edits: Object.entries(files).map(([path, content]) => ({ op: "create", path, content })) });
}
function plainFiles(count = 7) {
  return Object.fromEntries(Array.from({ length: count }, (_, i) => [`${prefix}plain-${i}.md`, `# Topic ${i}\nDistinct subject ${i}.\n`]));
}
function tracked(body, fields = {}) {
  return withMetadata(body, { version: 4, kind: "knowledge", review_days: 90,
    verified_at: new Date().toISOString(), verified_hash: contentHash(body, { version: 4 }), ...fields });
}
function run(script, args, env, input = "") {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(source, script), ...args], { env, cwd: source, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", data => { stdout += data; });
    child.stderr.on("data", data => { stderr += data; });
    child.on("error", reject);
    child.on("close", code => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}

test("fresh checks rotate a bounded unsignaled sample while pinned reads do not consume rotation", async t => {
  const { store } = fixture(t);
  const files = plainFiles();
  await seed(store, files);
  const before = scan(store.home);
  const first = await store.check({ path_prefix: prefix });
  assert.equal(first.candidates, 0);
  assert.equal(first.coverage.plain_documents, 7);
  assert.equal(first.coverage.verification_baselines, 0);
  assert.equal(first.coverage.unsignaled_documents, 7);
  assert.deepEqual(first.coverage.not_assessed, ["semantic_validity", "retention_value", "live_behavior"]);
  assert.ok(Object.keys(first).indexOf("coverage") < Object.keys(first).indexOf("results"));
  assert.equal(first.sample_limit, 3);
  assert.deepEqual(first.review_sample.map(item => item.path), Object.keys(files).slice(0, 3));
  for (const item of first.review_sample) {
    assert.equal(item.action, "assess_value");
    assert.match(item.next, /not verification/u);
    assert.deepEqual(item.read, { paths: [item.path], revision: first.revision });
    assert.equal((await store.read(item.read)).files[0].content, files[item.path]);
  }
  const replay = await store.check({ path_prefix: prefix, revision: first.revision });
  assert.deepEqual(replay.review_sample, first.review_sample);
  const second = await store.check({ path_prefix: prefix });
  assert.deepEqual(second.review_sample.map(item => item.path), Object.keys(files).slice(3, 6));
  const third = await store.check({ path_prefix: prefix });
  assert.equal(third.review_sample.length, 3);
  assert.equal(new Set([...first.review_sample, ...second.review_sample, ...third.review_sample].map(item => item.path)).size, 7);
  assert.deepEqual(scan(store.home), before);
});

test("next_check pins candidate pages and checkout arguments without repeating the review sample", async t => {
  const { store, checkout } = fixture(t);
  const files = { ...plainFiles(4), ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [`${prefix}candidate-${i}.md`, withMetadata(`# Unverified ${i}\n`, { version: 4, kind: "knowledge", review_days: 90 })])) };
  await seed(store, files);
  const before = scan(store.home);
  const first = await store.check({ path_prefix: prefix, max_results: 1, checkout_root: checkout });
  assert.equal(first.candidates, 3);
  assert.equal(first.remaining, 2);
  assert.equal(first.review_sample.length, 3);
  assert.deepEqual(first.next_check, { path_prefix: prefix, revision: first.revision, offset: 1, max_results: 1, checkout_root: checkout });
  assert.deepEqual(scan(store.home), before);
  await store.edit({ base_revision: first.revision, summary: "Change candidates after the first page",
    edits: [{ op: "delete", path: `${prefix}candidate-1.md` }] });
  const afterConcurrentEdit = scan(store.home);
  const second = await store.check(first.next_check);
  assert.deepEqual(second.review_sample, []);
  assert.equal(second.remaining, 1);
  const third = await store.check(second.next_check);
  assert.deepEqual(third.review_sample, []);
  assert.equal(third.next_check, undefined);
  assert.equal(third.remaining, 0);
  assert.deepEqual([first, second, third].flatMap(page => page.results.map(item => item.path)), Array.from({ length: 3 }, (_, i) => `${prefix}candidate-${i}.md`));
  assert.ok([second, third].every(page => page.revision === first.revision));
  assert.deepEqual(scan(store.home), afterConcurrentEdit);
  await assert.rejects(store.check({ path_prefix: prefix, offset: 1 }), { code: "ARGUMENT" });
});

test("CLI and MCP show source coverage and unassessed limits even when mechanical candidates are zero", async t => {
  const { store, env, checkout } = fixture(t);
  fs.writeFileSync(path.join(checkout, "contract.txt"), "Current source");
  await seed(store, { ...plainFiles(2), [`${prefix}source.md`]: tracked("# Sourced requirement\nA source-backed constraint.\n", { sources: [{ path: "contract.txt", hash: hash("Current source") }] }) });
  const before = scan(store.home);
  const cli = await run("skills/memo/scripts/spec/cli.mjs", ["check", "--scope", prefix, "--checkout-root", checkout], env);
  assert.equal(cli.code, 0, cli.stderr);
  assert.match(cli.stdout, /candidates: 0/u);
  assert.match(cli.stdout, /Zero candidates is not a quality verdict/u);
  assert.match(cli.stdout, /Sources: 1 checked; 0 changed; 0 missing/u);
  assert.match(cli.stdout, /Not assessed: factual correctness, continued value, and live behavior/u);
  assert.ok(cli.stdout.indexOf("Coverage:") < cli.stdout.indexOf("Bounded review sample"));
  assert.match(cli.stdout, /Read: spec_read/u);
  const request = [{ path_prefix: prefix }, { path_prefix: prefix, checkout_root: checkout }].map((args, index) =>
    JSON.stringify({ jsonrpc: "2.0", id: index + 1, method: "tools/call", params: { name: "spec_check", arguments: args } })).join("\n") + "\n";
  const mcp = await run("skills/memo/scripts/spec/mcp.mjs", [], env, request);
  assert.equal(mcp.code, 0, mcp.stderr);
  const [result, zero] = mcp.stdout.trim().split("\n").map(line => JSON.parse(line).result);
  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent.coverage.sources_not_checked, 1);
  assert.equal(result.structuredContent.coverage.sources_checked, 0);
  assert.equal(result.structuredContent.coverage.sources_missing, 0);
  assert.deepEqual(result.structuredContent.coverage.not_assessed, ["semantic_validity", "retention_value", "live_behavior"]);
  assert.deepEqual(result.structuredContent.results[0].source_changes, [{ path: "contract.txt", status: "not_checked" }]);
  assert.match(result.content[0].text, /1 not checked \(no checkout\)/u);
  assert.match(result.content[0].text, /Zero candidates is not a quality verdict/u);
  assert.match(result.content[0].text, /Not assessed:/u);
  assert.ok(result.content[0].text.indexOf("Coverage:") < result.content[0].text.indexOf(`- ${prefix}source.md`));
  assert.equal(zero.structuredContent.candidates, 0);
  assert.equal(zero.structuredContent.coverage.sources_checked, 1);
  assert.match(zero.content[0].text, /Zero candidates is not a quality verdict/u);
  assert.match(zero.content[0].text, /Not assessed: factual correctness, continued value, and live behavior/u);
  assert.deepEqual(scan(store.home), before);
});

test("checking an expired transient and previewing its cleanup leave all knowledge bytes unchanged", async t => {
  const { store } = fixture(t);
  const body = "# Disposable probe\nIts temporary purpose is complete.\n";
  const note = `${prefix}probe.md`;
  await seed(store, { ...plainFiles(1), [note]: tracked(body, { kind: "transient", delete_after: "2000-01-01T00:00:00Z", deletion_reason: "Explicitly temporary probe is finished", deletion_hash: contentHash(body, { version: 4 }) }) });
  const before = scan(store.home);
  const checked = await store.check({ path_prefix: prefix });
  assert.equal(checked.gc_eligible, 1);
  assert.deepEqual(scan(store.home), before);
  const preview = await store.gc({ path_prefix: prefix });
  assert.equal(preview.preview, true);
  assert.equal(preview.applied, false);
  assert.deepEqual(preview.deleted, [note]);
  assert.deepEqual(scan(store.home), before);
  assert.equal((await store.read({ paths: [note] })).files[0].content, before[note]);
});
