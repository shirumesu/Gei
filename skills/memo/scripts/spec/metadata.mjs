import { fail, hash, metadataPath } from "./io.mjs";

const intervals = { knowledge: 90, handoff: 14, transient: 30 };
const own = (value, key) => Object.hasOwn(value, key);
export const bodyHash = body => hash(body.replaceAll("\r\n", "\n"));

function parts(content) {
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
  try {
    if (parsed.fields.length !== 1) throw new Error("Duplicate gei field");
    const metadata = JSON.parse(parsed.fields[0].text.slice(4).trim());
    validateMetadata(metadata);
    return { ...parsed, metadata };
  } catch (error) { return { ...parsed, metadata: null, error: error.message }; }
}
function date(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) && Number.isFinite(Date.parse(value)); }
export function validateMetadata(value) {
  if (!value || ![1, 2, 3, 4].includes(value.version) || !own(intervals, value.kind) || (value.version < 4 && !date(value.created_at))) throw new Error("Invalid lifecycle metadata");
  if (value.migrated_hash !== undefined && (!/^[a-f0-9]{64}$/u.test(value.migrated_hash?.markdown || "") || !/^[a-f0-9]{64}$/u.test(value.migrated_hash?.legacy || ""))) throw new Error("Invalid migrated_hash");
  for (const key of ["verified_at", "review_after", "retry_after", "delete_after"]) if (value[key] !== undefined && !date(value[key])) throw new Error(`Invalid ${key}`);
  if (!Number.isInteger(value.review_days) || value.review_days < 1 || value.review_days > 365) throw new Error("Invalid review_days");
  if (value.delete_after && (value.kind !== "transient" || !value.deletion_reason?.trim() || !/^[a-f0-9]{64}$/u.test(value.deletion_hash || ""))) throw new Error("Destruction requires a transient record, reason, and content version");
  if (value.evidence !== undefined && (!Array.isArray(value.evidence) || value.evidence.some(item => typeof item !== "string"))) throw new Error("Invalid evidence");
  if (value.sources !== undefined && (!Array.isArray(value.sources) || value.sources.some(item => !item || typeof item.path !== "string" || !/^[a-f0-9]{64}$/u.test(item.hash || "")))) throw new Error("Invalid sources");
  if (value.scope !== undefined && (!value.scope || typeof value.scope.environment !== "string")) throw new Error("Invalid scope");
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
  // JSON is a YAML flow mapping. Multiline output keeps diffs local without a YAML dependency.
  const field = `gei: ${JSON.stringify(metadata, null, 2).replaceAll("\n", newline + "  ")}${newline}`;
  return withField(content, field);
}
export function preserveMetadata(content, original) {
  const fields = parts(original).fields;
  if (!fields.length) return content;
  const existing = parts(content).fields;
  if (JSON.stringify(existing.map(field => field.text)) === JSON.stringify(fields.map(field => field.text))) return content;
  return withField(content, fields.map(field => field.text).join(""));
}

export function metadataFor(files, name) {
  const raw = files[metadataPath(name)];
  const embedded = parseDocument(files[name] || "");
  if (raw === undefined) return embedded;
  try {
    const metadata = JSON.parse(raw);
    validateMetadata(metadata);
    if (embedded.fields.length) return { metadata: null, error: "Both embedded and separate lifecycle metadata exist" };
    return { metadata };
  } catch (error) { return { metadata: null, error: error.message }; }
}
export function writeMetadata(files, name, metadata) {
  files[name] = withMetadata(files[name], metadata);
  delete files[metadataPath(name)];
}
export function migrateDocument(files, name) {
  const target = metadataPath(name);
  if (files[target] === undefined) return false;
  if (typeof files[name] !== "string") fail("METADATA_CONFLICT", "Separate lifecycle state has no document; reconcile the orphan before migrating.", { path: name, applied: false });
  if (parts(files[name]).fields.length) fail("METADATA_CONFLICT", "Embedded and separate lifecycle state both exist; reconcile them before migrating.", { path: name, applied: false });
  let metadata;
  try { metadata = JSON.parse(files[target]); validateMetadata(metadata); }
  catch { fail("METADATA_CONFLICT", "Invalid separate lifecycle state; verify the document to rebuild it before migrating.", { path: name, applied: false }); }
  const priorHash = contentHash(files[name], metadata);
  const embedded = withMetadata(files[name], metadata);
  // Preserve deployed verification and destruction baselines, including old BOM/hash contracts.
  if (contentHash(embedded, metadata) !== priorHash) metadata = { ...metadata, migrated_hash: { markdown: bodyHash(withoutMetadata(embedded)), legacy: priorHash } };
  writeMetadata(files, name, metadata);
  return true;
}
export function reviewAfter(metadata) {
  return metadata?.review_after || (metadata?.version === 4 && metadata.verified_at ? new Date(Date.parse(metadata.verified_at) + metadata.review_days * 86400000).toISOString() : undefined);
}
export function contentHash(content, metadata) {
  const current = bodyHash(!metadata || metadata.version >= 4 || parts(content).fields.length ? withoutMetadata(content) : content);
  if (metadata?.migrated_hash) return current === metadata.migrated_hash.markdown ? metadata.migrated_hash.legacy : current;
  if (!metadata || metadata.version >= 3) return current;
  if (metadata.version === 1) return bodyHash(parseDocument(content).body);
  // Version 2 normalized frontmatter rows in the old reader view, including mixed line endings.
  const parsed = parts(content);
  if (!parsed.fields.length) return bodyHash(content);
  const stripped = withoutMetadata(content), header = parts(stripped);
  if (!header.header) return bodyHash(stripped.replace(/^\uFEFF/u, ""));
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  return bodyHash(header.opening + header.block.replace(/\r?\n/gu, newline) + header.header.slice(header.opening.length + header.block.length) + header.body);
}

// Reference scanning ignores historical maintenance evidence without changing physical line numbers.
export function referenceContent(content) {
  let result = content;
  for (const field of parts(content).fields.toReversed()) result = result.slice(0, field.start) + field.text.replace(/[^\r\n]/gu, " ") + result.slice(field.end);
  return result;
}
