// The working database, ~/.agents/gei-state/memo.db. The only module that touches node:sqlite.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { stateDir } from "./store.mjs";

// node:sqlite announces itself as experimental on stderr before Node 24; that one notice would
// otherwise end up in the output of every `memo` call. Every other warning is printed as usual.
const printers = process.listeners("warning");
process.removeAllListeners("warning");
process.on("warning", warning => {
  if (warning.name === "ExperimentalWarning" && /SQLite/u.test(warning.message)) return;
  for (const print of printers) print(warning);
});
const { DatabaseSync } = await import("node:sqlite");

export const dbFile = () => path.join(stateDir(), "memo.db");
export const now = () => new Date().toISOString();

// Content fields (entries.jsonl) and strength fields (signals.tsv) are merged separately on sync;
// `revived` is local bookkeeping for `memo review`. `state` is active or deleted (content);
// `shadow` is the eviction flag (strength), so a delete on one machine never comes back from
// another machine that only strengthened or shadowed the entry.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY, scope TEXT NOT NULL, keys TEXT NOT NULL, when_text TEXT NOT NULL, do_text TEXT NOT NULL,
  why TEXT, grp TEXT, origin TEXT NOT NULL CHECK (origin IN ('u', 'a')), pin INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active', 'deleted')), src TEXT, rev INTEGER NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  level INTEGER NOT NULL, uses INTEGER NOT NULL, losses INTEGER NOT NULL, shadow INTEGER NOT NULL,
  flagged INTEGER NOT NULL, used_at TEXT, signal_at TEXT NOT NULL, revived INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS entries_scope ON entries (scope);
CREATE TABLE IF NOT EXISTS history (
  entry_id TEXT NOT NULL, rev INTEGER NOT NULL, scope TEXT NOT NULL, keys TEXT NOT NULL, when_text TEXT NOT NULL,
  do_text TEXT NOT NULL, why TEXT, grp TEXT, pin INTEGER NOT NULL, state TEXT NOT NULL, updated_at TEXT NOT NULL,
  saved_at TEXT NOT NULL, reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS history_entry ON history (entry_id);
CREATE TABLE IF NOT EXISTS deliveries (
  session_id TEXT, batch_id TEXT NOT NULL, project TEXT, entry_id TEXT, rank INTEGER,
  via TEXT NOT NULL CHECK (via IN ('start', 'prime', 'find')), query TEXT,
  cited INTEGER NOT NULL DEFAULT 0, lost INTEGER NOT NULL DEFAULT 0, at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS deliveries_session ON deliveries (session_id, entry_id);
CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, project TEXT NOT NULL, started_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
PRAGMA user_version = 1;
`;

let handle = null;

// Switching to WAL does not wait on the busy timeout, so two first-time processes would collide.
// The database is built under a private name and linked into place; the loser of that race
// (EEXIST) simply opens the winner's file.
function create(file) {
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}`;
  const fresh = new DatabaseSync(temp);
  fresh.exec("PRAGMA journal_mode = WAL;");
  fresh.exec(SCHEMA);
  fresh.close();
  try { fs.linkSync(temp, file); }
  catch (error) { if (error.code !== "EEXIST") throw error; }
  finally { fs.rmSync(temp); }
}

// Two sessions may write at once: WAL lets readers through and the busy timeout makes a writer wait.
export function db() {
  if (handle) return handle;
  fs.mkdirSync(stateDir(), { recursive: true });
  if (!fs.existsSync(dbFile())) create(dbFile());
  handle = new DatabaseSync(dbFile());
  handle.exec("PRAGMA busy_timeout = 10000;");
  return handle;
}

export const all = (sql, ...params) => db().prepare(sql).all(...params);
export const get = (sql, ...params) => db().prepare(sql).get(...params);
export const run = (sql, ...params) => db().prepare(sql).run(...params);

// One write transaction; IMMEDIATE takes the write lock up front so read-then-write cannot interleave.
export function tx(fn) {
  db().exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db().exec("COMMIT");
    return result;
  } catch (error) {
    db().exec("ROLLBACK");
    throw error;
  }
}

export const getMeta = key => get("SELECT value FROM meta WHERE key = ?", key)?.value;
export const setMeta = (key, value) => run("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", key, value);

const ENTRY = row => row && ({
  id: row.id, scope: row.scope, keys: JSON.parse(row.keys), when: row.when_text, do: row.do_text, why: row.why,
  group: row.grp, origin: row.origin, pin: row.pin === 1, state: row.state, src: row.src, rev: row.rev,
  created_at: row.created_at, updated_at: row.updated_at, level: row.level, uses: row.uses, losses: row.losses,
  shadow: row.shadow === 1, flagged: row.flagged, used_at: row.used_at, signal_at: row.signal_at, revived: row.revived,
});

export const entry = id => ENTRY(get("SELECT * FROM entries WHERE id = ?", id));
export const entries = (where = "1", ...params) => all(`SELECT * FROM entries WHERE ${where} ORDER BY id`, ...params).map(ENTRY);

const COLUMNS = ["id", "scope", "keys", "when_text", "do_text", "why", "grp", "origin", "pin", "state", "src", "rev",
  "created_at", "updated_at", "level", "uses", "losses", "shadow", "flagged", "used_at", "signal_at", "revived"];
const row = item => [item.id, item.scope, JSON.stringify(item.keys), item.when, item.do, item.why, item.group, item.origin,
  item.pin ? 1 : 0, item.state, item.src, item.rev, item.created_at, item.updated_at, item.level, item.uses, item.losses,
  item.shadow ? 1 : 0, item.flagged, item.used_at, item.signal_at, item.revived];

// Writes a whole entry (insert or overwrite).
export function saveEntry(item) {
  run(`INSERT OR REPLACE INTO entries (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`, ...row(item));
}

// Keeps a superseded version of an entry's content in the local revision history.
export function saveHistory(item, reason) {
  run(`INSERT INTO history (entry_id, rev, scope, keys, when_text, do_text, why, grp, pin, state, updated_at, saved_at, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item.id, item.rev, item.scope, JSON.stringify(item.keys), item.when,
  item.do, item.why, item.group, item.pin ? 1 : 0, item.state, item.updated_at, now(), reason);
}

export const history = id => all("SELECT * FROM history WHERE entry_id = ? ORDER BY updated_at, saved_at", id);
