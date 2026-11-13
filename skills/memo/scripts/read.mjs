// What reaches the agent: the session-start context, the first-prompt match, `find` and `keys`.
import { deliver, projectScope, scopesOf, visible } from "./memo.mjs";
import { matcher, rankPrompt, rankQuery, reason, strength, topKeys } from "./rank.mjs";

export const BUDGET = { chars: 3500, lookup: 12, keys: 30, find: 3 };

const EXPLAIN = `Memory is a table of short entries: what the user corrected, prefers or warned about, and pitfalls that will recur. None of it is in the repository or its docs.
- When an entry conflicts with the current code or with what the user says now, follow the code and the user. Then run \`memo wrong <id>\`, or \`memo put --replace <id> ...\` with the corrected rule.
- Before you start a task, look up what applies: \`memo find <word> [word...]\`. Try two or three different words (tool, service, file, action). \`memo keys [word]\` lists the keys. Two or three lookups per task are enough.
- When you act on an entry, cite it in your reply as [m:<id>]. Cited entries stay near the top; uncited ones sink. Write an id in that form only for an entry you acted on, not for one you looked at and set aside.
- Save when the user corrects you, states a preference or warns you, or when a pitfall will recur: \`memo put --keys k1,k2 --when "<situation>" --do "<what to do>" --why "<source and reason>"\` (add \`--user\` when the user said it). Not worth saving: progress, finished work, one-off problems, rejected proposals, general knowledge, anything the code or git already answers, secrets.
- Never read or edit the memory store's files directly; \`memo\` is the only way in.`;

const keyLine = (keys, total) => `## Keys (${keys.length} of ${total})\n${keys.map(item => `${item.key} (${item.count})`).join(", ")}`;

// The context injected at session start (and into subagents). `command` is how the agent runs
// memo: "memo" where the plugin's bin/ is on PATH, the full node invocation elsewhere.
export function startContext(project, { session, command }) {
  const items = visible(scopesOf(project));
  const live = items.filter(item => !item.shadow);
  const pinned = live.filter(item => item.pin).sort((a, b) => (a.scope === "context") - (b.scope === "context") || strength(a, b));
  // Only entries that earned the place: used at least once, or said by the user. Unproven agent
  // entries would fill the list in id order and are reached through the keys instead.
  const lookup = live.filter(item => !item.pin && (item.uses > 0 || item.origin === "u")).sort(strength).slice(0, BUDGET.lookup);
  const { keys, total } = topKeys(items, BUDGET.keys);
  const head = [`# Gei memo · ${project.projectId} · ${items.length} entries`, command === "memo" ? EXPLAIN : EXPLAIN.replace(/`memo(?=[ `])/gu, `\`${command}`)].join("\n");
  const shownPins = [...pinned];
  const hiddenPins = [];
  const build = () => [head,
    ...(shownPins.length ? [`## Always apply\n${shownPins.map(item => `[m:${item.id}] ${item.do}`).join("\n")}${hiddenPins.length ? `\nAlso pinned, not shown for space: ${hiddenPins.map(item => `[m:${item.id}]`).join(" ")}` : ""}`] : []),
    ...(lookup.length ? [`## Look up when\n${lookup.map(item => `[m:${item.id}] ${item.when}`).join("\n")}`] : []),
    ...(keys.length ? [keyLine(keys, total)] : []),
  ].join("\n\n");
  // Over budget: drop "Look up when" lines first, then keys, and only then the last pinned lines.
  while (build().length > BUDGET.chars && lookup.length) lookup.pop();
  while (build().length > BUDGET.chars && keys.length) keys.pop();
  while (build().length > BUDGET.chars && shownPins.length) hiddenPins.unshift(shownPins.pop());
  const context = build();
  if (context.length > BUDGET.chars) throw new Error(`The session-start memory is ${context.length} characters even without entries; the budget is ${BUDGET.chars}.`);
  if (session !== null && (shownPins.length || lookup.length)) deliver({ session, project: projectScope(project), via: "start", query: null, list: [...shownPins, ...lookup] });
  return context;
}

// The first prompt of a session (and the first after compaction): rules whose keys or `when`
// share two or more words with it. Anything weaker injects nothing.
export function primeContext(project, prompt, { session }) {
  const matches = rankPrompt(visible(scopesOf(project)).filter(item => !item.shadow), prompt);
  // One word in common is not evidence: in trials it pointed at unrelated entries more often than
  // at the right one, so nothing is injected for it and the agent's own lookups cover the case.
  const strong = matches.filter(match => match.counted >= 2).slice(0, BUDGET.find);
  if (!strong.length) return null;
  deliver({ session, project: projectScope(project), via: "prime", query: prompt.slice(0, 200), list: strong.map(match => match.entry) });
  return [`# Gei memo · entries that match this request (cite [m:<id>] when you act on one)`, ...strong.map(match => `[m:${match.entry.id}] ${match.entry.do}`)].join("\n");
}

// `memo find`: the top three, each with why it ranked there, and how many others matched.
export function find(project, words, { session }) {
  if (!words.length) throw new Error("Usage: memo find <word> [word...]");
  const matches = rankQuery(visible(scopesOf(project)), words);
  const top = matches.slice(0, BUDGET.find);
  deliver({ session, project: projectScope(project), via: "find", query: words.join(" "), list: top.map(match => match.entry) });
  if (!top.length) return `No entry matches ${words.join(", ")}. Try other words (a tool, service, file or action), or \`memo keys\` for the keys in use.`;
  const rest = matches.length - top.length;
  return [...top.map(match => `[m:${match.entry.id}] ${match.entry.do} (${reason(match)})`),
    ...(rest ? [`+${rest} more match${rest === 1 ? "" : "es"}; add a word to narrow.`] : [])].join("\n");
}

// `memo keys [word]`: the common keys, or the keys matching a word, with entry counts.
export function keys(project, word) {
  const items = visible(scopesOf(project));
  if (word === null) {
    const { keys: list, total } = topKeys(items, BUDGET.keys);
    return list.length ? keyLine(list, total).replace(/^## /u, "") : "No entries yet.";
  }
  // The keys that match the word and the keys used beside them, so a broad key (a service) opens
  // into the specific ones of its entries.
  const test = matcher(word.toLowerCase());
  const counts = new Map();
  for (const item of items) {
    if (!item.keys.some(test)) continue;
    for (const key of item.keys) counts.set(key, (counts.get(key) || 0) + 1);
  }
  if (!counts.size) return `No key matches ${word}. \`memo keys\` lists the common ones; \`memo find ${word}\` also searches when and do.`;
  const list = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return [...list.slice(0, BUDGET.keys).map(([key, count]) => `${key} (${count})`), ...(list.length > BUDGET.keys ? [`+${list.length - BUDGET.keys} more`] : [])].join(", ");
}
