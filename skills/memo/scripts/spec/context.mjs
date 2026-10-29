// What SessionStart injects for one scope: rendered MEMORY.md entries plus the generated INDEX of docs and tasks.
// Write-time budgets keep this below the hosts' hook limits (Claude Code 10,000 characters, Codex about 10 KB),
// so it is never clipped here. A hand-edited store that breaks those budgets is reported at the top instead.
import { Memory } from "./memory.mjs";
import { ProjectIndex } from "./index.mjs";

export const HOOK_BYTES = 9000;

export function scopeContext(header, scope, result) {
  const state = result.stale ? "offline cache" : result.source;
  const lines = [header, `Spec: ${result.mode}; ${state}${result.checkedAt ? `; checked ${result.checkedAt}` : ""}`];
  const { entries, errors } = Memory.parse(result.memory);
  const memory = Memory.render(entries);
  const index = ProjectIndex.body(result.index);
  if (errors.length) lines.push(`⚠️ ${scope}MEMORY.md has invalid lines (${errors.slice(0, 3).map(item => `line ${item.line}: ${item.message}`).join("; ")}). Fix them with spec_edit before adding entries.`);
  if (memory) lines.push("", `## Memory (${scope}MEMORY.md)`, memory);
  if (index) lines.push("", `## Index (${scope}INDEX.md; read with spec_read)`, index.replace(/^## /gmu, "### "));
  const text = lines.join("\n");
  const size = Buffer.byteLength(text, "utf8");
  return size <= HOOK_BYTES ? text
    : `⚠️ Gei memory for ${scope} is ${size} bytes, over the ${HOOK_BYTES}-byte hook budget; the host may cut it. Remove entries from ${scope}MEMORY.md now.\n${text}`;
}
