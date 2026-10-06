import { parseDocument, managedLines, reviewAfter } from "./metadata.mjs";

export function overview(content) {
  const parsed = parseDocument(content);
  const body_start_line = (parsed.header.match(/\n/gu) || []).length + 1;
  const lines = parsed.body.split("\n");
  let title = null, title_line = null, paragraph = [], excerpt_line = null, fence = null;
  let paragraphComplete = false, comment = false;
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(raw);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      continue;
    }
    if (comment) { comment = !raw.includes("-->"); continue; }
    const commentStart = raw.indexOf("<!--");
    if (commentStart >= 0) {
      if (paragraph.length) paragraphComplete = true;
      comment = raw.indexOf("-->", commentStart + 4) < 0;
      continue;
    }
    if (marker) { if (paragraph.length) paragraphComplete = true; fence = marker[1]; continue; }
    const heading = /^#\s+(.+?)(?:\s+#+)?$/u.exec(line);
    if (!title && heading) { title = heading[1]; title_line = body_start_line + index; }
    const prose = line && !/^(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||<|\[[^\]]+\]:|[-=_*]{3,}$)/u.test(line) && !/^\s{4}|^\t/u.test(raw);
    if (!prose) { if (paragraph.length) paragraphComplete = true; continue; }
    if (paragraphComplete) continue;
    if (!paragraph.length) excerpt_line = body_start_line + index;
    paragraph.push(line);
  }
  const excerpt = paragraph.length ? paragraph.join(" ") : null;
  const shorten = (text, limit) => text === null ? null : Array.from(text).slice(0, limit).join("");
  return { overview: { extraction: "document", title: shorten(title, 160), title_line,
    title_truncated: title !== null && Array.from(title).length > 160,
    excerpt: shorten(excerpt, 280), excerpt_line,
    excerpt_truncated: excerpt !== null && Array.from(excerpt).length > 280, description_missing: excerpt === null }, body_start_line };
}

export function documentOrder(name) {
  if (name.endsWith("/INDEX.md")) return 0;
  if (/\/topics\/[^/]+\/README\.md$/u.test(name)) return 1;
  return name.includes("/notes/") ? 3 : 2;
}

// Zero-based physical lines managed by Gei, for searches that skip lifecycle state.
export function lifecycleLines(content) {
  return new Set([...managedLines(content).lines].map(line => line - 1));
}

// A one-line view of lifecycle state, so readers need not see the raw field.
export function lifecycleSummary(content) {
  const parsed = parseDocument(content);
  if (!parsed.fields.length) return undefined;
  const hidden_lines = managedLines(content).hidden;
  if (!parsed.metadata) return { hidden_lines, state: parsed.legacy ? "legacy: run migrate-metadata" : `invalid: ${parsed.error}` };
  const meta = parsed.metadata;
  return { hidden_lines, kind: meta.kind, verified_at: meta.verified_at || null, review_after: reviewAfter(meta) || null,
    sources: Object.keys(meta.sources || {}).length, ...(meta.scope ? { scope: meta.scope } : {}), ...(meta.delete_after ? { delete_after: meta.delete_after } : {}) };
}

export function windowBytes(text, start_line, start_column, max_lines, line_numbers) {
  return Buffer.byteLength(text.split("\n").slice(start_line - 1, start_line - 1 + max_lines).map((line, index) => {
    const segment = index === 0 ? Array.from(line).slice(start_column - 1).join("") : line;
    return line_numbers ? `${start_line + index}: ${segment}` : segment;
  }).join("\n"));
}

export function sharedBudgets(needs, total = 48000) {
  const budgets = needs.map(() => 0);
  const pending = needs.map((bytes, index) => ({ bytes, index })).sort((a, b) => a.bytes - b.bytes || a.index - b.index);
  for (const [position, item] of pending.entries()) {
    const budget = Math.min(item.bytes, Math.floor(total / (pending.length - position)));
    budgets[item.index] = budget;
    total -= budget;
  }
  return budgets;
}

export function readWindow(text, { start_line, start_column, max_lines, line_numbers }, budget) {
  const lines = text.split("\n"), selected = [];
  let nextLine = start_line, nextColumn = start_column, remaining = budget;
  for (let index = start_line - 1; index < Math.min(lines.length, start_line - 1 + max_lines); index++) {
    const chars = Array.from(lines[index]);
    const offset = index === start_line - 1 ? start_column - 1 : 0;
    const label = line_numbers ? `${index + 1}: ` : "";
    let available = remaining - (selected.length ? 1 : 0) - Buffer.byteLength(label);
    if (available < 0) break;
    let end = offset;
    while (end < chars.length && Buffer.byteLength(chars[end]) <= available) { available -= Buffer.byteLength(chars[end]); end++; }
    if (end === offset && chars.length > offset) break;
    const segment = chars.slice(offset, end).join("");
    selected.push(label + (line_numbers ? segment.replace(/\r$/u, "") : segment)); remaining = available;
    nextLine = end < chars.length ? index + 1 : index + 2;
    nextColumn = end < chars.length ? end + 1 : 1;
    if (end < chars.length) break;
  }
  const truncated = nextLine <= lines.length;
  return { content: selected.join("\n"), start_line, total_lines: lines.length,
    ...(line_numbers ? { line_numbers: true } : {}), start_column, truncated,
    next_line: truncated ? nextLine : undefined, next_column: truncated ? nextColumn : undefined };
}
