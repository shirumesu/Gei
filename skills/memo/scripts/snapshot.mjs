// Snapshots of memo.db in the store: <scope>/entries.jsonl (content) and <scope>/signals.tsv
// (strength), one line per entry sorted by id, fixed field order, so the same database always
// exports the same text. Import merges a snapshot into the database by the rules of the plan:
// newer updated_at wins the content, newer signal_at wins the strength, the losing content is
// kept in the local history, and entries missing from the snapshot are local and stay.
import fs from "node:fs";
import path from "node:path";
import { all, entries, entry, saveEntry, saveHistory, tx } from "./db.mjs";

const SIGNALS = ["id", "level", "uses", "losses", "shadow", "flagged", "used_at", "signal_at"];

const content = item => ({
  id: item.id, keys: item.keys, when: item.when, do: item.do, why: item.why, group: item.group, origin: item.origin,
  pin: item.pin, state: item.state, src: item.src, rev: item.rev, created_at: item.created_at, updated_at: item.updated_at,
});
const signalLine = item => [item.id, item.level, item.uses, item.losses, item.shadow ? 1 : 0, item.flagged, item.used_at === null ? "-" : item.used_at, item.signal_at].join("\t");

// The text of every scope's two files, keyed by path relative to the store. A scope that has a
// snapshot on disk but no entries left (all moved away) is written empty rather than left stale.
export function snapshotTexts(extraScopes = []) {
  const files = {};
  const scopes = new Set([...all("SELECT DISTINCT scope FROM entries").map(row => row.scope), ...extraScopes]);
  for (const scope of [...scopes].sort()) {
    const list = entries("scope = ?", scope);
    files[`${scope}/entries.jsonl`] = list.map(item => JSON.stringify(content(item))).join("\n") + "\n";
    files[`${scope}/signals.tsv`] = [SIGNALS.join("\t"), ...list.map(signalLine)].join("\n") + "\n";
  }
  return files;
}

// Writes the files that differ and returns their relative paths.
export function exportSnapshots(dir) {
  const changed = [];
  for (const [rel, text] of Object.entries(snapshotTexts(scopesIn(dir)))) {
    const file = path.join(dir, rel);
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === text) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    changed.push(rel);
  }
  return changed;
}

function scopesIn(dir) {
  const scopes = fs.existsSync(path.join(dir, "context", "entries.jsonl")) ? ["context"] : [];
  const projects = path.join(dir, "projects");
  if (fs.existsSync(projects)) {
    for (const item of fs.readdirSync(projects, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (item.isDirectory() && fs.existsSync(path.join(projects, item.name, "entries.jsonl"))) scopes.push(`projects/${item.name}`);
    }
  }
  return scopes;
}

function readScope(dir, scope) {
  const where = rel => path.join(dir, scope, rel);
  const lines = file => fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  const signals = new Map();
  const signalFile = where("signals.tsv");
  if (!fs.existsSync(signalFile)) throw new Error(`${scope}/entries.jsonl has no ${scope}/signals.tsv beside it.`);
  const [head, ...rows] = lines(signalFile);
  if (head !== SIGNALS.join("\t")) throw new Error(`${scope}/signals.tsv does not start with the header ${SIGNALS.join(" ")}.`);
  for (const line of rows) {
    const cells = line.split("\t");
    if (cells.length !== SIGNALS.length) throw new Error(`${scope}/signals.tsv has a malformed line: ${line}`);
    const [id, level, uses, losses, shadow, flagged, usedAt, signalAt] = cells;
    signals.set(id, { level: Number(level), uses: Number(uses), losses: Number(losses), shadow: shadow === "1", flagged: Number(flagged), used_at: usedAt === "-" ? null : usedAt, signal_at: signalAt });
  }
  return lines(where("entries.jsonl")).map(line => {
    const item = JSON.parse(line);
    const strength = signals.get(item.id);
    if (!strength) throw new Error(`${scope}/signals.tsv has no line for ${item.id}.`);
    return { ...item, scope, ...strength };
  });
}

// A total order on two versions of the same entry's content, the same on every machine.
const newer = (a, b) => a.updated_at !== b.updated_at ? a.updated_at > b.updated_at
  : a.rev !== b.rev ? a.rev > b.rev : JSON.stringify(content(a)) > JSON.stringify(content(b));
const sameContent = (a, b) => a.scope === b.scope && JSON.stringify(content(a)) === JSON.stringify(content(b));
const inHistory = item => all("SELECT 1 FROM history WHERE entry_id = ? AND updated_at = ? AND rev = ?", item.id, item.updated_at, item.rev).length > 0;

// Merges every snapshot in the store into the database; returns how many entries changed.
export function importSnapshots(dir) {
  const remote = scopesIn(dir).flatMap(scope => readScope(dir, scope));
  return tx(() => {
    let changed = 0;
    for (const theirs of remote) {
      const ours = entry(theirs.id);
      if (!ours) { saveEntry({ ...theirs, revived: 0 }); changed += 1; continue; }
      const merged = { ...ours };
      if (!sameContent(ours, theirs)) {
        const [winner, loser] = newer(theirs, ours) ? [theirs, ours] : [ours, theirs];
        if (!inHistory(loser)) saveHistory(loser, "sync");
        Object.assign(merged, content(winner), { scope: winner.scope });
      }
      if (theirs.signal_at > ours.signal_at) {
        for (const key of SIGNALS.slice(1)) merged[key] = theirs[key];
      }
      if (JSON.stringify(merged) !== JSON.stringify(ours)) { saveEntry(merged); changed += 1; }
    }
    return changed;
  });
}
