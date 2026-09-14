// Optional interoperability check with the official client installed outside the plugin.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plugin = process.env.GEI_TEST_PLUGIN || source;
const sdk = process.env.GEI_MCP_SDK || path.join(source, "dist/mcp-client/node_modules/@modelcontextprotocol/sdk/dist/esm");
const { Client } = await import(pathToFileURL(path.join(sdk, "client/index.js")));
const { StdioClientTransport } = await import(pathToFileURL(path.join(sdk, "client/stdio.js")));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-spec-sdk-"));
const client = new Client({ name: "gei-interoperability-test", version: "1.0.0" });
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(plugin, "skills/memo/scripts/spec/mcp.mjs")],
    env: { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state") } }));
  assert.deepEqual((await client.listTools()).tools.map(tool => tool.name).sort(),
    ["spec_status", "spec_read", "spec_search", "spec_edit", "spec_check", "spec_gc"].sort());
  const name = "projects/sdk-test/INDEX.md";
  const content = async () => (await client.callTool({ name: "spec_read", arguments: { paths: [name] } })).structuredContent.files[0].content;
  const read = await client.callTool({ name: "spec_read", arguments: { paths: [name] } });
  assert.equal(read.isError, undefined);
  const result = await client.callTool({ name: "spec_edit", arguments: { base_revision: read.structuredContent.revision,
    summary: "Verify SDK interoperability", edits: [{ op: "create", path: name, content: "# SDK fixture\n" }] } });
  assert.equal(result.structuredContent.applied, true);
  assert.equal(await content(), "# SDK fixture\n");
  assert.equal(fs.readFileSync(path.join(root, "knowledge", name), "utf8"), await content());
  assert.ok(fs.existsSync(path.join(root, "knowledge", "metadata", name + ".json")));
  const error = await client.callTool({ name: "spec_edit", arguments: { base_revision: result.structuredContent.revision, summary: "Missing field",
    edits: [{ op: "replace", path: name, old_text: "SDK" }] } });
  assert.equal(error.isError, true);
  assert.match(error.structuredContent.message, /new_text/);
  const original = "# SDK fixture\n" + Array.from({ length: 30 }, (_, i) => `Record ${i}: 12345678-1234-5678-1234-${String(i).padStart(12, "0")} enabled`).join("\n") + "\n";
  const seeded = await client.callTool({ name: "spec_edit", arguments: { base_revision: result.structuredContent.revision,
    summary: "Seed range fixture", edits: [{ op: "replace", path: name, old_text: "# SDK fixture\n", new_text: original }] } });
  assert.equal(seeded.isError, undefined);
  const numbered = await client.callTool({ name: "spec_read", arguments: { paths: [name], line_numbers: true } });
  assert.match(numbered.structuredContent.revision, /^r_[a-f0-9]{16}$/u);
  assert.match(numbered.structuredContent.files[0].content, /2: Record 0:/);
  const old_text = original.split("\n").slice(1, 31).join("\n");
  const new_text = old_text.replaceAll("enabled", "disabled");
  const common = { base_revision: numbered.structuredContent.revision, summary: "Update records" };
  const exactInput = { ...common, edits: [{ op: "replace", path: name, old_text, new_text }] };
  const rangeInput = { ...common, edits: [{ op: "replace_lines", path: name, start_line: 2, end_line: 31, new_text }] };
  const exactBytes = Buffer.byteLength(JSON.stringify(exactInput)), rangeBytes = Buffer.byteLength(JSON.stringify(rangeInput));
  assert.ok(rangeBytes < exactBytes * 0.6);
  const updated = await client.callTool({ name: "spec_edit", arguments: rangeInput });
  assert.equal(updated.isError, undefined);
  assert.equal(await content(), original.replaceAll("enabled", "disabled"));
  const stale = await client.callTool({ name: "spec_edit", arguments: rangeInput });
  assert.equal(stale.structuredContent.code, "REVISION_CONFLICT");
  const mismatch = await client.callTool({ name: "spec_edit", arguments: { base_revision: updated.structuredContent.revision,
    summary: "Diagnose typo", edits: [{ op: "replace", path: name, old_text: "Record zero: typo", new_text: "Changed" }] } });
  assert.equal(mismatch.structuredContent.code, "NO_MATCH");
  assert.equal(mismatch.structuredContent.read.line_numbers, true);
  assert.match(mismatch.structuredContent.context, /2: Record 0:/);
  const checked = await client.callTool({ name: "spec_check", arguments: { path_prefix: "projects/sdk-test/" } });
  assert.equal(checked.isError, undefined);
  assert.match(checked.content[0].text, /^Maintenance check:/u);
  assert.ok(!numbered.structuredContent.files[0].content.includes("gei:"));
  assert.equal(checked.structuredContent.candidates, 1);
  const transient = "projects/sdk-test/probe.md";
  const declared = await client.callTool({ name: "spec_edit", arguments: {
    base_revision: checked.structuredContent.revision, summary: "Declare completed disposable probe",
    edits: [{ op: "create", path: transient, content: "# Temporary probe\n" }],
    reviews: [{ path: transient, outcome: "verify", kind: "transient", basis: "Completed disposable probe", delete_after: "2020-01-01T00:00:00Z", deletion_reason: "Probe is complete" }],
  } });
  assert.equal(declared.isError, undefined);
  const preview = await client.callTool({ name: "spec_gc", arguments: { path_prefix: "projects/sdk-test/" } });
  assert.deepEqual(preview.structuredContent.deleted, [transient]);
  assert.equal(fs.existsSync(path.join(root, "knowledge", transient)), true);
  const incomplete = await client.callTool({ name: "spec_gc", arguments: { path_prefix: "projects/sdk-test/", apply: true, base_revision: preview.structuredContent.revision } });
  assert.equal(incomplete.isError, true);
  assert.equal(incomplete.structuredContent.code, "PLAN_CHANGED");
  const removed = await client.callTool({ name: "spec_gc", arguments: { path_prefix: "projects/sdk-test/", apply: true,
    base_revision: preview.structuredContent.revision, plan_id: preview.structuredContent.plan_id } });
  assert.equal(removed.structuredContent.applied, true);
  assert.equal(fs.existsSync(path.join(root, "knowledge", transient)), false);
  assert.equal(await content(), original.replaceAll("enabled", "disabled"));
  const renameBase = await client.callTool({ name: "spec_read", arguments: { paths: [name] } });
  const stateBeforeMove = fs.readFileSync(path.join(root, "knowledge", "metadata", name + ".json"), "utf8");
  const moved = "projects/sdk-test/moved.md";
  const renamed = await client.callTool({ name: "spec_edit", arguments: { base_revision: renameBase.structuredContent.revision, summary: "Move SDK fixture",
    edits: [{ op: "rename", path: name, to: moved }] } });
  assert.equal(renamed.isError, undefined);
  assert.equal(fs.existsSync(path.join(root, "knowledge", name)), false);
  assert.equal(fs.existsSync(path.join(root, "knowledge", "metadata", name + ".json")), false);
  assert.equal(fs.readFileSync(path.join(root, "knowledge", "metadata", moved + ".json"), "utf8"), stateBeforeMove);
  const movedRead = await client.callTool({ name: "spec_read", arguments: { paths: [moved] } });
  assert.equal(movedRead.structuredContent.files[0].content, fs.readFileSync(path.join(root, "knowledge", moved), "utf8"));
  console.log(`PASS official MCP SDK: discovery, short references, numbered read, exact/range edits, stale rejection, recovery hints, maintenance reviews, physical Markdown equality, metadata-preserving rename and preview-bound GC. Same 30-record edit input: exact ${exactBytes} bytes; range ${rangeBytes} bytes (not a token or model-quality benchmark).`);
} finally {
  await client.close();
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("gei-spec-sdk-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}
