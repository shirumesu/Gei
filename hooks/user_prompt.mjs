#!/usr/bin/env node
// UserPromptSubmit: only for the first prompt of a session (or the first after compaction),
// match it against the entries and inject what fits. Every other prompt exits at once.
import fs from "node:fs";
import { additionalContext, hook, markerFile, sessionId } from "./lib.mjs";

await hook("UserPromptSubmit", async input => {
  const session = sessionId(input);
  if (!fs.existsSync(markerFile(session))) return {};
  fs.rmSync(markerFile(session));
  if (typeof input.prompt !== "string") throw new Error("The hook input has no prompt.");
  const { get } = await import("../skills/memo/scripts/db.mjs");
  const { primeContext } = await import("../skills/memo/scripts/read.mjs");
  const row = get("SELECT project FROM sessions WHERE session_id = ?", session);
  if (!row) throw new Error(`Session ${session} is marked for its first prompt but SessionStart did not record it.`);
  return additionalContext("UserPromptSubmit", primeContext({ projectId: row.project }, input.prompt, { session }));
});
