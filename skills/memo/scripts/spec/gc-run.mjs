#!/usr/bin/env node
import { SpecStore } from "./store.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  process.stdout.write("Scheduled Spec cleanup: node gc-run.mjs --scope projects/example/ [--apply]\nDefaults to preview. Uses the existing binding; never connects or enables storage.\n");
} else {
  try {
    const at = args.indexOf("--scope");
    const prefix = at < 0 ? undefined : args[at + 1];
    if (!prefix || args.some((arg, index) => index !== at && index !== at + 1 && arg !== "--apply")) throw new Error("Use --scope PREFIX and optional --apply; see --help.");
    const store = new SpecStore();
    const preview = await store.gc({ path_prefix: prefix });
    const result = args.includes("--apply") && preview.deleted.length
      ? await store.gc({ path_prefix: prefix, apply: true, base_revision: preview.revision, plan_id: preview.plan_id }) : preview;
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(JSON.stringify({ code: error.code || "ERROR", message: error.message, ...error.details }) + "\n");
    process.exitCode = 1;
  }
}
