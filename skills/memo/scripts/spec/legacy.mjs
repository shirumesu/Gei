// One-time conversion of 0.11-era lifecycle records (versions 1–4) into compact version 5.
// Only migrate-metadata imports this file; remove it once old stores no longer need conversion.
import { hash } from "./io.mjs";
import { parts, parseDocument, withoutMetadata, withMetadata, contentHash, validateMetadata } from "./metadata.mjs";

const bodyHash = body => hash(body.replaceAll("\r\n", "\n"));

// The content fingerprint each old version recorded, reproduced so baselines survive conversion.
function legacyHash(content, metadata) {
  const current = bodyHash(metadata.version >= 4 || parts(content).fields.length ? withoutMetadata(content) : content);
  if (metadata.migrated_hash) return current === metadata.migrated_hash.markdown ? metadata.migrated_hash.legacy : current;
  if (metadata.version >= 3) return current;
  if (metadata.version === 1) return bodyHash(parts(content).body);
  const stripped = withoutMetadata(content), header = parts(stripped);
  if (!header.header) return bodyHash(stripped.replace(/^﻿/u, ""));
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  return bodyHash(header.opening + header.block.replace(/\r?\n/gu, newline) + header.header.slice(header.opening.length + header.block.length) + header.body);
}

// Returns null when the document has no old record; throws when the old record cannot be read.
export function convertLegacy(content) {
  const parsed = parseDocument(content);
  const old = parsed.legacy;
  if (!old) {
    if (parsed.fields.length && !parsed.metadata) throw new Error(parsed.error);
    return null;
  }
  const matches = old.verified_hash && legacyHash(content, old) === old.verified_hash;
  const kept = value => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
  const next = { version: 5, kind: old.kind,
    review_days: Number.isInteger(old.review_days) ? old.review_days : { knowledge: 90, handoff: 14, transient: 30 }[old.kind] };
  if (old.verified_at) next.verified_at = old.verified_at;
  // A matching baseline is rebased onto the new fingerprint; a stale one keeps a value that cannot match.
  if (kept(old.verified_hash)) next.verified_hash = matches ? contentHash(content) : old.verified_hash.slice(0, 16);
  const basis = old.basis || [old.reason, ...(old.evidence || [])].filter(Boolean).join("; ");
  if (basis) next.basis = basis;
  if (Array.isArray(old.sources) && old.sources.length) next.sources = Object.fromEntries(old.sources.map(item => [item.path, item.hash.slice(0, 16)]));
  if (old.scope) next.scope = old.scope;
  if (old.delete_after && kept(old.deletion_hash)) {
    next.delete_after = old.delete_after;
    next.deletion_reason = old.deletion_reason;
    next.deletion_hash = legacyHash(content, old) === old.deletion_hash ? contentHash(content) : old.deletion_hash.slice(0, 16);
  }
  // Deferral fingerprints used the old hash; keep the reason but let the document resurface.
  if (old.attempt_reason) { next.attempt_reason = old.attempt_reason; if (old.attempted_at) next.attempted_at = old.attempted_at; }
  validateMetadata(next);
  return { content: withMetadata(content, next), baseline: old.verified_hash ? (matches ? "preserved" : "stale") : "none" };
}
