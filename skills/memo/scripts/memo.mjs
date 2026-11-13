// Writing entries and keeping their strength: put, delete, pin, wrong, move, eviction, citations.
import crypto from "node:crypto";
import { all, entries, entry, get, history, now, run, saveEntry, saveHistory, setMeta, tx } from "./db.mjs";
import { strength } from "./rank.mjs";

// Internal limits. `cap` is lowered only by verification scripts; it is not a user setting.
export const LIMITS = { keys: 6, key: 24, when: 60, do: 300, why: 200, pinDo: 160, pins: 8, cap: 300, similar: 0.5 };

export const projectScope = project => `projects/${project.projectId}`;
export const scopesOf = project => [projectScope(project), "context"];
const inScopes = scopes => `scope IN (${scopes.map(() => "?").join(", ")})`;
export const visible = scopes => entries(`${inScopes(scopes)} AND state = 'active'`, ...scopes);

const contentChanged = () => setMeta("content_at", now());
const signalsChanged = () => setMeta("signals_at", now());

export function describe(item) {
  const flags = [item.scope, `L${item.level}`, `uses ${item.uses}`, item.origin === "u" ? "user" : "agent",
    ...(item.pin ? ["pinned"] : []), ...(item.shadow ? ["shadow"] : []), ...(item.state === "deleted" ? ["deleted"] : [])];
  return [`[m:${item.id}] keys: ${item.keys.join(", ")} (${flags.join(", ")})`, `  when: ${item.when}`, `  do: ${item.do}`,
    ...(item.why === null ? [] : [`  why: ${item.why}`]), ...(item.group === null ? [] : [`  group: ${item.group}`])].join("\n");
}

function need(id) {
  const item = entry(id);
  if (!item) throw new Error(`No entry ${id}. \`memo find <word>\` shows ids.`);
  return item;
}

function newId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (;;) {
    const id = Array.from({ length: 5 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
    if (!entry(id)) return id;
  }
}

// Likely secrets: well-known token prefixes, private key headers, and `password=`-style assignments.
const SECRETS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u, /\bAKIA[0-9A-Z]{16}\b/u, /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/u, /\bgithub_pat_[A-Za-z0-9_]{20,}/u,
  /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}/u, /\bxox[abprs]-[A-Za-z0-9-]{10,}/u, /\bAIza[0-9A-Za-z_-]{35}\b/u, /\bglpat-[A-Za-z0-9_-]{20,}/u,
  /\bnpm_[A-Za-z0-9]{36}\b/u, /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/u,
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret)\s*[=:]\s*\S{4,}/iu,
];

function validate(fields) {
  const { keys, when, do: action, why } = fields;
  if (!keys.length) throw new Error("--keys needs at least one key.");
  if (keys.length > LIMITS.keys) throw new Error(`${keys.length} keys; at most ${LIMITS.keys}.`);
  for (const key of keys) if (key.length > LIMITS.key) throw new Error(`Key "${key}" is ${key.length} characters; at most ${LIMITS.key}.`);
  for (const [name, value, limit] of [["--when", when, LIMITS.when], ["--do", action, LIMITS.do], ["--why", why, LIMITS.why]]) {
    if (value === null) continue;
    if (!value.trim()) throw new Error(`${name} is empty.`);
    if (value.length > limit) throw new Error(`${name} is ${value.length} characters; at most ${limit}. Shorten it, or put a long document under <scope>/docs/ and save a pointer entry.`);
  }
  for (const [name, value] of [["--keys", keys.join(",")], ["--when", when], ["--do", action], ["--why", why]]) {
    if (value !== null && SECRETS.some(pattern => pattern.test(value))) throw new Error(`${name} looks like it contains a secret. Secrets never go into memory.`);
  }
}

