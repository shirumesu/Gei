// Sync the store with its remote. Hand-edited files (docs/, AGENTS.md) go through git as
// before; the snapshot files are generated from memo.db and merged by memo, never by git.
// Invariant: no unpushed local commit contains snapshot files, so a rebase never conflicts on them.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getMeta, now, setMeta } from "./db.mjs";
import { exportSnapshots, importSnapshots } from "./snapshot.mjs";
import { commitAndPull, count, git, hasCommits, isSnapshot, storeDir, storeKind, unfinished, upstream } from "./store.mjs";

const PATHSPECS = ["context/entries.jsonl", "context/signals.tsv", "projects/*/entries.jsonl", "projects/*/signals.tsv"].map(spec => `:(glob)${spec}`);
export const ATTEMPTS = 3;

const lines = text => text.split("\n").filter(Boolean);

// A crash between the snapshot commit and its push leaves a snapshot-only commit; undo it first.
function undoSnapshotCommits(dir, done) {
  if (!hasCommits(dir) || !upstream(dir)) return;
  while (count(dir, "@{u}..HEAD") > 0) {
    const files = lines(git(["show", "--name-only", "--pretty=format:", "HEAD"], { cwd: dir }));
    if (!files.length || !files.every(isSnapshot)) return;
    git(["reset", "-q", "HEAD~1"], { cwd: dir });
    done.push("undid an unpushed snapshot commit left by an earlier run");
  }
}

// Step 1: the snapshot files in the working tree are generated; put them back as committed.
function restoreSnapshots(dir) {
  const tracked = lines(git(["ls-files", "--", ...PATHSPECS], { cwd: dir }));
  if (tracked.length) git(["checkout", "-q", "HEAD", "--", ...tracked], { cwd: dir });
  for (const rel of lines(git(["ls-files", "--others", "--exclude-standard", "--", ...PATHSPECS], { cwd: dir }))) fs.rmSync(path.join(dir, rel));
}

// Whether a hand-edited file (docs/, AGENTS.md) in the store changed after `since` (ms); no git.
function filesChangedSince(dir, since, rel = "") {
  for (const item of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const child = path.join(rel, item.name);
    if (child === ".git" || isSnapshot(child)) continue;
    const stat = fs.lstatSync(path.join(dir, child));
    if (stat.mtimeMs > since) return true;
    if (item.isDirectory() && filesChangedSince(dir, since, child)) return true;
  }
  return false;
}

// The end-of-turn rule: sync when content (entries or hand-edited files) changed since the last
// sync, or when only strength changed and the last sync is more than 30 minutes old.
export const SIGNALS_DELAY = 30 * 60 * 1000;
export function syncDue() {
  const synced = getMeta("synced_at");
  if (synced === undefined) return true;
  const content = getMeta("content_at");
  if (content !== undefined && content > synced) return true;
  if (filesChangedSince(storeDir(), Date.parse(synced))) return true;
  const signals = getMeta("signals_at");
  return signals !== undefined && signals > synced && Date.now() - Date.parse(synced) > SIGNALS_DELAY;
}

// Returns what was done, for the caller to show. Throws on failure with what already happened.
export function sync() {
  const dir = storeDir();
  const kind = storeKind(dir);
  if (kind === "missing") throw new Error(`${dir} does not exist. Run \`gei memo setup\`.`);
  if (kind === "plain") return { kind, done: [] };
  if (unfinished(dir)) throw new Error(`${dir} has an unfinished merge or rebase. Finish or abort it there by hand.`);
  const done = [];
  undoSnapshotCommits(dir, done);
  for (let attempt = 1; ; attempt += 1) {
    restoreSnapshots(dir);
    const remoteBranch = commitAndPull(dir, done);
    const merged = importSnapshots(dir);
    if (merged) done.push(`merged ${merged} entr${merged === 1 ? "y" : "ies"} from the store`);
    const changed = exportSnapshots(dir);
    if (changed.length) {
      git(["add", "--", ...changed], { cwd: dir });
      git(["commit", "-q", "-m", `Update memo snapshot from ${os.hostname()}`], { cwd: dir });
    }
    if (!remoteBranch || count(dir, "@{u}..HEAD") === 0) {
      if (changed.length) done.push("committed the snapshot");
      setMeta("synced_at", now());
      return { kind, done };
    }
    try {
      git(["push", "-q"], { cwd: dir, timeout: 25000 });
      done.push(`pushed to ${remoteBranch}`);
      setMeta("synced_at", now());
      return { kind, done };
    } catch (error) {
      // Nothing is lost by undoing the snapshot commit: the database still has every change.
      if (changed.length) git(["reset", "-q", "HEAD~1"], { cwd: dir });
      git(["fetch", "-q"], { cwd: dir, timeout: 25000 });
      const moved = count(dir, "HEAD..@{u}") > 0;
      if (moved && attempt < ATTEMPTS) { done.push("push rejected because the remote moved; retrying"); continue; }
      throw new Error(`${done.length ? done.join(", ") + "; then " : ""}push failed${moved ? ` ${ATTEMPTS} times while the remote kept moving` : ""}; the changes stay local until the next sync. ${error.message}`);
    }
  }
}
