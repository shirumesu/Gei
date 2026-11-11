// `gei memo setup [<repository-url>] [--yes]`: put this machine's memory store and the
// configuration around it in place. Every change is shown first and applied only when confirmed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { git, storeDir, storeKind } from "./store.mjs";

const home = os.homedir();
const IMPORT_LINE = "@~/.agents/geispec/AGENTS.md";
const read = file => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;

function storeStep(url) {
  const dir = storeDir();
  const kind = storeKind(dir);
  if (kind === "plain") {
    throw new Error(`${dir} exists but is not a git repository. Move it aside (for example into ~/.agents/geispec-backups/) and run setup again; nothing was changed.`);
  }
  if (kind === "git") {
    const remotes = git(["remote"], { cwd: dir }).split("\n");
    const remote = remotes.includes("origin") ? git(["remote", "get-url", "origin"], { cwd: dir }) : null;
    if (url && remote !== url) throw new Error(`${dir} already has ${remote ? `origin ${remote}` : "no origin"}, not ${url}. Change it by hand if that is intended.`);
    return null;
  }
  return url
    ? { title: `Clone ${url} into ${dir}`, apply: () => git(["clone", "-q", url, dir], { cwd: home, timeout: 120000 }) }
    : { title: `Create ${dir} as a local git repository with no remote`, apply: () => { fs.mkdirSync(dir, { recursive: true }); git(["init", "-q"], { cwd: dir }); } };
}

// The store's AGENTS.md is the one copy of the user's standing instructions.
function claudeStep() {
  const file = path.join(home, ".claude", "CLAUDE.md");
  const agents = path.join(storeDir(), "AGENTS.md");
  const current = read(file)?.trim() || "";
  if (current === IMPORT_LINE) return null;
  const stored = read(agents)?.trim() || "";
  if (current && stored && current !== stored) {
    throw new Error(`${file} and ${agents} both have instructions and they differ. Merge them into ${agents} by hand, then run setup again.`);
  }
  const moves = current && !stored;
  return {
    title: `Replace ${file} with the single line ${IMPORT_LINE}${moves ? `, moving its current ${current.split("\n").length} lines into ${agents}` : ""}`,
    apply: () => {
      if (moves) fs.writeFileSync(agents, `${current}\n`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${IMPORT_LINE}\n`);
    },
  };
}

function codexStep() {
  const dir = path.join(home, ".codex");
  if (!fs.existsSync(dir)) return null;
  const file = path.join(dir, "AGENTS.md");
  const agents = path.join(storeDir(), "AGENTS.md");
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink() && path.resolve(dir, fs.readlinkSync(file)) === agents) return null;
  const current = stat && !stat.isSymbolicLink() ? fs.readFileSync(file, "utf8").trim() : "";
  if (current && current !== (read(agents)?.trim() || "")) {
    throw new Error(`${file} has its own instructions. Merge them into ${agents} by hand and delete ${file}, then run setup again.`);
  }
  const copy = process.platform === "win32";
  return {
    title: copy ? `Copy ${agents} to ${file} (each sync refreshes the copy)` : `Make ${file} a symbolic link to ${agents}`,
    apply: () => {
      if (stat) fs.rmSync(file);
      if (copy) fs.copyFileSync(agents, file); else fs.symlinkSync(agents, file);
    },
  };
}

// Native file tools need the store allowed from every project; auto memory would split memory in two.
function settingsStep() {
  const file = path.join(home, ".claude", "settings.json");
  const settings = read(file) === null ? {} : JSON.parse(read(file));
  const permissions = settings.permissions || {};
  const dirs = permissions.additionalDirectories || [];
  const allow = permissions.allow || [];
  const rules = ["Read(~/.agents/geispec/**)", "Edit(~/.agents/geispec/**)"];
  const missing = [
    ...(dirs.includes(storeDir()) ? [] : [`permissions.additionalDirectories += ${storeDir()}`]),
    ...rules.filter(rule => !allow.includes(rule)).map(rule => `permissions.allow += ${rule}`),
    ...(settings.autoMemoryEnabled === false ? [] : ["autoMemoryEnabled = false (move any notes from ~/.claude/projects/*/memory/ into the store first)"]),
  ];
  if (!missing.length) return null;
  return {
    title: `Update ${file}: ${missing.join("; ")}`,
    apply: () => {
      settings.permissions = { ...permissions, additionalDirectories: [...new Set([...dirs, storeDir()])], allow: [...new Set([...allow, ...rules])] };
      settings.autoMemoryEnabled = false;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
    },
  };
}

function codexSandboxNote() {
  const config = read(path.join(home, ".codex", "config.toml"));
  if (config === null || !/^\s*sandbox_mode\s*=\s*"workspace-write"/mu.test(config) || config.includes(storeDir())) return null;
  return `Codex runs in workspace-write mode and cannot write the store. Add this to ~/.codex/config.toml by hand:\n  [sandbox_workspace_write]\n  writable_roots = ["${storeDir()}"]`;
}

export async function setup(args) {
  const yes = args.includes("--yes");
  const url = args.find(arg => !arg.startsWith("--"));
  if (!yes && !process.stdin.isTTY) {
    throw new Error("setup asks before each change; run it in a terminal, or pass --yes to apply every change.");
  }
  const prompt = yes ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
  const run = async step => {
    if (!step) return;
    const answer = yes ? "y" : (await prompt.question(`${step.title}\nApply? [y/N] `)).trim().toLowerCase();
    if (answer === "y" || answer === "yes") { step.apply(); console.log("  done"); }
    else console.log("  skipped");
  };
  try {
    await run(storeStep(url));
    // The other steps read the store, so they are planned only once it exists.
    if (storeKind() === "missing") return;
    for (const plan of [claudeStep, codexStep, settingsStep]) await run(plan());
  } finally { prompt?.close(); }
  const note = codexSandboxNote();
  if (note) console.log(note);
  if (storeKind() === "git" && git(["remote"], { cwd: storeDir() })) {
    git(["ls-remote", "-q", "origin"], { cwd: storeDir(), timeout: 20000 });
    console.log("The remote answers without a prompt, so the hooks can pull and push.");
  }
  console.log("Setup finished.");
}
