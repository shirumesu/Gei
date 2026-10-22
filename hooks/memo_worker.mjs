#!/usr/bin/env node

import fs from "node:fs";
import { readJson, writeJson } from "../skills/memo/scripts/spec/io.mjs";
import { log, MAX_ATTEMPTS, memoState, processSession, recordFailure, sessionFiles, sleepWhileQueued } from "./memo.mjs";

const help = `Gei background Memo worker

node <gei>/hooks/memo_worker.mjs <pending-file>     Process one queued handoff (started by Hooks)
node <gei>/hooks/memo_worker.mjs --session ID [--dry-run]
                                                    Process a recorded session now; --dry-run prints the prompt
node <gei>/hooks/memo_worker.mjs --status           Show queued handoffs and recorded sessions

Turn background maintenance on or off with: spec background on|off
`;

const args = process.argv.slice(2);
const { dir } = memoState();

if (!args.length || ["--help", "-h"].includes(args[0])) process.stdout.write(help);
else if (args[0] === "--status") {
  const list = sub => { try { return fs.readdirSync(`${dir}/${sub}`); } catch { return []; } };
  process.stdout.write(JSON.stringify({ state: dir, pending: list("pending"),
    sessions: list("sessions").filter(name => name.endsWith(".json")).map(name => ({ name, ...readJson(`${dir}/sessions/${name}`) })) }, null, 2) + "\n");
} else if (args[0] === "--session") {
  const session = sessionFiles(dir, args[1] || "").key;
  const result = await processSession(dir, { kind: "manual", session }, `${dir}/manual.running`, { dryRun: args.includes("--dry-run") });
  process.stdout.write(result + "\n");
} else {
  const running = args[0];
  const handoff = readJson(running, null);
  if (handoff) {
    try {
      if (handoff.delay_seconds && !(await sleepWhileQueued(running, handoff.delay_seconds))) process.exit(0);
      const result = await processSession(dir, handoff, running);
      log(dir, `${handoff.kind} ${handoff.session}: ${result}`);
      fs.rmSync(running, { force: true });
    } catch (error) {
      log(dir, `${handoff.kind} ${handoff.session} failed (attempt ${handoff.attempts + 1}): ${error.message}`);
      recordFailure(dir, handoff.session);
      if (handoff.attempts + 1 >= MAX_ATTEMPTS) fs.rmSync(running, { force: true });
      else if (fs.existsSync(running)) {
        // Failed work returns to the queue; the next SessionStart retries it.
        writeJson(running, { ...handoff, attempts: handoff.attempts + 1, delay_seconds: undefined });
        fs.renameSync(running, running.replace(/\.running$/u, ".json"));
      }
    }
  }
}
