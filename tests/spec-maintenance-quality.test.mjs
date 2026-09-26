import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyReviews, gcPlan, inventory } from "../skills/memo/scripts/spec/maintenance.mjs";
import { contentHash, parseDocument, withMetadata } from "../skills/memo/scripts/spec/metadata.mjs";
import { hash } from "../skills/memo/scripts/spec/io.mjs";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { callTool } from "../skills/memo/scripts/spec/tools.mjs";
import { formatMaintenance } from "../skills/memo/scripts/spec/presentation.mjs";

const now = Date.parse("2026-01-01T00:00:00Z");
const note = "projects/example/topics/contract.md";
const prose = "The download queue owns admission while the native engine owns verified pieces. Persistent tasks retain their complete wanted content during playback, and a reader's current range never changes the intended scope of the download.";
function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-quality-test-"));
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("gei-quality-test-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return root;
}
function verified(body, metadata = {}) {
  return withMetadata(body, { version: 4, kind: "knowledge", review_days: 90,
    verified_at: new Date(now).toISOString(), verified_hash: contentHash(body, { version: 4 }), ...metadata });
}
function fixture(t) {
  const root = temporary(t);
  return new SpecStore({ env: { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state") }, clock: () => now });
}
async function seed(store, content) {
  const read = await store.read({ paths: [note] });
  return store.edit({ base_revision: read.revision, summary: "Create test contract", edits: [{ op: "create", path: note, content }] });
}

test("MCP reviews preserve, replace and clear scope without empty qualifiers", async t => {
  const store = fixture(t);
  let saved = await seed(store, verified("# Contract\nApplies to the current client.\n", { scope: { environment: "previous-host", platform: "Windows" } }));
  const review = async extra => {
    saved = await callTool(store, "spec_edit", { base_revision: saved.revision, summary: "Review applicability", reviews: [{ path: note, outcome: "verify", basis: "Current contract checked", ...extra }] });
    return parseDocument((await store.read({ paths: [note] })).files[0].content).metadata;
  };
  assert.deepEqual((await review({})).scope, { environment: "previous-host", platform: "Windows" });
  assert.deepEqual((await review({ scope: { platform: "macOS" } })).scope, { platform: "macOS" });
  assert.equal((await review({ scope: null })).scope, undefined);
  for (const scope of [{}, { environment: "" }, { platform: " " }, { platform: "Windows", environment: " " }]) {
    await assert.rejects(review({ scope }), error => ["ARGUMENT", "REVIEW"].includes(error.code));
  }
  const current = await store.read({ paths: [note] });
  await assert.rejects(callTool(store, "spec_edit", { base_revision: current.revision, summary: "Cannot mutate scope while deferring", reviews: [{ path: note, outcome: "defer", basis: "Target evidence unavailable", scope: null }] }), error => error.code === "REVIEW");
  assert.equal((await store.read({ paths: [note] })).revision, current.revision);
});

test("legacy empty scope and long evidence remain readable while new review summaries stay concise", async t => {
  const store = fixture(t);
  const legacy = verified("# Contract\nA stable accepted requirement.\n", { scope: { environment: "" }, basis: "Historical detail ".repeat(200) });
  const saved = await seed(store, legacy);
  assert.equal((await store.read({ paths: [note] })).files[0].content, legacy);
  assert.equal(parseDocument(legacy).error, undefined);
  const input = { base_revision: saved.revision, summary: "Oversized review", reviews: [{ path: note, outcome: "verify", basis: "🙂".repeat(1201) }] };
  await assert.rejects(store.edit(input), error => error.code === "ARGUMENT" && /1200/u.test(error.message));
  await assert.rejects(callTool(store, "spec_edit", input), error => error.code === "ARGUMENT");
  const accepted = await callTool(store, "spec_edit", { ...input, reviews: [{ path: note, outcome: "verify", basis: "🙂".repeat(1200), scope: null }] });
  assert.notEqual(accepted.revision, saved.revision);
  assert.equal(parseDocument((await store.read({ paths: [note] })).files[0].content).metadata.scope, undefined);
});

test("maintenance excerpts mark core truncation and direct readers to the full document", () => {
  const longBasis = "🙂".repeat(1201), longAttempt = "𠮷".repeat(1201);
  const paragraph = `${"🙂 Verified behavior remains bound to its source evidence. ".repeat(8)}Final condition.`;
  const files = {
    [note]: verified(`# Contract\n\n${paragraph}\n`, { basis: longBasis, attempt_reason: longAttempt }),
    "projects/example/peer.md": `# Peer\n\n${paragraph}\n`,
  };
  const report = inventory(files, "projects/example/", { now });
  const item = report.results.find(item => item.path === note);
  assert.equal(item.basis, "🙂".repeat(1200));
  assert.equal(item.basis_truncated, true);
  assert.equal(item.last_attempt, "𠮷".repeat(1200));
  assert.equal(item.last_attempt_truncated, true);
  assert.equal(Array.from(item.duplicates[0].excerpt).length, 240);
  assert.equal(item.duplicates[0].excerpt, Array.from(paragraph).slice(0, 240).join(""));
  assert.equal(item.duplicates[0].excerpt_truncated, true);
  const peer = report.results.find(item => item.path !== note);
  assert.equal(peer.basis_truncated, false);
  assert.equal(peer.last_attempt, undefined);
  assert.equal(peer.last_attempt_truncated, undefined);
  assert.equal(parseDocument(files[note]).metadata.basis, longBasis);
  assert.equal(parseDocument(files[note]).metadata.attempt_reason, longAttempt);
  const displayed = formatMaintenance("spec_check", { ...report, path_prefix: "projects/example/", revision: "fixture", candidates: report.results.length, gc_eligible: 0, environment: "fixture" });
  for (const label of ["Last verification basis:", "Unresolved:", "Repeated at line"]) {
    assert.ok(displayed.split("\n").some(line => line.includes(label) && line.includes("[excerpt; read full document]")), label);
  }
  assert.ok(!displayed.includes("full detail in structuredContent"));
});

test("source coverage separates unperformed checks, missing evidence, and changed files", t => {
  const checkout = temporary(t);
  fs.writeFileSync(path.join(checkout, "same.dart"), "stable");
  fs.writeFileSync(path.join(checkout, "changed.dart"), "current");
  fs.mkdirSync(path.join(checkout, "directory.dart"));
  const files = {
    [note]: verified("# Contract\nThe implementation has source evidence.\n", { sources: [
      { path: "same.dart", hash: hash("stable") }, { path: "changed.dart", hash: hash("previous") },
      { path: "missing.dart", hash: hash("previous") }, { path: "directory.dart", hash: hash("previous") },
    ] }),
    "projects/example/INDEX.md": "# Example\nPlain routes remain valid without lifecycle state.\n",
    "projects/example/unverified.md": withMetadata("# Draft\nAccepted but not verified.\n", { version: 4, kind: "knowledge", review_days: 90 }),
  };
  const absent = inventory(files, "projects/example/", { now });
  assert.deepEqual(absent.results.find(item => item.path === note).source_changes, ["same.dart", "changed.dart", "missing.dart", "directory.dart"].map(path => ({ path, status: "not_checked" })));
  assert.equal(absent.coverage.sources_not_checked, 4);
  assert.equal(absent.coverage.sources_missing, 0);
  assert.equal(absent.coverage.sources_checked, 0);
  const missingCheckout = inventory(files, "projects/example/", { now, checkoutRoot: path.join(checkout, "absent-checkout") });
  assert.equal(missingCheckout.coverage.sources_unavailable, 4);
  assert.equal(missingCheckout.coverage.sources_missing, 0);
  const checked = inventory(files, "projects/example/", { now, checkoutRoot: checkout });
  const item = checked.results.find(item => item.path === note);
  assert.deepEqual(item.source_changes, [{ path: "changed.dart", status: "changed" }, { path: "missing.dart", status: "missing" }, { path: "directory.dart", status: "unavailable" }]);
  assert.deepEqual(item.source_coverage, { references: 4, checked: 2, missing: 1, not_checked: 0, unavailable: 1 });
  assert.deepEqual(checked.coverage, { documents: 3, lifecycle_tracked: 2, plain_documents: 1, verification_baselines: 1,
    source_baseline_documents: 1, source_references: 4, sources_checked: 2, sources_changed: 1, sources_missing: 1,
    sources_not_checked: 0, sources_unavailable: 1, unsignaled_documents: 1,
    not_assessed: ["semantic_validity", "retention_value", "live_behavior"] });
  assert.deepEqual(checked.unsignaled, [{ path: "projects/example/INDEX.md" }]);
});

test("exact substantial prose duplication supplies physical evidence but never authorizes deletion", () => {
  const first = "projects/example/a.md", second = "projects/example/b.md";
  const a = verified(`# First\n\n${prose}\n`);
  const b = `# Second\n\n${prose.replace("Persistent", "\nPersistent")}\n`;
  const files = { [first]: a, [second]: b, "projects/other/same.md": `# Other project\n\n${prose}\n` };
  const checked = inventory(files, "projects/example/", { now });
  assert.equal(checked.results.length, 2);
  assert.ok(checked.results.every(item => item.reasons.includes("duplicate_content") && item.action === "review"));
  const evidence = checked.results.find(item => item.path === first).duplicates[0];
  assert.equal(a.split("\n")[evidence.line - 1], prose);
  assert.deepEqual(evidence.peers, [{ path: second, line: 3 }]);
  assert.equal(evidence.peers_omitted, 0);
  assert.equal(evidence.excerpt_truncated, false);
  assert.deepEqual(gcPlan(files, "projects/example/", { now }).deleted, []);
  const differing = { [first]: a, [second]: b.replace("never changes", "can change") };
  assert.deepEqual(inventory(differing, "projects/example/", { now }).results, []);
});

test("code, lifecycle evidence, navigation, and short shared phrases do not become duplicate warnings", () => {
  const content = `# Shared heading\n\nShort shared phrase.\n\n\`\`\`markdown\n${prose}\n\`\`\`\n\n    ${prose}\n\n\`${prose}\`\n\n- [${prose}](https://example.invalid/reference)\n\n<!-- gei:navigation -->\n${prose}\n<!-- /gei:navigation -->\n`;
  const files = Object.fromEntries(["a", "b"].map(name => [`projects/example/${name}.md`, verified(content, { basis: prose })]));
  const result = inventory(files, "projects/example/", { now });
  assert.deepEqual(result.results, []);
  assert.equal(result.unsignaled.length, 2);
});

test("duplicate evidence bounds both blocks and peer references without losing omission counts", () => {
  const paragraphs = Array.from({ length: 5 }, (_, index) => `${prose} This is independent contract ${index}.`);
  const files = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`projects/example/n${index}.md`, `# Note ${index}\n\n${paragraphs.join("\n\n")}\n`]));
  const result = inventory(files, "projects/example/", { now });
  assert.equal(result.results.length, 9);
  const first = result.results[0];
  assert.equal(first.duplicates.length, 3);
  assert.equal(first.duplicates_omitted, 2);
  assert.equal(first.duplicates[0].peers.length, 5);
  assert.equal(first.duplicates[0].peers_omitted, 3);
  assert.equal(first.duplicates[0].excerpt.length, 240);
  assert.equal(first.duplicates[0].excerpt_truncated, true);
  assert.equal(result.coverage.plain_documents, 9);
  assert.equal(result.coverage.lifecycle_tracked, 0);
});

test("ordinary corrections and deferred review retain the previous whole-document baseline", () => {
  const original = verified("# Contract\nFirst fact.\n\nSecond fact.\n", { scope: { platform: "Windows" } });
  const after = { [note]: original.replace("First fact.", "First corrected fact.") };
  applyReviews({ [note]: original }, after, [{ path: note, outcome: "defer", basis: "Second fact still needs its target evidence" }], { now });
  const metadata = parseDocument(after[note]).metadata;
  assert.equal(metadata.verified_hash, parseDocument(original).metadata.verified_hash);
  assert.equal(metadata.verified_at, new Date(now).toISOString());
  assert.deepEqual(metadata.scope, { platform: "Windows" });
  assert.equal(inventory(after, "projects/example/", { now }).cooling, 1);
});
