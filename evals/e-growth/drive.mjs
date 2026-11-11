#!/usr/bin/env node
// E family: cost and growth. Runs ten scripted sessions one after another on the same memory
// store, then a read check (B) and a reuse check (C) on the grown store. `claude plugin eval`
// starts every run from an empty home, so each session is generated as a one-run case whose
// scaffold seeds the store the previous session left; the store is copied out of the kept
// sandbox afterwards. Usage, from the repository root:
//   node evals/e-growth/drive.mjs [--model claude-sonnet-5-5]
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const model = process.argv.includes("--model") ? process.argv[process.argv.indexOf("--model") + 1] : "claude-sonnet-5-5";
const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
const run = path.join(repo, "evals", "results", "e-growth", stamp);
// Case discovery skips results/, so the generated cases live in a scratch directory of their own.
const relCases = path.join("e-growth-cases", stamp);
const casesDir = path.join(repo, relCases);
const fixture = path.join(repo, "evals", "lib", "fixture.sh");

const SESSIONS = [
  "Add a `format` script to package.json that runs `prettier --write .`. Also, the README tells people to run `npm install`, but this project uses pnpm only; I keep having to fix the npm commands you add. Fix the README.",
  "Add `product(values)` to src/math.js; it multiplies an array of numbers and returns 1 for an empty array.",
  "Add src/slugify.js exporting `slugify(text)`, which lowercases the text and joins its words with hyphens. By the way: every new module in src/ also gets a line `- <file>: <purpose>` in MODULES.md, because my release script builds the exports from that file. You forgot it last time.",
  "Bump the version in package.json to 1.3.0.",
  "For all my projects from now on: commit messages are English, imperative mood, no trailing period. Write the commit message for adding an optional `punctuation` argument to `greet()` (just show it).",
  "Add a `build` script to package.json that runs `tsc -p .`, and mention it in the README. And again: pnpm, not npm, in anything you write here.",
  "Add src/clamp.js exporting `clamp(value, min, max)`.",
  "Add a user with id 4 named \"Dana\" to the user data. Note that data/users.json is generated from data/users.src.json by my sync job and gets overwritten, so only ever edit users.src.json.",
  "Add `lastSeenLabel(user)` to src/users.js returning \"last seen <relative time>\" from `user.lastSeen`. We already have `spanPhrase` in src/core/chrono/span.js for relative time; this is the third time I have had to point you to it.",
  "Rename `greet` to `greeting` in src/greet.js and in the README.",
];
const CHECKS = [
  { name: "check-read", prompt: "Add src/kebab.js exporting `kebab(text)`, which lowercases text and joins words with hyphens.",
    graders: { registered: "type: regex\ntarget: { source: file, path: MODULES.md }\npattern: 'kebab'" } },
  { name: "check-reuse", prompt: "Add `lastActiveLabel(user)` to src/users.js returning \"active <relative time>\" from `user.lastActive` (a Date).",
    graders: { reused: "type: regex\ntarget: { source: file, path: src/users.js }\npattern: 'spanPhrase'" } },
];

function writeCase(name, prompt, graders, snapshot) {
  const dir = path.join(casesDir, name);
  fs.mkdirSync(path.join(dir, "graders"), { recursive: true });
  fs.writeFileSync(path.join(dir, "case.yaml"), `schema_version: "1.1"\nname: ${name}\nplugins: ["${path.relative(dir, repo)}"]\nruns: 1\ncontext:\n  scaffold_script: scaffold.sh\n`);
  fs.writeFileSync(path.join(dir, "prompt.md"), `---\nmax_turns: 30\ntimeout_seconds: 420\nallowed_tools: [Read, Glob, Grep, Skill, Write, Edit]\n---\n\n${prompt}\n`);
  const seed = snapshot ? `mkdir -p "$HOME/.agents"\ncp -R "${snapshot}" "$STORE"\n` : "init_store\n";
  fs.writeFileSync(path.join(dir, "scaffold.sh"), `#!/bin/bash\nsource "${fixture}"\nbase_repo\nadd_reuse_sources\n${seed}`);
  for (const [grader, body] of Object.entries(graders)) fs.writeFileSync(path.join(dir, "graders", `${grader}.md`), `---\n${body}\n---\n`);
}

