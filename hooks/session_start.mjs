#!/usr/bin/env node
// SessionStart (startup, resume, clear, compact, fork): sync the store, record the session's
// project, and inject a few lines of basic use. No entries: the agent asks for them with `brief`.
import { additionalContext, hook, sessionId } from "./lib.mjs";

await hook("SessionStart", async (input, warnings) => {
  const session = sessionId(input);
  const { refreshCodexCopy, storeKind } = await import("../skills/memo/scripts/store.mjs");
  if (storeKind() === "missing") {
    warnings.push("Gei memo: ~/.agents/geispec does not exist, so memory is unavailable. Run `gei memo setup` (node <gei>/bin/gei.mjs memo setup).");
    return {};
  }
  const { sync } = await import("../skills/memo/scripts/sync.mjs");
  try { sync(); refreshCodexCopy(); }
  catch (error) { warnings.push(`Gei memo sync failed; this session sees the local copy. ${error.message}`); }
  const { now, run } = await import("../skills/memo/scripts/db.mjs");
  const { resolveProject } = await import("../skills/memo/scripts/project.mjs");
  const { usage } = await import("../skills/memo/scripts/read.mjs");
  const project = resolveProject(input.cwd);
  run("INSERT INTO sessions (session_id, project, started_at) VALUES (?, ?, ?) ON CONFLICT (session_id) DO UPDATE SET project = excluded.project",
    session, project.projectId, now());
  return additionalContext("SessionStart", usage(project));
});
