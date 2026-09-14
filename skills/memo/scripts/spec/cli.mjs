#!/usr/bin/env node
import fs from "node:fs";
import { SpecStore } from "./store.mjs";
import { callTool } from "./tools.mjs";

const help = `Gei Spec — local Markdown or a private GitHub knowledge repository

node <plugin>/skills/memo/scripts/spec/cli.mjs [spec] <command>

  status                         Show settings and cached connection status
  enable | disable               Enable/disable knowledge (other Skills stay available)
  connect github --repo OWNER/NAME [--branch NAME] [--create] [--apply]
                                 Preview binding/import; --apply performs the displayed action
  use local [--cached-revision REV] [--apply]
                                 Preview snapshot export; --apply backs up and switches
  refresh                        Download the current complete snapshot
  read | search | edit           Read JSON arguments from stdin or --input FILE
  check --scope PREFIX          Bounded maintenance worklist; --all covers both roots
  gc --scope PREFIX             Preview explicit transient cleanup; --apply executes
                                with --base-revision REV --plan-id ID from the preview
  restore [--backup ID]          List/preview local deletion recovery; --apply restores
  check/gc also accept JSON via --input FILE (same schema as MCP).
  check: --limit N --offset N --revision REV --checkout-root DIR
  login                          Explain GitHub authentication

Use gh auth login or GEI_GITHUB_TOKEN for GitHub. No credentials are saved in Spec.
GEI_SPEC_HOME selects local knowledge. GEI_SPEC_STATE selects external settings/cache.
Settings changes do not enable a disabled Spec. GitHub mode has no offline write queue.
`;
try {
  const args = process.argv.slice(2);
  if (args[0] === "spec") args.shift();
  const command = args.shift();
  if (!command || ["--help", "help", "-h"].includes(command)) { process.stdout.write(help); process.exit(0); }
  const options = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (["--apply", "--create", "--all"].includes(args[i])) options[args[i].slice(2)] = true;
    else if (["--repo", "--branch", "--input", "--cached-revision", "--scope", "--base-revision", "--plan-id", "--revision", "--limit", "--offset", "--checkout-root", "--backup"].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith("--")) options[args[i].slice(2).replaceAll("-", "_")] = args[++i];
    else if (args[i].startsWith("--")) throw new Error(`Unknown or incomplete option: ${args[i]}`);
    else positional.push(args[i]);
  }
  const store = new SpecStore();
  let result;
  if (command === "status") result = await store.status();
  else if (command === "enable" || command === "disable") result = await store.setEnabled(command === "enable");
  else if (command === "refresh") result = await store.refresh();
  else if (command === "connect" && positional[0] === "github") result = await store.connect(options);
  else if (command === "use" && positional[0] === "local") result = await store.useLocal(options);
  else if (command === "restore") result = await store.restore(options);
  else if (["check", "gc"].includes(command)) {
    const input = options.input ? JSON.parse(fs.readFileSync(options.input, "utf8")) : { path_prefix: options.all ? "all" : options.scope,
      ...(options.base_revision ? { base_revision: options.base_revision } : {}), ...(options.revision ? { revision: options.revision } : {}),
      ...(options.plan_id ? { plan_id: options.plan_id } : {}),
      ...(options.limit ? { max_results: Number(options.limit) } : {}), ...(options.offset ? { offset: Number(options.offset) } : {}),
      ...(options.checkout_root ? { checkout_root: options.checkout_root } : {}), ...(options.apply ? { apply: true } : {}) };
    result = await callTool(store, `spec_${command}`, input);
  }
  else if (command === "login") result = { command: "gh auth login --hostname github.com", alternative: "Set GEI_GITHUB_TOKEN in your private environment. Never put tokens in knowledge or plugin files." };
  else if (["read", "search", "edit"].includes(command)) {
    const input = options.input ? fs.readFileSync(options.input, "utf8") : fs.readFileSync(0, "utf8");
    result = await callTool(store, `spec_${command}`, JSON.parse(input));
  } else throw new Error("Unknown command. Use --help.");
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} catch (error) {
  process.stderr.write(JSON.stringify({ code: error.code || "ERROR", message: error.message, ...error.details }) + "\n");
  process.exitCode = 1;
}