function runCase(name) {
  const json = path.join(run, `${name}.json`);
  const result = spawnSync("claude", ["plugin", "eval", ".", "--eval-dir", relCases, "--case", name,
    "--runs", "1", "--ablation", "none", "--scaffold", "--trust-plugin", "--no-publish", "--keep-temp", "--model", model,
    "--threshold", "0", "--allow-tools", "Write", "Edit", "Read(~/.agents/geispec/**)", "Edit(~/.agents/geispec/**)", "--json", json],
  { cwd: repo, encoding: "utf8", timeout: 900000 });
  const output = `${result.stdout}\n${result.stderr}`;
  const kept = /kept (\/\S+?):/u.exec(output)?.[1];
  if (result.status !== 0 || !kept || !fs.existsSync(json)) throw new Error(`${name} failed (exit ${result.status}).\n${output.slice(-2000)}`);
  const caseResult = JSON.parse(fs.readFileSync(json, "utf8")).cases[0].arms.with[0];
  if (caseResult.error) throw new Error(`${name} run error: ${caseResult.error}`);
  fs.chmodSync(kept, 0o700);
  fs.chmodSync(path.join(kept, "sealed"), 0o700);
  const store = path.join(run, "stores", name);
  fs.cpSync(path.join(kept, "sealed", "home", ".agents", "geispec"), store, { recursive: true });
  execFileSync("chmod", ["-R", "u+rwx", kept]);
  fs.rmSync(kept, { recursive: true });
  return { store, score: caseResult.score, cost: caseResult.costUsd + (caseResult.judgeCostUsd || 0) };
}

// What a session would be given with this store, measured by the real SessionStart hook.
function measure(store, name) {
  // Outside any git repository, so the workspace resolves to the project "cwd" like the runs.
  const home = fs.mkdtempSync(path.join(os.tmpdir(), `gei-e-${name}-`));
  fs.mkdirSync(path.join(home, "cwd"));
  fs.mkdirSync(path.join(home, ".agents"), { recursive: true });
  fs.cpSync(store, path.join(home, ".agents", "geispec"), { recursive: true });
  const out = execFileSync("node", [path.join(repo, "hooks", "session_start.mjs")], {
    input: JSON.stringify({ cwd: path.join(home, "cwd") }), env: { ...process.env, HOME: home }, encoding: "utf8" });
  fs.rmSync(home, { recursive: true });
  const context = JSON.parse(out).hookSpecificOutput.additionalContext;
  const topics = [];
  const walk = dir => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory() && item.name !== ".git") walk(full);
      else if (item.name.endsWith(".md") && !["MEMORY.md", "MAP.md", "AGENTS.md"].includes(item.name)) topics.push(full);
    }
  };
  walk(store);
  const words = file => new Set(fs.readFileSync(file, "utf8").toLowerCase().match(/[a-z]{4,}/gu) || []);
  let duplicates = 0;
  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const a = words(topics[i]); const b = words(topics[j]);
      const shared = [...a].filter(word => b.has(word)).length;
      if (shared / (a.size + b.size - shared) > 0.5) duplicates += 1;
    }
  }
  const mapFile = path.join(store, "projects", "cwd", "MAP.md");
  return {
    chars: context.length, lines: context.split("\n").filter(Boolean).length, topics: topics.length,
    pointers: fs.existsSync(mapFile) ? fs.readFileSync(mapFile, "utf8").split("\n").filter(Boolean).length : 0,
    problems: (context.split("## Memory problems")[1] || "").split("\n").filter(line => line.startsWith("- ")).length,
    duplicates, files: topics.map(file => path.relative(store, file)),
  };
}

fs.mkdirSync(run, { recursive: true });
const rows = [];
const checks = {};
let cost = 0;
// The generated cases are scratch; only the stores, measurements and report are kept.
try {
  let snapshot = null;
  for (const [index, prompt] of SESSIONS.entries()) {
    const name = `s${String(index + 1).padStart(2, "0")}`;
    writeCase(name, prompt, { ran: "type: regex\npattern: '.'" }, snapshot);
    const result = runCase(name);
    snapshot = result.store;
    cost += result.cost;
    rows.push({ name, ...measure(snapshot, name) });
    console.log(`${name}: ${JSON.stringify(rows.at(-1))}`);
  }
  for (const check of CHECKS) {
    writeCase(check.name, check.prompt, check.graders, snapshot);
    const result = runCase(check.name);
    cost += result.cost;
    checks[check.name] = result.score;
  }
} finally {
  fs.rmSync(path.join(repo, "e-growth-cases"), { recursive: true, force: true });
}
const last = rows.at(-1);
const report = [
  `# E growth run ${stamp} (${model})`, "",
  "| Session | Injected chars | Injected lines | Topic files | Pointers | Lint problems | Near-duplicate pairs |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map(row => `| ${row.name} | ${row.chars} | ${row.lines} | ${row.topics} | ${row.pointers} | ${row.problems} | ${row.duplicates} |`),
  "", `Files after ${rows.length} sessions: ${last.files.join(", ") || "none"}`,
  `Checks on the grown store: read ${checks["check-read"]}, reuse ${checks["check-reuse"]}. Cost $${cost.toFixed(2)}.`,
].join("\n");
fs.writeFileSync(path.join(run, "report.md"), `${report}\n`);
console.log(`\n${report}\n\nReport: ${path.join(run, "report.md")}`);
