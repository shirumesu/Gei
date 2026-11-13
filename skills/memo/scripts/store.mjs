// The memory store is a directory, normally a git clone, at ~/.agents/geispec. It holds the
// snapshots of memo.db, long documents under <scope>/docs/, and the user's AGENTS.md.
// This module holds the paths and the git steps; sync.mjs puts them together.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const storeDir = () => path.join(os.homedir(), ".agents", "geispec");
export const stateDir = () => path.join(os.homedir(), ".agents", "gei-state");

// The generated snapshot files, by path relative to the store.
export const isSnapshot = rel => /^(context|projects\/[^/]+)\/(entries\.jsonl|signals\.tsv)$/u.test(rel.split(path.sep).join("/"));

export function git(args, { cwd = storeDir(), timeout = 20000 } = {}) {
  try {
    return execFileSync("git", args, {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout, windowsHide: true,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    }).trim();
  } catch (error) {
    const detail = String(error.stderr || "").trim() || error.message;
    throw new Error(`git ${args.join(" ")}: ${detail}`);
  }
}

// "missing", "plain" (a directory without git: nothing to sync) or "git".
export function storeKind(dir = storeDir()) {
  if (!fs.existsSync(dir)) return "missing";
  if (!fs.statSync(dir).isDirectory()) throw new Error(`${dir} is not a directory.`);
  return fs.existsSync(path.join(dir, ".git")) ? "git" : "plain";
}

export function upstream(dir) {
  try { return git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { cwd: dir }); }
  catch (error) {
    // A branch without upstream, or a detached HEAD, simply has nothing to sync with.
    if (/no upstream configured|does not point to a branch/iu.test(error.message)) return null;
    throw error;
  }
}

export const count = (dir, range) => Number(git(["rev-list", "--count", range], { cwd: dir }));
export const hasCommits = dir => git(["rev-list", "-n", "1", "--all"], { cwd: dir }) !== "";

export function unfinished(dir) {
  const gitDir = path.join(dir, ".git");
  return ["MERGE_HEAD", "rebase-merge", "rebase-apply"].some(name => fs.existsSync(path.join(gitDir, name)));
}

// Commits local changes to hand-edited files, then fetches and rebases onto the upstream.
// Returns the upstream branch, or null for a store without one. Throws on any failure, with what
// already happened, so the caller can show it.
export function commitAndPull(dir, done) {
  if (git(["status", "--porcelain"], { cwd: dir }) !== "") {
    git(["add", "-A"], { cwd: dir });
    git(["commit", "-q", "-m", `Update memory from ${os.hostname()}`], { cwd: dir });
    done.push("committed local changes");
  }
  const remoteBranch = hasCommits(dir) ? upstream(dir) : null;
  if (!remoteBranch) {
    if (git(["remote"], { cwd: dir })) throw new Error(`${dir} has a remote but its branch has no upstream. Run \`git push -u origin HEAD\` there once.`);
    return null;
  }
  try { git(["fetch", "-q"], { cwd: dir, timeout: 25000 }); }
  catch (error) { throw new Error(`${done.length ? done.join(", ") + "; then " : ""}fetch failed. ${error.message}`); }
  if (count(dir, "HEAD..@{u}") > 0) {
    try { git(["rebase", "-q", "@{u}"], { cwd: dir }); }
    catch (error) {
      if (!unfinished(dir)) throw error;
      const files = git(["diff", "--name-only", "--diff-filter=U"], { cwd: dir }).split("\n").filter(Boolean);
      git(["rebase", "--abort"], { cwd: dir });
      throw new Error(`This machine and the remote both changed ${files.join(", ") || "the same lines"}; nothing was pushed. Resolve by hand: cd ${dir} && git pull --rebase`);
    }
    done.push(`pulled ${remoteBranch}`);
  }
  return remoteBranch;
}

// Codex reads ~/.codex/AGENTS.md; setup links it to the store, and Windows gets a copy instead.
export function refreshCodexCopy() {
  if (process.platform !== "win32") return;
  const source = path.join(storeDir(), "AGENTS.md");
  const target = path.join(os.homedir(), ".codex", "AGENTS.md");
  if (!fs.existsSync(source) || !fs.existsSync(path.dirname(target))) return;
  const text = fs.readFileSync(source, "utf8");
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== text) fs.writeFileSync(target, text);
}
