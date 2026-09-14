import { fail, hash, metadataPath } from "./io.mjs";

const intervals = { knowledge: 90, handoff: 14, transient: 30 };
const own = (value, key) => Object.hasOwn(value, key);
export const bodyHash = body => hash(body.replaceAll("\r\n", "\n"));
export function parseDocument(content) {
  const header = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content);
  if (!header) return { body: content, metadata: null, header: "" };
  const rows = header[1].split(/\r?\n/u);
  const fields = rows.filter(line => /^gei:/u.test(line));
  if (!fields.length) return { body: content.slice(header[0].length), metadata: null, header: header[0] };
  try {
    if (fields.length !== 1) throw new Error("Duplicate gei field");
    const metadata = JSON.parse(fields[0].slice(4).trim());
    validateMetadata(metadata);
    return { body: content.slice(header[0].length), metadata, header: header[0] };
  } catch (error) { return { body: content.slice(header[0].length), metadata: null, header: header[0], error: error.message }; }
}
function date(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) && Number.isFinite(Date.parse(value)); }
export function validateMetadata(value) {
  if (!value || ![1, 2, 3].includes(value.version) || !own(intervals, value.kind) || !date(value.created_at)) throw new Error("Invalid lifecycle metadata");
  if (value.migrated_hash !== undefined && (!/^[a-f0-9]{64}$/u.test(value.migrated_hash?.markdown || "") || !/^[a-f0-9]{64}$/u.test(value.migrated_hash?.legacy || ""))) throw new Error("Invalid migrated_hash");
  for (const key of ["verified_at", "review_after", "retry_after", "delete_after"]) if (value[key] !== undefined && !date(value[key])) throw new Error(`Invalid ${key}`);
  if (!Number.isInteger(value.review_days) || value.review_days < 1 || value.review_days > 365) throw new Error("Invalid review_days");
  if (value.delete_after && (value.kind !== "transient" || !value.deletion_reason?.trim() || !/^[a-f0-9]{64}$/u.test(value.deletion_hash || ""))) throw new Error("Destruction requires a transient record, reason, and content version");
  if (value.evidence !== undefined && (!Array.isArray(value.evidence) || value.evidence.some(item => typeof item !== "string"))) throw new Error("Invalid evidence");
  if (value.sources !== undefined && (!Array.isArray(value.sources) || value.sources.some(item => !item || typeof item.path !== "string" || !/^[a-f0-9]{64}$/u.test(item.hash || "")))) throw new Error("Invalid sources");
  if (value.scope !== undefined && (!value.scope || typeof value.scope.environment !== "string")) throw new Error("Invalid scope");
}

// Legacy extraction is used only when committing a migration, never for ordinary reads.
export function extractLegacy(content) {
  const parsed = parseDocument(content);
  if (!parsed.header) return { content, fields: [] };
  const opening = /^(?:\uFEFF)?---\r?\n/u.exec(parsed.header)[0];
  const closing = /\r?\n---(?:\r?\n|$)$/u.exec(parsed.header);
  const separator = closing[0].startsWith("\r\n") ? "\r\n" : "\n";
  const block = parsed.header.slice(opening.length, closing.index) + separator;
  const fields = block.split(/\r?\n/u).filter(row => /^gei:/u.test(row));
  if (!fields.length) return { content, fields };
  const kept = block.replace(/^gei:[^\n]*(?:\n|$)/gmu, "");
  const bom = content.startsWith("\uFEFF") ? "\uFEFF" : "";
  const hasHeader = Boolean(kept.trim());
  return { content: hasHeader ? opening + kept + closing[0].slice(separator.length) + parsed.body : bom + parsed.body,
    fields, hasHeader, parsed };
}

export function metadataFor(files, name) {
  const raw = files[metadataPath(name)];
  const legacy = parseDocument(files[name] || "");
  if (raw === undefined) return legacy;
  try {
    const metadata = JSON.parse(raw);
    validateMetadata(metadata);
    if (legacy.metadata || legacy.error) return { metadata: null, error: "Both embedded and separate lifecycle metadata exist" };
    return { metadata };
  } catch (error) { return { metadata: null, error: error.message }; }
}
export function writeMetadata(files, name, metadata) {
  files[metadataPath(name)] = JSON.stringify(metadata, null, 2) + "\n";
}
export function migrateDocument(files, name) {
  const legacy = extractLegacy(files[name]);
  if (!legacy.fields.length) return false;
  const target = metadataPath(name);
  if (files[target] !== undefined) fail("METADATA_CONFLICT", "Embedded and separate lifecycle state both exist; reconcile them before migrating.", { path: name, applied: false });
  const metadata = legacy.parsed.metadata;
  if (metadata) {
    // Keep verification, destruction and deferred fingerprints unchanged across byte-preserving extraction.
    // The bridge stops matching after any Markdown change and is removed by explicit verification.
    writeMetadata(files, name, { ...metadata, migrated_hash: { markdown: bodyHash(legacy.content), legacy: contentHash(files[name], metadata) } });
  } else {
    writeMetadata(files, name, { legacy_fields: legacy.fields });
  }
  files[name] = legacy.content;
  return true;
}
export function initializeMetadata(files, name, now) {
  if (files[metadataPath(name)] !== undefined) return;
  const kind = name.includes("/tasks/") ? "handoff" : "knowledge";
  writeMetadata(files, name, { version: 3, kind, created_at: new Date(now).toISOString(), review_days: intervals[kind] });
}
export function contentHash(content, metadata) {
  const current = bodyHash(content);
  if (metadata?.migrated_hash) return current === metadata.migrated_hash.markdown ? metadata.migrated_hash.legacy : current;
  if (metadata?.version === 3) return current;
  if (metadata?.version === 1) return bodyHash(parseDocument(content).body);
  // Version 2 hashed the old reader view, which normalized rows inside mixed frontmatter.
  const match = /^(\uFEFF?---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/u.exec(content);
  if (!match) return current;
  const rows = match[2].split(/\r?\n/u);
  if (!rows.some(row => /^gei:/u.test(row))) return current;
  const kept = rows.filter(row => !/^gei:/u.test(row));
  const body = content.slice(match[0].length);
  return bodyHash(kept.some(row => row.trim()) ? match[1] + kept.join(content.includes("\r\n") ? "\r\n" : "\n") + match[3] + body : body);
}