// Word and CJK-bigram tokens, for comparing two `do` texts.
function tokens(text) {
  const lower = text.toLowerCase();
  const words = lower.match(/[a-z0-9_]+/gu) || [];
  const bigrams = (lower.match(/[^\x00-\x7f]+/gu) || []).flatMap(run => [...run].slice(1).map((char, index) => run[index] + char));
  return new Set([...words, ...bigrams]);
}
export function similarity(a, b) {
  const x = tokens(a), y = tokens(b);
  const shared = [...x].filter(token => y.has(token)).length;
  return shared / (x.size + y.size - shared || 1);
}

function checkPin(item, scope) {
  if (item.do.length > LIMITS.pinDo) throw new Error(`A pinned entry's do is at most ${LIMITS.pinDo} characters (this one is ${item.do.length}). Shorten it first.`);
  const pinned = get("SELECT COUNT(*) AS n FROM entries WHERE scope = ? AND pin = 1 AND state = 'active' AND id != ?", scope, item.id).n;
  if (pinned >= LIMITS.pins) throw new Error(`${scope} already has ${LIMITS.pins} pinned entries. Unpin one first (\`memo unpin <id>\`).`);
}

// Over the cap of active, unpinned, agent-origin entries in a scope, the weakest become shadows:
// never-used ones oldest first, then lowest level, fewest uses, least recently used.
export function evict(scope) {
  const shadowed = [];
  for (;;) {
    const { n } = get("SELECT COUNT(*) AS n FROM entries WHERE scope = ? AND state = 'active' AND shadow = 0 AND pin = 0 AND origin = 'a'", scope);
    if (n <= LIMITS.cap) return shadowed;
    const victim = get(`SELECT id FROM entries WHERE scope = ? AND state = 'active' AND shadow = 0 AND pin = 0 AND origin = 'a'
      ORDER BY uses = 0 DESC, CASE WHEN uses = 0 THEN created_at END ASC, level ASC, uses ASC, used_at ASC NULLS FIRST, id ASC LIMIT 1`, scope).id;
    run("UPDATE entries SET shadow = 1, signal_at = ? WHERE id = ?", now(), victim);
    shadowed.push(entry(victim));
  }
}

const shadowNotes = list => list.map(item => `Shadowed [m:${item.id}] (L${item.level}, uses ${item.uses}) to stay within ${LIMITS.cap} entries; \`memo find\` still finds it: ${item.do.slice(0, 80)}`);

// `memo put`. options: keys, when, do, why, group, pin, user, shared, replace, new, scope, session.
export function put(options) {
  const fields = { keys: options.keys, when: options.when, do: options.do, why: options.why };
  validate(fields);
  return tx(() => {
    const stamp = now();
    if (options.replace) {
      const old = need(options.replace);
      if (old.state === "deleted") throw new Error(`[m:${old.id}] is deleted. \`memo restore ${old.id}\` first.`);
      if (options.shared && old.scope !== "context") throw new Error(`[m:${old.id}] is in ${old.scope}; \`memo mv ${old.id} --shared\` moves it.`);
      const next = { ...old, keys: fields.keys, when: fields.when, do: fields.do, why: fields.why === null ? old.why : fields.why,
        group: options.group === null ? old.group : options.group, pin: old.pin || options.pin, rev: old.rev + 1, updated_at: stamp };
      if (options.pin && !old.pin) checkPin(next, old.scope);
      if (next.pin && next.do.length > LIMITS.pinDo) throw new Error(`[m:${old.id}] is pinned, so its do is at most ${LIMITS.pinDo} characters.`);
      if (old.shadow) Object.assign(next, { shadow: false, revived: old.revived + 1, signal_at: stamp });
      saveHistory(old, "replace");
      saveEntry(next);
      contentChanged();
      const lines = [`Replaced [m:${old.id}] (rev ${next.rev}; level ${next.level} and uses ${next.uses} kept). It was:`, describe(old)];
      if (options.user && old.origin === "a") lines.push("(Origin stays agent: it is fixed when an entry is created.)");
      return [...lines, ...shadowNotes(evict(old.scope))].join("\n");
    }
    if (!options.new) {
      const similar = entries("scope = ? AND state = 'active'", options.scope)
        .filter(item => item.keys.some(key => fields.keys.includes(key)) && similarity(item.do, fields.do) >= LIMITS.similar);
      if (similar.length) {
        throw new Error([`Not saved: ${similar.length === 1 ? "this entry is" : "these entries are"} close to the new one.`, ...similar.map(describe),
          "Run again with --replace <id> to revise one of them, or --new if yours is a different rule."].join("\n"));
      }
    }
    const item = {
      id: newId(), scope: options.scope, ...fields, group: options.group, origin: options.user ? "u" : "a", pin: options.pin,
      state: "active", src: options.session, rev: 1, created_at: stamp, updated_at: stamp,
      level: options.user ? 2 : 1, uses: 0, losses: 0, shadow: false, flagged: 0, used_at: null, signal_at: stamp, revived: 0,
    };
    if (item.pin) checkPin(item, item.scope);
    saveEntry(item);
    contentChanged();
    return [`Saved [m:${item.id}] in ${item.scope} (L${item.level}${item.pin ? ", pinned" : ""}).`, ...shadowNotes(evict(item.scope))].join("\n");
  });
}

