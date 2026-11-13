#!/usr/bin/env node
// Stop and SubagentStop: count the citations in the final message, stamp entries created this
// session with its id, and sync when the rules say so.
import { hook, sessionId } from "./lib.mjs";

await hook("Stop", async (input, warnings) => {
  const session = sessionId(input);
  const message = input.last_assistant_message;
  if (message !== null && typeof message !== "string") throw new Error("The hook input has no last_assistant_message.");
  const { cite, stampSources } = await import("../skills/memo/scripts/memo.mjs");
  if (message !== null) cite(session, message);
  stampSources(session);
  const { storeKind } = await import("../skills/memo/scripts/store.mjs");
  if (storeKind() !== "git") return {};
  const { sync, syncDue } = await import("../skills/memo/scripts/sync.mjs");
  if (!syncDue()) return {};
  try { sync(); }
  catch (error) { warnings.push(`Gei memo sync failed at the end of this turn; the changes stay local until the next sync. ${error.message}`); }
  return {};
});
