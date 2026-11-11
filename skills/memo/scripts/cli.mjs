// `gei memo <command>`: setup, sync, lint, trace.
import { lintStore } from "./memory.mjs";
import { resolveProject } from "./project.mjs";
import { setup } from "./setup.mjs";
import { storeKind, sync } from "./store.mjs";
import { traceSession, usage } from "./trace.mjs";

const HELP = `Usage: gei memo <command>

  setup [<repository-url>] [--yes]  Clone or create ~/.agents/geispec and wire Claude Code and Codex to it.
                                    Shows each change and asks first; --yes applies them all.
  sync                              Commit local memory changes, pull, and push.
  lint                              Check indexes, budgets and the current project's MAP.md pointers.
  trace [<session-id>|<file.jsonl>] What a Claude Code session in this directory was given and which
                                    memory files it read (default: the latest session).
  trace --usage                     Reads per memory file across all transcripts, least recent first.`;

export async function main(args) {
  const [command, ...rest] = args;
  if (!command || command === "--help" || command === "-h") { console.log(HELP); return; }
  if (command === "setup") return setup(rest);
  if (command === "sync") {
    const result = sync();
    console.log(result.kind === "plain" ? "The store has no git repository; nothing to sync."
      : result.done.length ? result.done.join("; ") : "Already in sync.");
    return;
  }
  if (command === "lint") {
    if (storeKind() === "missing") throw new Error("~/.agents/geispec does not exist. Run `gei memo setup`.");
    const problems = lintStore(resolveProject(process.cwd()));
    console.log(problems.length ? problems.map(item => `- ${item}`).join("\n") : "No problems.");
    if (problems.length) process.exitCode = 1;
    return;
  }
  if (command === "trace") {
    console.log(rest.includes("--usage") ? usage() : traceSession({ cwd: process.cwd(), session: rest.find(arg => !arg.startsWith("--")) }));
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${HELP}`);
}