function update(id, change, message) {
  return tx(() => {
    const item = need(id);
    const result = change(item);
    if (typeof result === "string") return result;
    saveEntry(result.item);
    if (result.content) contentChanged();
    if (result.signals) signalsChanged();
    const scopes = [...new Set([item.scope, result.item.scope])];
    return [message(result.item), ...shadowNotes(scopes.flatMap(evict))].join("\n");
  });
}

export const del = id => update(id, item => item.state === "deleted" ? `[m:${id}] is already deleted.`
  : { item: { ...item, state: "deleted", updated_at: now() }, content: true },
item => `Deleted [m:${item.id}]. \`memo restore ${item.id}\` brings it back.`);

export const restore = id => update(id, item => item.state === "active" && !item.shadow ? `[m:${id}] is already active.`
  : { item: { ...item, state: "active", updated_at: now(), shadow: false, signal_at: now(), revived: item.revived + (item.shadow ? 1 : 0) }, content: true, signals: true },
item => `Restored [m:${item.id}].`);

export const pin = id => update(id, item => {
  if (item.pin) return `[m:${id}] is already pinned.`;
  if (item.state === "deleted") throw new Error(`[m:${id}] is deleted. \`memo restore ${id}\` first.`);
  checkPin(item, item.scope);
  return { item: { ...item, pin: true, shadow: false, updated_at: now() }, content: true };
}, item => `Pinned [m:${item.id}]: every session in ${item.scope === "context" ? "every project" : item.scope} starts with it.`);

export const unpin = id => update(id, item => !item.pin ? `[m:${id}] is not pinned.`
  : { item: { ...item, pin: false, updated_at: now() }, content: true },
item => `Unpinned [m:${item.id}].`);

// Level to 0; an entry already at 0 is deleted and listed by `memo review`.
export const wrong = id => update(id, item => {
  if (item.state === "deleted") return `[m:${id}] is already deleted.`;
  const stamp = now();
  if (item.level > 0) return { item: { ...item, level: 0, losses: 0, flagged: item.flagged + 1, signal_at: stamp }, signals: true };
  return { item: { ...item, state: "deleted", flagged: item.flagged + 1, updated_at: stamp, signal_at: stamp }, content: true, signals: true };
}, item => item.state === "deleted"
  ? `[m:${item.id}] was already at level 0 and is now deleted (\`memo restore ${item.id}\` undoes it).`
  : `[m:${item.id}] is now level 0. Save the corrected rule with \`memo put --replace ${item.id} ...\` if there is one.`);

export const mv = (id, scope) => update(id, item => {
  if (item.scope === scope) return `[m:${id}] is already in ${scope}.`;
  if (item.pin) checkPin(item, scope);
  return { item: { ...item, scope, updated_at: now() }, content: true };
}, item => `Moved [m:${item.id}] to ${item.scope}.`);

