// What reaches the agent: SessionStart's few lines of basic use (no entries in them), and the
// text of `brief`, `find` and `keys`. Reading records nothing; `record` notes what a session was shown,
// taken from the very text it was shown.
import { deliver, projectScope, scopesOf, visible } from "./memo.mjs";
import { matcher, rankQuery, reason, strength, topKeys } from "./rank.mjs";

export const BUDGET = { chars: 3500, lookup: 12, keys: 30, find: 3 };

const entriesText = n => `${n} entr${n === 1 ? "y" : "ies"}`;

// SessionStart's notes: what memory is and the two rules no tool description can carry. How to
// look up, save and correct is in the tools' descriptions.
export function usage(project) {
  const count = visible(scopesOf(project)).length;
  return `# Gei memo · ${project.projectId} · ${entriesText(count)}
Memory of what the user corrected, prefers or warned about, and pitfalls that recur, kept outside the repository. It reaches you only through the memo tools: call \`brief\` before your first task and \`find\` before each task. Never read or edit the memory store's files (~/.agents/geispec) directly.`;
}

const keyLine = (keys, total) => `## Keys (${keys.length} of ${total})\n${keys.map(item => `${item.key} (${item.count})`).join(", ")}`;

// `brief`: pinned entries, "look up when" lines and the common keys, within BUDGET.chars.
export function brief(project) {
  const items = visible(scopesOf(project));
  if (!items.length) return `No entries yet for ${project.projectId} or the shared scope.`;
  const live = items.filter(item => !item.shadow);
  const pinned = live.filter(item => item.pin).sort((a, b) => (a.scope === "context") - (b.scope === "context") || strength(a, b));
  // Only entries that earned the place: used at least once, or said by the user. Unproven agent
  // entries would fill the list in id order and are reached through the keys instead.
  const lookup = live.filter(item => !item.pin && (item.uses > 0 || item.origin === "u")).sort(strength).slice(0, BUDGET.lookup);
  const { keys, total } = topKeys(items, BUDGET.keys);
  const shownPins = [...pinned];
  const hiddenPins = [];
  const build = () => [`# ${project.projectId} · ${entriesText(items.length)}`,
    ...(shownPins.length ? [`## Always apply\n${shownPins.map(item => `[m:${item.id}] ${item.do}`).join("\n")}${hiddenPins.length ? `\nAlso pinned, not shown for space: ${hiddenPins.map(item => `[m:${item.id}]`).join(" ")}` : ""}`] : []),
    ...(lookup.length ? [`## Look up when\n${lookup.map(item => `[m:${item.id}] ${item.when}`).join("\n")}`] : []),
    ...(keys.length ? [keyLine(keys, total)] : []),
  ].join("\n\n");
  // Over budget: drop "Look up when" lines first, then keys, and only then the last pinned lines.
  while (build().length > BUDGET.chars && lookup.length) lookup.pop();
  while (build().length > BUDGET.chars && keys.length) keys.pop();
  while (build().length > BUDGET.chars && shownPins.length) hiddenPins.unshift(shownPins.pop());
  const text = build();
  if (text.length > BUDGET.chars) throw new Error(`The brief is ${text.length} characters even without entries; the budget is ${BUDGET.chars}.`);
  return text;
}

// `find`: the top three, each with why it ranked there, and how many others matched.
export function find(project, words) {
  if (!words.length) throw new Error("find needs at least one word.");
  const matches = rankQuery(visible(scopesOf(project)), words);
  const top = matches.slice(0, BUDGET.find);
  if (!top.length) return `No entry matches ${words.join(", ")}. Try other words (a tool, service, file or action), or \`keys\` for the keys in use.`;
  const rest = matches.length - top.length;
  return [...top.map(match => `[m:${match.entry.id}] ${match.entry.do} (${reason(match)})`),
    ...(rest ? [`+${rest} more match${rest === 1 ? "" : "es"}; add a word to narrow.`] : [])].join("\n");
}

// `keys [word]`: the common keys, or the keys matching a word, with entry counts.
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
  if (!counts.size) return `No key matches ${word}. \`keys\` without a word lists the common ones; \`find ${word}\` also searches when and do.`;
  const list = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return [...list.slice(0, BUDGET.keys).map(([key, count]) => `${key} (${count})`), ...(list.length > BUDGET.keys ? [`+${list.length - BUDGET.keys} more`] : [])].join(", ");
}

// The entries a `brief` or `find` text put in front of the agent: lines that start with an id,
// in order. "Also pinned, not shown for space" names ids it did not show, so it does not count.
export const shownIds = text => [...text.matchAll(/^\[m:([a-z0-9]{5})\]/gmu)].map(match => match[1]);

// Records one `brief` or `find` result for a session, so its citations count at the end of the
// turn. A find that showed nothing is recorded too (for `memo review`); an empty brief is not.
export function record({ session, project, via, query, text }) {
  const ids = shownIds(text);
  if (via === "start" && !ids.length) return;
  deliver({ session, project: projectScope(project), via, query, ids });
}
