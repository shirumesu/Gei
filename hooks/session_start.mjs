#!/usr/bin/env node
// SessionStart: sync the memory store, lint it, and inject the purpose, indexes and live pointers.
import fs from "node:fs";
import { refreshCodexCopy, storeKind, sync } from "../skills/memo/scripts/store.mjs";
import { resolveProject } from "../skills/memo/scripts/project.mjs";
import { sessionContext } from "../skills/memo/scripts/memory.mjs";

const output = {};
const warnings = [];
try {
  const raw = process.stdin.isTTY ? "" : fs.readFileSync(0, "utf8");
  const input = raw.trim() ? JSON.parse(raw) : {};
  if (storeKind() === "missing") {
    warnings.push("Gei memo: ~/.agents/geispec does not exist, so no memory was loaded. Run `gei memo setup` (node <gei>/bin/gei.mjs memo setup).");
  } else {
    try { sync(); refreshCodexCopy(); }
    catch (error) { warnings.push(`Gei memo sync failed; this session sees the local copy. ${error.message}`); }
    const project = resolveProject(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
    const { context, problems } = sessionContext(project);
    if (problems.length) warnings.push(`Gei memo lint: ${problems.length} problem(s), listed at the end of the injected memory.`);
    output.hookSpecificOutput = { hookEventName: "SessionStart", additionalContext: context };
  }
} catch (error) {
  warnings.push(`Gei memo SessionStart hook failed. ${error.stack || error.message}`);
}
if (warnings.length) output.systemMessage = warnings.join("\n").slice(0, 1500);
process.stdout.write(`${JSON.stringify(output)}\n`);
