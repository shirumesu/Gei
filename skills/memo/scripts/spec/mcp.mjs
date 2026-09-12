#!/usr/bin/env node
import readline from "node:readline";
import { SpecStore } from "./store.mjs";
import { callTool, tools } from "./tools.mjs";

// A dependency-free stdio tools server. No HTTP listener, hosted service, or session state.
const store = new SpecStore();
const versions = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const send = value => process.stdout.write(JSON.stringify(value) + "\n");
async function handle(message) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    send({ jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32600, message: "Invalid request" } }); return;
  }
  if (message.id === undefined) return;
  const reply = result => send({ jsonrpc: "2.0", id: message.id, result });
  switch (message.method) {
    case "initialize":
      reply({ protocolVersion: versions.includes(message.params?.protocolVersion) ? message.params.protocolVersion : versions[0],
        capabilities: { tools: {} }, serverInfo: { name: "gei-spec", version: "1.0.0" },
        instructions: "Use startup knowledge paths with spec_read/search/edit. Repository binding is user configuration. Do not edit the backing directory or run Git synchronization alongside these tools." }); break;
    case "ping": reply({}); break;
    case "tools/list": reply({ tools }); break;
    case "tools/call":
      try {
        const result = await callTool(store, message.params?.name, message.params?.arguments);
        reply({ content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
      } catch (error) {
        const result = { code: error.code || "INTERNAL", message: error.message, ...error.details };
        reply({ isError: true, content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
      }
      break;
    default: send({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Method not found" } });
  }
}
const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let pending = Promise.resolve();
for await (const line of input) {
  let message;
  try { message = JSON.parse(line); }
  catch { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); continue; }
  pending = pending.then(() => handle(message)).catch(error => {
    send({ jsonrpc: "2.0", id: message.id ?? null, error: { code: -32603, message: error.message } });
  });
}
await pending;
