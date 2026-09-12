import path from "node:path";
import { locked, readJson, writeJson } from "../skills/memo/scripts/spec/io.mjs";
const state = process.env.GEI_SPEC_STATE;
await locked(state, async () => {
  const owner = readJson(path.join(state, "operation.lock"));
  if (owner.pid !== process.pid) throw new Error("Wrong lock owner");
  if (process.argv.includes("--crash")) process.exit(23);
  const counter = path.join(state, "counter.json");
  const before = readJson(counter, { count: 0, active: false });
  if (before.active) throw new Error("Overlapping critical sections");
  writeJson(counter, { ...before, active: true });
  await new Promise(resolve => setTimeout(resolve, 20));
  writeJson(counter, { count: before.count + 1, active: false });
});
