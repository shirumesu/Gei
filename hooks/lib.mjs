// Shared by the hook scripts: read the event JSON from stdin, run, print at most one JSON object.
// A failure becomes a systemMessage shown to the user, never a crash, so a broken hook never
// blocks the session. Heavy modules (SQLite, git) are imported inside each hook, after its fast exits.
// The hooks hand the agent no entries and no tool manual (the tools' own descriptions are that):
// SessionStart injects a few lines of basic use; the rest is bookkeeping (sync, sessions, what
// each session was shown, citations).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Codex exports PLUGIN_ROOT to plugin hooks; Claude Code exports only CLAUDE_PLUGIN_ROOT.
export const inCodex = process.env.PLUGIN_ROOT !== undefined;

export function sessionId(input) {
  const id = input.session_id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]+$/u.test(id)) throw new Error(`Unexpected session_id ${JSON.stringify(id)} in the hook input.`);
  return id;
}

// The project SessionStart recorded for the session. A session that started before the plugin was
// enabled has no record, and its project is resolved from the working directory.
export async function sessionProject(session, cwd) {
  const { get } = await import("../skills/memo/scripts/db.mjs");
  const { resolveProject } = await import("../skills/memo/scripts/project.mjs");
  const row = get("SELECT project FROM sessions WHERE session_id = ?", session);
  return row ? { projectId: row.project } : resolveProject(cwd);
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
