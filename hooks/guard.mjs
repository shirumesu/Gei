#!/usr/bin/env node
// PreToolUse on file edits: deny an Edit or Write to a snapshot file in the memory store
// (they are generated from memo.db; `memo` is the way in). Anything else passes untouched.
import fs from "node:fs";
import path from "node:path";
import { hook } from "./lib.mjs";
import { isSnapshot, storeDir } from "../skills/memo/scripts/store.mjs";

// Claude Code's Edit and Write carry file_path; Codex's apply_patch carries the patch in command.
function targets(input) {
  const tool = input.tool_input;
  if (typeof tool.file_path === "string") return [tool.file_path];
  if (typeof tool.command === "string") return [...tool.command.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gmu)].map(match => match[1].trim());
  throw new Error(`No file path in the ${input.tool_name} input: ${JSON.stringify(Object.keys(tool))}`);
}

// Resolves symbolic links in the deepest existing ancestor, so /tmp and /private/tmp compare equal.
function real(file) {
  const missing = [];
  let dir = file;
  while (!fs.existsSync(dir)) { missing.unshift(path.basename(dir)); dir = path.dirname(dir); }
  return path.join(fs.realpathSync.native(dir), ...missing);
}

await hook("PreToolUse", async input => {
  const store = fs.existsSync(storeDir()) ? fs.realpathSync.native(storeDir()) : null;
  if (store === null) return {};
  const hit = targets(input).map(file => real(path.resolve(input.cwd, file))).find(file => {
    const rel = path.relative(store, file);
    return !rel.startsWith("..") && !path.isAbsolute(rel) && isSnapshot(rel);
  });
  if (!hit) return {};
  return { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny",
    permissionDecisionReason: `${hit} is generated from the memo database and is overwritten on every sync. Use the memo command instead (memo put, memo put --replace <id>, memo del <id>).` } };
});
