#!/usr/bin/env node
// SessionStart (startup, resume, clear, compact, fork): sync the store, inject the session-start
// memory, and mark the session so its first prompt is matched against the entries.
import { additionalContext, hook, markFirstPrompt, memoCommand, sessionId } from "./lib.mjs";

await hook("SessionStart", async (input, warnings) => {
  const session = sessionId(input);
  const { refreshCodexCopy, storeKind } = await import("../skills/memo/scripts/store.mjs");
  if (storeKind() === "missing") {
    warnings.push("Gei memo: ~/.agents/geispec does not exist, so no memory was loaded. Run `gei memo setup` (node <gei>/bin/gei.mjs memo setup).");
    return {};
  }
  const { sync } = await import("../skills/memo/scripts/sync.mjs");
  try { sync(); refreshCodexCopy(); }
  catch (error) { warnings.push(`Gei memo sync failed; this session sees the local copy. ${error.message}`); }
  const { now, run } = await import("../skills/memo/scripts/db.mjs");
  const { resolveProject } = await import("../skills/memo/scripts/project.mjs");
  const { startContext } = await import("../skills/memo/scripts/read.mjs");
  const project = resolveProject(input.cwd);
  run("INSERT INTO sessions (session_id, project, started_at) VALUES (?, ?, ?) ON CONFLICT (session_id) DO UPDATE SET project = excluded.project",
    session, project.projectId, now());
  markFirstPrompt(session);
  return additionalContext("SessionStart", startContext(project, { session, command: memoCommand }));
});
