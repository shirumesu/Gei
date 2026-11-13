// Matching and ranking. ASCII words match on word boundaries, CJK (any non-ASCII word) by
// containment, both case-insensitively. Ranking is a fixed lexicographic order, not a score.
const ASCII = /^[\x00-\x7f]+$/u;
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
export const POSITION = { 3: "key", 2: "when", 1: "do" };

// Query words: split on whitespace and commas, lowercased, deduplicated.
export const queryWords = text => [...new Set(text.split(/[\s,，、]+/u).map(word => word.trim().toLowerCase()).filter(Boolean))];

export function matcher(word) {
  if (!ASCII.test(word)) return text => text.toLowerCase().includes(word);
  const pattern = new RegExp(`(?<![A-Za-z0-9_])${escape(word)}(?![A-Za-z0-9_])`, "iu");
  return text => pattern.test(text);
}

// Best place a word hits an entry: 3 key, 2 when, 1 do (only when `withDo`), 0 none.
function position(test, item, withDo) {
  if (item.keys.some(test)) return 3;
  if (test(item.when)) return 2;
  return withDo && test(item.do) ? 1 : 0;
}

// A word that hits more than max(8, 10% of the searched entries) is not counted, unless every
// word that hits anything is like that.
export const broadLimit = total => Math.max(8, Math.floor(total * 0.1));

// hits: Map word -> Map entry id -> position. Returns the ranked matches with what decided them.
function rankHits(items, hits) {
  const limit = broadLimit(items.length);
  const hitting = [...hits.keys()].filter(word => hits.get(word).size > 0);
  const narrow = hitting.filter(word => hits.get(word).size <= limit);
  const counted = narrow.length ? narrow : hitting;
  const matches = [];
  for (const item of items) {
    const words = hitting.filter(word => hits.get(word).has(item.id));
    if (!words.length) continue;
    const countedWords = words.filter(word => counted.includes(word));
    const pos = Math.max(0, ...countedWords.map(word => hits.get(word).get(item.id)));
    matches.push({ entry: item, words, counted: countedWords.length, broad: words.length - countedWords.length, pos });
  }
  return matches.sort(compare);
}

// The order of the plan, rule by rule: active before shadow; more counted words; key > when > do;
// then more of the uncounted broad words (so "ledger" still separates two entries that both
// match "deploy" in the same place); higher level; more uses; more recently used; id.
export function compare(a, b) {
  const x = a.entry, y = b.entry;
  return (x.shadow - y.shadow) || (b.counted - a.counted) || (b.pos - a.pos) || (b.broad - a.broad) || strength(x, y);
}

// Rules 4 to 7 alone: the order without a query (session start, eviction display).
export function strength(x, y) {
  return (y.level - x.level) || (y.uses - x.uses)
    || (x.used_at === y.used_at ? 0 : x.used_at === null ? 1 : y.used_at === null ? -1 : y.used_at.localeCompare(x.used_at))
    || x.id.localeCompare(y.id);
}

// `memo find`: words against keys, when and do of every non-deleted entry given.
export function rankQuery(items, words) {
  const hits = new Map(words.map(word => {
    const test = matcher(word);
    return [word, new Map(items.map(item => [item.id, position(test, item, true)]).filter(([, pos]) => pos > 0))];
  }));
  return rankHits(items, hits);
}

const STOPWORDS = new Set(`a an the and or but if then else when while to of in on at by for with from into onto as is are was
were be been being it its this that these those i you he she we they me my your our their do does did done not no yes can could
should would will shall may might must have has had so too very just also there here what which who how why where all any some
each about after before up down out over under again please use using need make get let want like one two new now how's it's
i'm don't can't won't`.split(/\s+/u));

const asciiTokens = text => text.toLowerCase().split(/[^a-z0-9_.\-/]+/u).map(token => token.replace(/^[.\-/]+|[.\-/]+$/gu, ""))
  .filter(token => token.length > 1 && !STOPWORDS.has(token));
const cjkRuns = text => (text.match(/[^\x00-\x7f]+/gu) || []).flatMap(run => run.split(/[\s\p{P}]+/u)).filter(run => run.length > 1);

// The first prompt of a session: which of an entry's terms (its keys, the words of its `when`)
// occur in the prompt. A term is one "word" for the ranking rules; the position is key or when.
export function rankPrompt(items, prompt) {
  const promptTokens = new Set(asciiTokens(prompt));
  const lower = prompt.toLowerCase();
  const present = term => ASCII.test(term)
    ? asciiTokens(term).length > 0 && asciiTokens(term).every(token => promptTokens.has(token))
    : lower.includes(term);
  const hits = new Map();
  const hit = (term, id, pos) => {
    if (!hits.has(term)) hits.set(term, new Map());
    const map = hits.get(term);
    if ((map.get(id) || 0) < pos) map.set(id, pos);
  };
  for (const item of items) {
    for (const key of item.keys) if (present(key)) hit(key, item.id, 3);
    for (const term of [...asciiTokens(item.when), ...cjkRuns(item.when)]) if (present(term)) hit(term, item.id, 2);
  }
  return rankHits(items, hits);
}

// Up to `limit` keys chosen greedily to cover the most entries; once nothing new is covered,
// the most common remaining keys. Returns [{ key, count }] and the number of distinct keys.
export function topKeys(items, limit) {
  const byKey = new Map();
  for (const item of items) for (const key of item.keys) byKey.set(key, [...(byKey.get(key) || []), item.id]);
  const covered = new Set();
  const chosen = [];
  const remaining = new Map(byKey);
  while (chosen.length < limit && remaining.size) {
    let best = null;
    for (const [key, ids] of remaining) {
      const gain = ids.filter(id => !covered.has(id)).length;
      if (!best || gain > best.gain || (gain === best.gain && (ids.length > best.ids.length || (ids.length === best.ids.length && key < best.key)))) best = { key, ids, gain };
    }
    remaining.delete(best.key);
    for (const id of best.ids) covered.add(id);
    chosen.push({ key: best.key, count: best.ids.length });
  }
  return { keys: chosen, total: byKey.size };
}

export const reason = match => [
  match.counted ? `${match.counted} word${match.counted === 1 ? "" : "s"}, ${POSITION[match.pos]}` : "only common words",
  `L${match.entry.level}`, ...(match.entry.shadow ? ["shadow"] : []),
].join(", ");