export function show(id) {
  const item = need(id);
  const rows = history(id);
  return [describe(item), `  rev ${item.rev}, created ${item.created_at}, updated ${item.updated_at}${item.src === null ? "" : `, session ${item.src}`}`,
    `  strength: level ${item.level}, uses ${item.uses}, losses ${item.losses}, wrong ${item.flagged}, last used ${item.used_at === null ? "never" : item.used_at}`,
    ...(rows.length ? ["History (oldest first):", ...rows.map(row => `  rev ${row.rev} ${row.updated_at} (${row.reason}) keys: ${JSON.parse(row.keys).join(", ")} | when: ${row.when_text} | do: ${row.do_text}`)] : [])].join("\n");
}

// One delivery batch: what was put in front of the agent, in rank order. A query that found
// nothing is kept too (entry_id NULL), for `memo review`.
export function deliver({ session, project, via, query, list }) {
  const batch = crypto.randomBytes(6).toString("hex");
  const stamp = now();
  const insert = (id, rank) => run("INSERT INTO deliveries (session_id, batch_id, project, entry_id, rank, via, query, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    session, batch, project, id, rank, via, query, stamp);
  if (!list.length) insert(null, null);
  list.forEach((item, index) => insert(item.id, index + 1));
}

// Losses needed to drop a level: 2 + floor(log2(uses + 1)). A single loss says little: in trials
// most losses fell on entries about another topic that merely ranked above the cited one.
export const threshold = uses => 2 + Math.floor(Math.log2(uses + 1));

// Citations [m:<id>] in a final message, for ids delivered earlier in the same session. A use
// raises level to 3 once per session per entry. Entries ranked above a cited one in the same
// find or first-prompt batch take one loss per session (never pinned, never session-start ones).
export function cite(session, message) {
  const ids = [...new Set([...message.matchAll(/\[m:([a-z0-9]{5})\]/gu)].map(match => match[1]))];
  if (!ids.length) return { used: [], lost: [] };
  return tx(() => {
    const stamp = now();
    const delivered = id => all("SELECT cited FROM deliveries WHERE session_id = ? AND entry_id = ?", session, id);
    const fresh = ids.filter(id => { const rows = delivered(id); return rows.length && !rows.some(row => row.cited); });
    for (const id of fresh) {
      const item = entry(id);
      saveEntry({ ...item, level: 3, uses: item.uses + 1, losses: 0, used_at: stamp, signal_at: stamp, shadow: false, revived: item.revived + (item.shadow ? 1 : 0) });
      run("UPDATE deliveries SET cited = 1 WHERE session_id = ? AND entry_id = ?", session, id);
    }
    const lost = [];
    const batches = fresh.length ? all(`SELECT batch_id, rank FROM deliveries WHERE session_id = ? AND via != 'start' AND entry_id IN (${fresh.map(() => "?").join(", ")})`, session, ...fresh) : [];
    for (const { batch_id: batch, rank } of batches) {
      for (const above of all("SELECT entry_id FROM deliveries WHERE batch_id = ? AND rank < ? ORDER BY rank", batch, rank)) {
        const id = above.entry_id;
        const rows = all("SELECT cited, lost FROM deliveries WHERE session_id = ? AND entry_id = ?", session, id);
        if (rows.some(row => row.cited || row.lost)) continue;
        const item = entry(id);
        if (item.pin || item.state === "deleted") continue;
        const losses = item.losses + 1;
        const drop = losses >= threshold(item.uses);
        saveEntry({ ...item, level: drop ? Math.max(0, item.level - 1) : item.level, losses: drop ? 0 : losses, signal_at: stamp });
        run("UPDATE deliveries SET lost = 1 WHERE batch_id = ? AND entry_id = ?", batch, id);
        lost.push(id);
      }
    }
    if (fresh.length || lost.length) signalsChanged();
    return { used: fresh, lost };
  });
}

// Entries created during this session without a session id (no CLAUDE_CODE_SESSION_ID, as under Codex).
export function stampSources(session) {
  const started = get("SELECT started_at FROM sessions WHERE session_id = ?", session);
  if (!started) return 0;
  return Number(run("UPDATE entries SET src = ? WHERE src IS NULL AND created_at >= ?", session, started.started_at).changes);
}

// `memo review`: what a person should look at, at most 10 lines per list.
export function review(project) {
  const scopes = scopesOf(project);
  const list = (title, items, line = item => `  [m:${item.id}] L${item.level} ${item.keys.join(", ")}: ${item.do.slice(0, 90)}`) =>
    items.length ? [`${title} (${items.length}${items.length > 10 ? ", first 10" : ""}):`, ...items.slice(0, 10).map(line)] : [];
  const live = visible(scopes);
  const byAge = (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
  const duplicates = [];
  for (const [index, a] of live.entries()) {
    for (const b of live.slice(index + 1)) {
      if (a.scope === b.scope && a.keys.some(key => b.keys.includes(key)) && similarity(a.do, b.do) >= LIMITS.similar) duplicates.push([a, b]);
    }
  }
  const misses = all(`SELECT query, COUNT(*) AS n FROM deliveries WHERE entry_id IS NULL AND via = 'find' AND project = ?
    GROUP BY query HAVING n >= 2 ORDER BY n DESC, query`, projectScope(project));
  const capped = scopes.flatMap(scope => {
    const count = get("SELECT COUNT(*) AS n FROM entries WHERE scope = ? AND state = 'active' AND shadow = 0 AND pin = 0", scope).n;
    return count > LIMITS.cap ? live.filter(item => item.scope === scope && item.origin === "u" && !item.pin).sort(strength).reverse() : [];
  });
  const out = [
    ...list("Never used", live.filter(item => item.uses === 0).sort(byAge)),
    ...list("Level 0", live.filter(item => item.level === 0).sort(byAge)),
    ...list("Deleted after `memo wrong`", entries(`${inScopes(scopes)} AND state = 'deleted' AND flagged > 0`, ...scopes)),
    ...list("Pinned or said by the user, never used", live.filter(item => (item.pin || item.origin === "u") && item.uses === 0).sort(byAge)),
    ...list("Possible duplicates", duplicates, ([a, b]) => `  [m:${a.id}] and [m:${b.id}] (${a.keys.filter(key => b.keys.includes(key)).join(", ")}): ${a.do.slice(0, 50)} | ${b.do.slice(0, 50)}`),
    ...list("Brought back from shadow", live.filter(item => item.revived > 0).sort((a, b) => b.revived - a.revived)),
    ...list(`User entries over the ${LIMITS.cap}-entry cap (never shadowed automatically)`, capped),
    ...list("Searches that found nothing more than once", misses, row => `  "${row.query}" x${row.n}`),
  ];
  return out.length ? out.join("\n") : "Nothing to review.";
}

// `memo log`: one session's deliveries and citations, in order.
export function log(session) {
  const target = session === null ? get("SELECT session_id FROM deliveries WHERE session_id IS NOT NULL ORDER BY at DESC LIMIT 1")?.session_id : session;
  if (!target) return "No deliveries recorded yet.";
  const rows = all("SELECT * FROM deliveries WHERE session_id = ? ORDER BY at, batch_id, rank", target);
  if (!rows.length) return `No deliveries recorded for session ${target}.`;
  const batches = new Map();
  for (const row of rows) batches.set(row.batch_id, [...(batches.get(row.batch_id) || []), row]);
  const out = [`Session ${target} (* cited, - lost):`];
  for (const list of batches.values()) {
    const [first] = list;
    const items = list.filter(row => row.entry_id !== null).map(row => `[m:${row.entry_id}]${row.cited ? "*" : ""}${row.lost ? "-" : ""}`);
    out.push(`  ${first.at.slice(0, 19)} ${first.via}${first.query === null ? "" : ` "${first.query}"`}: ${items.join(" ") || "nothing found"}`);
  }
  return out.join("\n");
}
