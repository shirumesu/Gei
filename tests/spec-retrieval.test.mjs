import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { withMetadata } from "../skills/memo/scripts/spec/metadata.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-retrieval-test-"));
  const env = { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state") };
  const store = new SpecStore({ env });
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("gei-retrieval-test-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return store;
}

async function seed(store, files) {
  let saved = await store.read({ paths: [Object.keys(files)[0]] });
  const entries = Object.entries(files);
  for (let at = 0; at < entries.length; at += 100) {
    saved = await store.edit({ base_revision: saved.revision, summary: "Create retrieval fixtures",
      edits: entries.slice(at, at + 100).map(([path, content]) => ({ op: "create", path, content })) });
  }
  return saved;
}

test("listing is summary-first, explicit about missing prose, and pages an immutable deterministic order", async t => {
  const store = fixture(t);
  const raw = '---\ntitle: retained context\ngei: {"version":4,"kind":"knowledge","review_days":90}\n---\n# Topic title\n\n```sh\nignored code\n```\n- Route only\n\nThe first prose\ncontinues here.\n\nLater paragraph.\n';
  const files = {
    "projects/example/notes/a.md": "# Note\nNote paragraph.\n",
    "projects/example/topics/z/README.md": raw,
    "projects/example/tasks/a.md": "# Task\n- Only a list\n",
    "projects/example/INDEX.md": "# Project\nProject paragraph.\n",
    "context/INDEX.md": "# Shared\nShared paragraph.\n",
  };
  await seed(store, files);
  const first = await store.search({ path_prefix: "projects/example/", max_results: 2 });
  assert.equal(first.order, "indexes-topic-owners-documents-notes-path");
  assert.deepEqual(first.results.map(item => item.path), ["projects/example/INDEX.md", "projects/example/topics/z/README.md"]);
  assert.deepEqual(first.results[1].overview, { extraction: "document", title: "Topic title", title_line: 5,
    title_truncated: false, excerpt: "The first prose continues here.", excerpt_line: 12,
    excerpt_truncated: false, description_missing: false });
  assert.equal(first.results[1].body_start_line, 5);
  await store.edit({ base_revision: first.revision, summary: "Change listing after first page",
    edits: [{ op: "delete", path: "projects/example/tasks/a.md" }, { op: "create", path: "projects/example/a.md", content: "New document." }] });
  const second = await store.search(first.next_search);
  assert.equal(second.revision, first.revision);
  assert.deepEqual(second.results.map(item => item.path), ["projects/example/tasks/a.md", "projects/example/notes/a.md"]);
  assert.equal(second.results[0].overview.description_missing, true);
  assert.equal(second.results[0].overview.excerpt, null);
  assert.equal(second.next_search, undefined);
  assert.equal(second.truncated, false);
});

test("listing reaches every path beyond the former 100-result limit", async t => {
  const store = fixture(t);
  const files = Object.fromEntries(Array.from({ length: 105 }, (_, i) => [`projects/example/notes/${String(i).padStart(3, "0")}.md`, `# Note ${i}\n` ]));
  await seed(store, files);
  const first = await store.search({ path_prefix: "projects/example/notes/", max_results: 100 });
  const second = await store.search(first.next_search);
  assert.equal(first.next_offset, 100);
  assert.equal(second.results.length, 5);
  assert.equal(second.truncated, false);
  assert.deepEqual([...first.results, ...second.results].map(item => item.path), Object.keys(files));
});

test("literal search continuations retain query, scope, lifecycle choice and physical coordinates", async t => {
  const store = fixture(t);
  const raw = '---\ntitle: needle applicability\ngei: {\n  "version": 4,\n  "kind": "knowledge",\n  "review_days": 90,\n  "basis": "needle maintenance"\n}\n---\n# Topic\nNeedle first.\nNeedle second.\n';
  await seed(store, { "projects/example/topic.md": raw, "projects/other/INDEX.md": "Needle outside scope", "context/INDEX.md": "Needle shared" });
  const all = await store.search({ query: "needle", path_prefix: "projects/example/" });
  assert.deepEqual(all.results.map(item => item.line), [2, 7, 11, 12]);
  const first = await store.search({ query: "needle", path_prefix: "projects/example/", max_results: 1, include_lifecycle: false });
  assert.deepEqual(first.next_search, { query: "needle", path_prefix: "projects/example/", revision: first.revision, max_results: 1, offset: 1, include_lifecycle: false });
  await store.edit({ base_revision: first.revision, summary: "Update matching body", edits: [{ op: "replace", path: "projects/example/topic.md", old_text: "Needle first.", new_text: "Current content." }] });
  const second = await store.search(first.next_search);
  const third = await store.search(second.next_search);
  assert.equal(second.results[0].line, 11);
  assert.equal(second.results[0].text, "Needle first.");
  assert.equal(third.results[0].line, 12);
  assert.equal(third.next_search, undefined);
  const numbered = await store.read({ paths: [second.results[0].path], revision: second.revision, start_line: 11, max_lines: 1, line_numbers: true });
  assert.equal(numbered.files[0].content, "11: Needle first.");
});

test("read shares unused short-file space and keeps overview available before a long lifecycle header", async t => {
  const store = fixture(t);
  const long = "字".repeat(14000);
  const lifecycle = withMetadata("# Actual title\nActual body.\n", { version: 4, kind: "knowledge", review_days: 90, basis: "m".repeat(60000) });
  await seed(store, { "projects/example/long.md": long, "projects/example/short.md": "Short.\n", "projects/example/lifecycle.md": lifecycle });
  const mixed = await store.read({ paths: ["projects/example/short.md", "projects/example/long.md", "projects/example/missing.md"] });
  assert.equal(mixed.files[1].content, long);
  assert.equal(mixed.files[1].truncated, false);
  assert.deepEqual(mixed.files[2], { path: "projects/example/missing.md", exists: false, overview: null });
  assert.ok(mixed.files.reduce((sum, file) => sum + Buffer.byteLength(file.content || ""), 0) <= 48000);
  const header = await store.read({ paths: ["projects/example/lifecycle.md"] });
  assert.equal(header.files[0].truncated, true);
  assert.equal(header.files[0].overview.title, "Actual title");
  assert.equal(header.files[0].overview.excerpt, "Actual body.");
  assert.ok(header.files[0].content.startsWith("---\ngei:"));
  assert.equal(header.files[0].next_read.revision, header.revision);
  const body = await store.read({ paths: ["projects/example/lifecycle.md"], revision: header.revision, start_line: header.files[0].body_start_line });
  assert.equal(body.files[0].content, "# Actual title\nActual body.\n");
});

test("raw and numbered read continuations preserve Unicode, CRLF and the pinned snapshot", async t => {
  const store = fixture(t);
  const text = "字😀".repeat(12000) + "\r\nTail\r\n";
  await seed(store, { "projects/example/large.md": text, "projects/example/small.md": "# Small\r\nBody.\r\n" });
  const first = await store.read({ paths: ["projects/example/large.md", "projects/example/small.md"], line_numbers: true });
  const large = first.files[0];
  assert.equal(first.files[1].content, "1: # Small\n2: Body.\n3: ");
  assert.equal(large.next_line, 1);
  assert.ok(large.next_column > 1);
  assert.ok(Buffer.byteLength(large.content) + Buffer.byteLength(first.files[1].content) <= 48000);
  await store.edit({ base_revision: first.revision, summary: "Change after first page", edits: [{ op: "replace", path: "projects/example/large.md", old_text: "Tail", new_text: "Changed" }] });
  const next = await store.read(large.next_read);
  assert.equal(large.content.slice(3) + next.files[0].content.slice(3), text.replace("\r\nTail\r\n", "\n2: Tail\n3: "));
  assert.equal(next.files[0].truncated, false);
  const raw = await store.read({ paths: ["projects/example/large.md"], revision: first.revision });
  const rawNext = await store.read(raw.files[0].next_read);
  assert.equal(raw.files[0].content + rawNext.files[0].content, text);
});

test("retrieval validates continuation inputs and describes missing or shortened source prose without inference", async t => {
  const store = fixture(t);
  await seed(store, { "projects/example/plain.md": "字".repeat(300), "projects/example/code.md": "```text\nNot prose.\n```\n" });
  await assert.rejects(store.search({ offset: 1 }), { code: "ARGUMENT" });
  await assert.rejects(store.search({ offset: -1 }), { code: "ARGUMENT" });
  await assert.rejects(store.search({ include_lifecycle: "false" }), { code: "ARGUMENT" });
  await assert.rejects(store.read({ paths: ["projects/example/code.md"], start_column: 50 }), { code: "ARGUMENT" });
  const read = await store.read({ paths: ["projects/example/plain.md", "projects/example/code.md"] });
  assert.equal(read.files[0].overview.title, null);
  assert.equal(read.files[0].overview.excerpt, "字".repeat(280));
  assert.equal(read.files[0].overview.excerpt_truncated, true);
  assert.equal(read.files[0].overview.excerpt_line, 1);
  assert.equal(read.files[1].overview.description_missing, true);
  assert.equal(read.files[1].overview.extraction, "document");
});

test("overviews skip multiline comments and respect fence lengths before extracting visible prose", async t => {
  const store = fixture(t);
  const cases = [
    { path: "projects/example/comment.md", lines: ["---", "category: source", "---", "<!--", "# Hidden title", "Hidden prose.", "```", "Still hidden.", "-->", "# Visible title", "", "Visible comment example.", ""], titleLine: 10, excerptLine: 12 },
    { path: "projects/example/backticks.md", lines: ["````md", "# Hidden title", "```", "Short markers do not close the fence.", "```` still code", "Closing markers cannot have an info string.", "`````", "# Visible title", "", "Visible backtick example.", ""], titleLine: 8, excerptLine: 10 },
    { path: "projects/example/tildes.md", lines: ["~~~~", "~~~", "Hidden prose.", "~~~~ trailing", "Still code.", "~~~~~", "# Visible title", "", "Visible tilde example.", ""], titleLine: 7, excerptLine: 9 },
  ];
  await seed(store, Object.fromEntries(cases.map(item => [item.path, item.lines.join("\n")])));
  const read = await store.read({ paths: cases.map(item => item.path) });
  for (const [index, item] of cases.entries()) {
    const result = read.files[index];
    assert.equal(result.content, item.lines.join("\n"));
    assert.equal(result.overview.title, "Visible title");
    assert.equal(result.overview.title_line, item.titleLine);
    assert.equal(result.overview.excerpt, item.lines[item.excerptLine - 1]);
    assert.equal(result.overview.excerpt_line, item.excerptLine);
    assert.equal(result.overview.description_missing, false);
  }
  const listing = await store.search({ path_prefix: "projects/example/" });
  for (const item of listing.results) assert.deepEqual(item.overview, read.files.find(file => file.path === item.path).overview);
});
