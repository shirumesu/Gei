// Shared by the hook scripts: read the event JSON from stdin, run, print at most one JSON object.
// A failure becomes a systemMessage shown to the user, never a crash, so a broken hook never
// blocks the session. Heavy modules (SQLite, git) are imported inside each hook, after its fast exits.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stateDir } from "../skills/memo/scripts/store.mjs";

export const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Codex passes --codex: its shell has no plugin bin/ on PATH, so the agent gets the full command.
export const memoCommand = process.argv.includes("--codex") ? `node "${path.join(pluginRoot, "bin", "memo")}"` : "memo";

export function sessionId(input) {
  const id = input.session_id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]+$/u.test(id)) throw new Error(`Unexpected session_id ${JSON.stringify(id)} in the hook input.`);
  return id;
}

// "This session's next prompt is its first": set at session start, cleared by the first prompt.
const markers = () => path.join(stateDir(), "first-prompt");
export const markerFile = session => path.join(markers(), session);
export function markFirstPrompt(session) {
  fs.mkdirSync(markers(), { recursive: true });
  fs.writeFileSync(markerFile(session), "");
  // Sessions that ended before their first prompt leave a marker; drop those older than a day.
  for (const name of fs.readdirSync(markers())) {
    const file = path.join(markers(), name);
    if (Date.now() - fs.statSync(file).mtimeMs > 24 * 3600 * 1000) fs.rmSync(file);
  }
}

export const additionalContext = (event, text) => text ? { hookSpecificOutput: { hookEventName: event, additionalContext: text } } : {};

export async function hook(event, run) {
  const output = {};
  const warnings = [];
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8"));
    Object.assign(output, await run(input, warnings));
  } catch (error) {
    warnings.push(`Gei memo ${event} hook failed. ${error.stack || error.message}`);
  }
  if (warnings.length) output.systemMessage = warnings.join("\n").slice(0, 1500);
  if (Object.keys(output).length) process.stdout.write(`${JSON.stringify(output)}\n`);
}
