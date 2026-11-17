#!/usr/bin/env node
// The memo MCP server (stdio): the agent's everyday way into memory, as tools whose calls and
// results the user sees. It reads and writes entries and nothing else; which entries a session
// was shown is recorded by the PostToolUse hook from the tool's result, since only the hook knows
// the current session (a server started before /clear keeps the old session id).
// Newline-delimited JSON-RPC 2.0 over stdin/stdout; stdout carries protocol messages only.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import * as memo from "./memo.mjs";
import * as read from "./read.mjs";
import { resolveProject } from "./project.mjs";
import { queryWords } from "./rank.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const VERSION = JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin", "plugin.json"), "utf8")).version;
const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

// Claude Code and Codex start the server in the session's working directory.
const project = () => resolveProject(process.cwd());

const string = description => ({ type: "string", description });
const flag = description => ({ type: "boolean", description });
const id = { type: "object", properties: { id: string("Entry id, as in [m:<id>].") }, required: ["id"], additionalProperties: false };
const readOnly = { readOnlyHint: true, openWorldHint: false };
// Read by the Stop hook from the final reply; uncited entries ranked above a cited one sink.
const CITE = "When you act on an entry, cite it in your reply as [m:<id>]; only entries you acted on, not ones you looked at and set aside.";

const TOOLS = [
  { name: "brief", title: "Memo brief", annotations: readOnly,
    description: `Call once before your first task in a session (a subagent too): the rules that always apply (pinned), the situations worth a lookup, and the common keys of this project's memory and the shared scope. ${CITE}`,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => read.brief(project()) },
  { name: "find", title: "Memo find", annotations: readOnly,
    description: `Look up the entries that apply before you start a task: up to 3, each \`[m:<id>] do (why it ranked)\`. Try two or three different words (a tool, service, file, action); two or three lookups per task are enough. ASCII words match whole words, CJK by containment. When an entry conflicts with the current code or with what the user says now, follow the code and the user, then call \`wrong\` or \`put\` with \`replace\`. ${CITE}`,
    inputSchema: { type: "object", properties: { words: { type: "array", items: { type: "string" }, minItems: 1, description: "Words to look up." } }, required: ["words"], additionalProperties: false },
    run: args => read.find(project(), queryWords(args.words.join(" "))) },
  { name: "keys", title: "Memo keys", annotations: readOnly,
    description: "The common keys with entry counts; with a word, the keys that match it and the keys used beside them.",
    inputSchema: { type: "object", properties: { word: string("Optional word to narrow the keys.") }, additionalProperties: false },
    run: args => read.keys(project(), args.word === undefined ? null : args.word) },
  { name: "show", title: "Memo show", annotations: readOnly,
    description: "One entry in full: every field, its strength and its revision history.",
    inputSchema: id, run: args => memo.show(memo.parseId(args.id)) },
  { name: "put", title: "Memo put", annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    description: "Save an entry when the user corrects you, states a preference or warns you (set user), or when a pitfall will recur; load the memo skill first. Not worth saving: progress, finished work, one-off problems, general knowledge, anything the code or git already answers, secrets. Refuses likely secrets, over-long fields and, without replace or new, an entry close to an existing one, which it prints.",
    inputSchema: { type: "object", additionalProperties: false, required: ["keys", "when", "do"], properties: {
      keys: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6, description: "1 to 6 keys, each at most 24 characters: the literal things that will show up again, plus one broad key." },
      when: string("At most 60 characters: the situation in which the entry applies."),
      do: string("At most 300 characters: an imperative that stands on its own."),
      why: string("At most 200 characters: the source, what the user said or the failure seen."),
      group: string("Names the steps of one procedure saved as several entries."),
      user: flag("The user said it."),
      shared: flag("It holds for every project, not just this one."),
      replace: string("Id of the entry this revises; keeps its id, level and uses."),
      new: flag("Save although a similar entry exists, because it is a different rule."),
    } },
    run: args => memo.putFrom({ keys: args.keys, when: args.when, do: args.do, why: args.why ?? null, group: args.group ?? null,
      pin: false, user: args.user === true, shared: args.shared === true, new: args.new === true, replace: args.replace ?? null }, project(), null) },
  { name: "wrong", title: "Memo wrong", annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    description: "The entry is wrong: its level drops to 0; marking it again deletes it.",
    inputSchema: id, run: args => memo.wrong(memo.parseId(args.id)) },
  { name: "del", title: "Memo delete", annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    description: "Delete an entry the user wants gone (`memo restore <id>` in the shell brings it back).",
    inputSchema: id, run: args => memo.del(memo.parseId(args.id)) },
];

// The declared schema, enforced: required fields present, no unknown ones, each of the right type.
function check(tool, args) {
  if (args === null || typeof args !== "object" || Array.isArray(args)) throw new Error(`${tool.name} takes an object of arguments.`);
  const { properties, required = [] } = tool.inputSchema;
  for (const name of required) if (args[name] === undefined) throw new Error(`${tool.name} needs ${name}.`);
  for (const [name, value] of Object.entries(args)) {
    const spec = properties[name];
    if (!spec) throw new Error(`${tool.name} has no argument ${name}.`);
    const ok = spec.type === "array" ? Array.isArray(value) && value.every(item => typeof item === "string") : typeof value === spec.type;
    if (!ok) throw new Error(`${tool.name}: ${name} must be ${spec.type === "array" ? "a list of strings" : `a ${spec.type}`}.`);
  }
}

const send = message => process.stdout.write(`${JSON.stringify(message)}\n`);
const reply = (id, result) => send({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

function handle(message) {
  const { id, method, params } = message;
  // Notifications (initialized, cancelled) need no answer.
  if (id === undefined) return;
  switch (method) {
    case "initialize":
      return reply(id, { protocolVersion: PROTOCOLS.includes(params?.protocolVersion) ? params.protocolVersion : PROTOCOLS[0],
        capabilities: { tools: {} }, serverInfo: { name: "gei-memo", title: "Gei memo", version: VERSION } });
    case "ping": return reply(id, {});
    case "tools/list": return reply(id, { tools: TOOLS.map(({ run, ...tool }) => tool) });
    case "tools/call": {
      const tool = TOOLS.find(item => item.name === params?.name);
      if (!tool) return fail(id, -32602, `Unknown tool: ${params?.name}`);
      // A refusal (a similar entry, a secret, a bad id) is the tool's answer, shown as an error result.
      try {
        const args = params.arguments ?? {};
        check(tool, args);
        return reply(id, { content: [{ type: "text", text: tool.run(args) }] });
      } catch (error) {
        return reply(id, { content: [{ type: "text", text: error.message }], isError: true });
      }
    }
    default: return fail(id, -32601, `Method not found: ${method}`);
  }
}

readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on("line", line => {
  if (!line.trim()) return;
  let message;
  try { message = JSON.parse(line); }
  catch (error) { return fail(null, -32700, `Parse error: ${error.message}`); }
  if (message === null || typeof message !== "object" || Array.isArray(message)) return fail(null, -32600, "Expected one JSON-RPC message per line.");
  handle(message);
});
