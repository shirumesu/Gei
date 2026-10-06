import { hash } from "./io.mjs";

const intervals = { knowledge: 90, handoff: 14, transient: 30 };
const own = (value, key) => Object.hasOwn(value, key);

export function parts(content) {
  const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)(?<=\n)---(?:\r?\n|$)/u.exec(content);
  if (!match) return { header: "", body: content, fields: [] };
  const opening = /^(?:\uFEFF)?---\r?\n/u.exec(match[0])[0];
  const block = match[1];
  const fields = [...block.matchAll(/^gei:[^\n]*(?:\n[ \t]+[^\n]*)*(?:\n|$)/gmu)].map(field => ({
    text: field[0], start: opening.length + field.index, end: opening.length + field.index + field[0].length,
  }));
  return { header: match[0], body: content.slice(match[0].length), opening, block, fields };
}
export function parseDocument(content) {
  const parsed = parts(content);
  if (!parsed.fields.length) return { ...parsed, metadata: null };
  let raw;
  try {
    if (parsed.fields.length !== 1) throw new Error("Duplicate gei field");
    raw = JSON.parse(parsed.fields[0].text.slice(4).trim());
    validateMetadata(raw);
    return { ...parsed, metadata: raw };
  } catch (error) {
    return { ...parsed, metadata: null, error: error.message, ...([1, 2, 3, 4].includes(raw?.version) ? { legacy: raw } : {}) };
  }
}
function date(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) && Number.isFinite(Date.parse(value)); }
const digest = value => typeof value === "string" && /^[a-f0-9]{16}$/u.test(value);
export function validateMetadata(value) {
  if (!value || value.version !== 5 || !own(intervals, value.kind)) throw new Error("Invalid lifecycle metadata");
  for (const key of ["verified_at", "retry_after", "delete_after", "attempted_at"]) if (value[key] !== undefined && !date(value[key])) throw new Error(`Invalid ${key}`);
  for (const key of ["verified_hash", "deletion_hash", "deferred_fingerprint"]) if (value[key] !== undefined && !digest(value[key])) throw new Error(`Invalid ${key}`);
  if (!Number.isInteger(value.review_days) || value.review_days < 1 || value.review_days > 365) throw new Error("Invalid review_days");
  if (value.delete_after && (value.kind !== "transient" || !value.deletion_reason?.trim() || !value.deletion_hash)) throw new Error("Destruction requires a transient record, reason, and content version");
  if (value.sources !== undefined && (!value.sources || typeof value.sources !== "object" || Array.isArray(value.sources) || !Object.values(value.sources).every(digest))) throw new Error("Invalid sources");
  if (value.scope !== undefined && (!value.scope || typeof value.scope !== "object" || Array.isArray(value.scope)
    || !["environment", "platform"].some(key => own(value.scope, key))
    || ["environment", "platform"].some(key => own(value.scope, key) && typeof value.scope[key] !== "string"))) throw new Error("Invalid scope");
}

export function withoutMetadata(content) {
  const parsed = parts(content);
  if (!parsed.header) return content;
  let header = parsed.header;
  for (const field of parsed.fields.toReversed()) header = header.slice(0, field.start) + header.slice(field.end);
  const remaining = parts(header);
  return remaining.block?.trim() ? header + parsed.body : (content.startsWith("\uFEFF") ? "\uFEFF" : "") + parsed.body;
}
function withField(content, field) {
  const parsed = parts(content);
  if (parsed.fields.length) {
    let result = content;
    for (const [index, existing] of [...parsed.fields.entries()].toReversed()) {
      result = result.slice(0, existing.start) + (index === 0 ? field : "") + result.slice(existing.end);
    }
    return result;
  }
  if (parsed.header) {
    const at = parsed.opening.length + parsed.block.length;
    return content.slice(0, at) + field + content.slice(at);
  }
  const newline = content.match(/\r?\n/u)?.[0] || "\n";
  const bom = content.startsWith("\uFEFF") ? "\uFEFF" : "";
  return `${bom}---${newline}${field}---${newline}${content.slice(bom.length)}`;
}
export function withMetadata(content, metadata) {
  const newline = content.match(/\r?\n/u)?.[0] || "\n";
  // One-line JSON is a YAML flow mapping; reads skip it, so it costs one line.
  return withField(content, `gei: ${JSON.stringify(metadata)}${newline}`);
}
export const digest16 = value => hash(value).slice(0, 16);
export const contentHash = content => digest16(withoutMetadata(content).replaceAll("\r\n", "\n"));
export function reviewAfter(metadata) {
  return metadata?.verified_at ? new Date(Date.parse(metadata.verified_at) + metadata.review_days * 86400000).toISOString() : undefined;
}

// Physical lines that only Gei maintains: the gei field and, when it is the whole header, its delimiters.
export function managedLines(content) {
  const parsed = parts(content);
  if (!parsed.fields.length) return { lines: new Set(), hidden: 0 };
  const lineOf = offset => content.slice(0, offset).split("\n").length;
  const lines = new Set([1, lineOf(parsed.header.length - 1)]);
  for (const field of parsed.fields) {
    const count = field.text.split("\n").length - (field.text.endsWith("\n") ? 1 : 0);
    for (let line = lineOf(field.start); line < lineOf(field.start) + count; line++) lines.add(line);
  }
  const hidden = parts(withoutMetadata(content)).header ? 0 : lineOf(parsed.header.length - 1);
  return { lines, hidden };
}
// Character spans an exact replace must not match.
export function managedSpans(content) {
  const parsed = parts(content);
  if (!parsed.fields.length) return [];
  const close = parsed.opening.length + parsed.block.length;
  return [[0, parsed.opening.length], [close, parsed.header.length], ...parsed.fields.map(field => [field.start, field.end])];
}
export const fieldText = content => parts(content).fields.map(field => field.text).join("");

// Reference scanning ignores historical maintenance evidence without changing physical line numbers.
export function referenceContent(content) {
  let result = content;
  for (const field of parts(content).fields.toReversed()) result = result.slice(0, field.start) + field.text.replace(/[^\r\n]/gu, " ") + result.slice(field.end);
  return result;
}
