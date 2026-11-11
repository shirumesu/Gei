#!/usr/bin/env node
// Stop: at the end of each turn, commit, pull and push the memory store when it has local changes.
import { storeKind, sync } from "../skills/memo/scripts/store.mjs";

const output = {};
try {
  if (storeKind() === "git") sync({ onlyIfDirty: true });
} catch (error) {
  output.systemMessage = `Gei memo sync failed at the end of this turn; the changes stay local until the next sync. ${error.message}`.slice(0, 1500);
}
process.stdout.write(`${JSON.stringify(output)}\n`);
