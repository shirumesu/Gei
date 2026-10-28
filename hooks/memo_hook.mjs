#!/usr/bin/env node

import { readHookInput, resolveWorkspace, getHookStartDir } from "./knowledge.mjs";
import { log, memoState, record, recover, schedule, takeReports } from "./memo.mjs";

const host = process.argv[2] === "codex" ? "codex" : "claude";
let state;
try {
  state = memoState();
  if (state.active) {
    const input = readHookInput();
    const event = input.hook_event_name;
    if (event === "SessionStart") {
      recover(state.dir);
      const reports = takeReports(state.dir, (await resolveWorkspace(getHookStartDir(input), state.store)).projectId);
      if (reports.length) {
        const lines = reports.slice(-3).map(item => `- ${item.summary} (${item.paths.join(", ")})`);
        process.stdout.write(`${JSON.stringify({ systemMessage: `Gei Memo updated knowledge after earlier sessions:\n${lines.join("\n")}` })}\n`);
      }
    } else {
      const captured = record(state.dir, host, input);
      if (captured) schedule(state.dir, captured, event);
    }
  }
} catch (error) {
  // Capture must never interrupt the session; failures stay in the worker log.
  if (state) log(state.dir, `hook ${host}: ${error.stack || error.message}`);
}
