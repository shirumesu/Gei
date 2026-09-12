// Optional interoperability check with the official client installed outside the plugin.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sdk = process.env.GEI_MCP_SDK || path.join(source, "dist/mcp-client/node_modules/@modelcontextprotocol/sdk/dist/esm");
const { Client } = await import(pathToFileURL(path.join(sdk, "client/index.js")));
const { StdioClientTransport } = await import(pathToFileURL(path.join(sdk, "client/stdio.js")));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-spec-sdk-"));
const client = new Client({ name: "gei-interoperability-test", version: "1.0.0" });
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(source, "skills/memo/scripts/spec/mcp.mjs")],
    env: { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state") } }));
  assert.equal((await client.listTools()).tools.length, 4);
  const name = "projects/sdk-test/INDEX.md";
  const read = await client.callTool({ name: "spec_read", arguments: { paths: [name] } });
  assert.equal(read.isError, undefined);
  const result = await client.callTool({ name: "spec_edit", arguments: { base_revision: read.structuredContent.revision,
    summary: "Verify SDK interoperability", edits: [{ op: "create", path: name, content: "# SDK fixture\n" }] } });
  assert.equal(result.structuredContent.applied, true);
  assert.equal(fs.readFileSync(path.join(root, "knowledge", name), "utf8"), "# SDK fixture\n");
  const error = await client.callTool({ name: "spec_edit", arguments: { base_revision: result.structuredContent.revision, summary: "Missing field",
    edits: [{ op: "replace", path: name, old_text: "SDK" }] } });
  assert.equal(error.isError, true);
  assert.match(error.structuredContent.message, /new_text/);
  console.log("PASS official MCP SDK: initialize, tool discovery, read, edit, structured result, actionable tool error.");
} finally {
  await client.close();
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("gei-spec-sdk-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}
