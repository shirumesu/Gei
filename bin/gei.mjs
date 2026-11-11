#!/usr/bin/env node
// gei memo <command> — see skills/memo/scripts/cli.mjs.
import { main } from "../skills/memo/scripts/cli.mjs";

const [group, ...rest] = process.argv.slice(2);
try {
  if (group !== "memo") throw new Error("Usage: gei memo <setup|sync|lint|trace> (gei memo --help for details)");
  await main(rest);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
