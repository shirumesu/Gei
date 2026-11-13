#!/usr/bin/env node
// SubagentStart: give the subagent the same session-start memory as its parent session.
import { additionalContext, hook, memoCommand, sessionId } from "./lib.mjs";

await hook("SubagentStart", async input => {
  const session = sessionId(input);
  const { storeKind } = await import("../skills/memo/scripts/store.mjs");
  if (storeKind() === "missing") return {};
  const { get } = await import("../skills/memo/scripts/db.mjs");
  const { resolveProject } = await import("../skills/memo/scripts/project.mjs");
  const { startContext } = await import("../skills/memo/scripts/read.mjs");
  // The parent's SessionStart recorded the project; a session that started before the plugin was
  // enabled has no record, and its project is resolved from the working directory.
  const row = get("SELECT project FROM sessions WHERE session_id = ?", session);
  const project = row ? { projectId: row.project } : resolveProject(input.cwd);
  return additionalContext("SubagentStart", startContext(project, { session, command: memoCommand }));
});
