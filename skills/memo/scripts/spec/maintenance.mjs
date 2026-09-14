import fs from "node:fs";
import path from "node:path";
import { fail, hash, documentPath } from "./io.mjs";

const DAY = 86400000;
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
function validateMetadata(value) {
  if (!value || value.version !== 1 || !own(intervals, value.kind) || !date(value.created_at)) throw new Error("Invalid lifecycle metadata");
  for (const key of ["verified_at", "review_after", "retry_after", "delete_after"]) if (value[key] !== undefined && !date(value[key])) throw new Error(`Invalid ${key}`);
  if (!Number.isInteger(value.review_days) || value.review_days < 1 || value.review_days > 365) throw new Error("Invalid review_days");
  if (value.delete_after && (value.kind !== "transient" || !value.deletion_reason?.trim() || !/^[a-f0-9]{64}$/u.test(value.deletion_hash || ""))) throw new Error("Destruction requires a transient record, reason, and content version");
  if (value.evidence !== undefined && (!Array.isArray(value.evidence) || value.evidence.some(item => typeof item !== "string"))) throw new Error("Invalid evidence");
  if (value.sources !== undefined && (!Array.isArray(value.sources) || value.sources.some(item => !item || typeof item.path !== "string" || !/^[a-f0-9]{64}$/u.test(item.hash || "")))) throw new Error("Invalid sources");
  if (value.scope !== undefined && (!value.scope || typeof value.scope.environment !== "string")) throw new Error("Invalid scope");
}
export function withMetadata(content, metadata) {
  const parsed = parseDocument(content);
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const field = `gei: ${JSON.stringify(metadata)}`;
  if (!parsed.header) return `---${newline}${field}${newline}---${newline}${content}`;
  const rows = parsed.header.replace(/^\uFEFF?---\r?\n/u, "").replace(/\r?\n---(?:\r?\n|$)$/u, "").split(/\r?\n/u);
  // Preserve unrelated frontmatter; Gei owns only its single JSON-as-YAML field.
  const kept = rows.filter(line => !/^gei:/u.test(line));
  return `---${newline}${[...kept, field].join(newline)}${newline}---${newline}${parsed.body}`;
}
export function scopePrefix(value) {
  if (typeof value !== "string" || (value !== "all" && value !== "projects/" && !/^(?:projects\/[^/]+\/|context\/)/u.test(value))) fail("ARGUMENT", "Provide path_prefix: projects/<project>/, projects/, context/, or all.");
  if (value !== "all" && (!value.endsWith("/") || value.includes("\\") || value.split("/").some(part => part === "." || part === ".."))) fail("ARGUMENT", "Use a directory knowledge prefix.");
  return name => value === "all" || name.startsWith(value);
}
function sourceHash(root, name) {
  if (!root) return { unavailable: true };
  if (typeof name !== "string" || path.isAbsolute(name) || name.includes("\\") || name.split("/").some(part => !part || part === ".." || part === ".")) return { unavailable: true };
  try {
    const base = fs.realpathSync(root), file = fs.realpathSync(path.join(base, name));
    if (!file.startsWith(base + path.sep) || !fs.statSync(file).isFile()) return { unavailable: true };
    return { hash: hash(fs.readFileSync(file)) };
  } catch { return { unavailable: true }; }
}
export function lifecycle(content, { now = Date.now(), environment, checkoutRoot } = {}) {
  const parsed = parseDocument(content), meta = parsed.metadata;
  const reasons = [];
  const observedSources = [];
  if (parsed.error) reasons.push("invalid_metadata");
  else if (!meta) reasons.push("missing_metadata");
  else {
    if (meta.verified_hash !== bodyHash(parsed.body)) reasons.push(meta.verified_at ? "content_changed" : "unverified");
    if (meta.review_after && Date.parse(meta.review_after) <= now) reasons.push("review_due");
    if (meta.scope?.environment && environment !== meta.scope.environment) reasons.push("environment_unconfirmed");
    for (const source of meta.sources || []) {
      const actual = sourceHash(checkoutRoot, source.path);
      observedSources.push([source.path, actual.hash || null]);
      if (actual.unavailable) { if (!reasons.includes("source_unavailable")) reasons.push("source_unavailable"); }
      else if (actual.hash !== source.hash && !reasons.includes("source_changed")) reasons.push("source_changed");
    }
    if (meta.delete_after && Date.parse(meta.delete_after) <= now) reasons.push(meta.deletion_hash === bodyHash(parsed.body) ? "destruction_due" : "destruction_content_changed");
  }
  const fingerprint = hash(JSON.stringify([bodyHash(parsed.body), reasons, observedSources, meta?.scope, environment]));
  const cooling = meta?.deferred_fingerprint === fingerprint && Date.parse(meta.retry_after) > now;
  return { metadata: meta, reasons, fingerprint, cooling: Boolean(cooling), ...(parsed.error ? { error: parsed.error } : {}) };
}
function targetPath(owner, raw) {
  let target;
  try { target = decodeURIComponent(raw.trim().replace(/^<|>$/gu, "").split(/[?#]/u)[0]); } catch { return null; }
  if (!target || /^(?:[a-z][a-z\d+.-]*:|\/)/iu.test(target)) return null;
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(owner), target));
  try { return documentPath(resolved); } catch { return null; }
}
export function references(owner, content, knownTargets = []) {
  const result = [], definitions = new Map();
  // Text mentions need a path relative to this document or the knowledge root.
  // A shared basename alone must not link unrelated project indexes and topics.
  const textualTargets = knownTargets.filter(target => target !== owner).map(target => {
    const aliases = [target, path.posix.relative(path.posix.dirname(owner), target)];
    if (!aliases[1].startsWith("../")) aliases.push(`./${aliases[1]}`);
    const escaped = aliases.map(alias => alias.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"));
    return { target, pattern: new RegExp(`(?<![\\p{L}\\p{N}_./%:+-])(?:${escaped.join("|")})(?![\\p{L}\\p{N}_./%+-])`, "iu") };
  });
  const lines = content.split("\n");
  let fence = null, managed = false;
  const usable = lines.map(line => {
    const marker = /^\s*(`{3,}|~{3,})/u.exec(line);
    if (marker) { if (!fence) fence = marker[1][0]; else if (fence === marker[1][0]) fence = null; return ""; }
    if (fence) return "";
    return line.replace(/`+[^`]*`+/gu, "");
  });
  usable.forEach((line, index) => {
    const match = /^\s*\[([^\]]+)\]:\s*(<[^>]+>|\S+)/u.exec(line);
    if (match) definitions.set(match[1].toLowerCase(), { target: targetPath(owner, match[2]), line: index + 1 });
  });
  usable.forEach((line, index) => {
    if (line.includes("<!-- gei:navigation -->")) managed = true;
    if (line.includes("<!-- /gei:navigation -->")) managed = false;
    const inline = [...line.matchAll(/!?\[([^\]]*)\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/gu)];
    const original = lines[index].trim();
    const nextContent = lines.slice(index + 1).find(value => value.trim()) || "";
    const nested = /^\s*/u.exec(nextContent)[0].length > /^\s*/u.exec(lines[index])[0].length;
    const pure = inline.length === 1 && /^[-*+]\s+/u.test(original) && original.replace(/^[-*+]\s+/u, "") === inline[0][0] && !nested && (managed || /\/(?:INDEX|README)\.md$/u.test(owner));
    for (const match of inline) {
      const target = targetPath(owner, match[2]);
      if (target) result.push({ path: owner, target, line: index + 1, navigation: pure, text: lines[index].slice(0, 500) });
    }
    if (/^\s*\[[^\]]+\]:/u.test(line)) return;
    for (const match of line.matchAll(/\[([^\]]+)\](?:\[([^\]]*)\])?(?!\()/gu)) {
      const definition = definitions.get((match[2] || match[1]).toLowerCase());
      if (definition?.target) result.push({ path: owner, target: definition.target, line: index + 1, navigation: false, text: lines[index].slice(0, 500) });
    }
    for (const match of line.matchAll(/(?:href|src)=["']([^"']+)["']/giu)) {
      const target = targetPath(owner, match[1]);
      if (target) result.push({ path: owner, target, line: index + 1, navigation: false, text: lines[index].slice(0, 500) });
    }
    // Unparsed Markdown or textual references are dependencies, never disposable navigation.
    let mention = lines[index].replaceAll("\\", "");
    try { mention = decodeURIComponent(mention); } catch { /* Keep literal malformed URI text. */ }
    for (const { target, pattern } of textualTargets) {
      if (pattern.test(mention) && !result.some(item => item.target === target && item.line === index + 1)) {
        result.push({ path: owner, target, line: index + 1, navigation: false, text: lines[index].slice(0, 500), uncertain: true });
      }
    }
  });
  return result;
}
export function inventory(files, prefix, options = {}) {
  const selected = scopePrefix(prefix);
  const refs = Object.entries(files).flatMap(([name, content]) => references(name, content, Object.keys(files)));
  const all = Object.entries(files).filter(([name]) => selected(name)).sort(([a], [b]) => a.localeCompare(b));
  const results = [];
  let cooling = 0;
  for (const [name, content] of all) {
    const status = lifecycle(content, options);
    const incoming = refs.filter(item => item.target === name && item.path !== name);
    const broken = refs.filter(item => item.path === name && !own(files, item.target));
    const reasons = [...status.reasons];
    if (broken.length) reasons.push("broken_reference");
    const blockers = incoming.filter(item => !item.navigation);
    if (reasons.includes("destruction_due") && blockers.length) reasons.push("substantive_dependency");
    const eligible = reasons.includes("destruction_due") && !blockers.length && !/\/INDEX\.md$/u.test(name);
    if (!reasons.length) continue;
    if (status.cooling && !broken.length && !reasons.includes("destruction_due")) { cooling++; continue; }
    results.push({ path: name, reasons, action: eligible ? "gc_eligible" : "review", fingerprint: status.fingerprint,
      evidence: (status.metadata?.evidence || []).slice(0, 5).map(item => item.slice(0, 500)), evidence_total: status.metadata?.evidence?.length || 0, scope: status.metadata?.scope,
      verified_at: status.metadata?.verified_at, review_after: status.metadata?.review_after,
      incoming: incoming.slice(0, 20), incoming_total: incoming.length, broken: broken.slice(0, 20), broken_total: broken.length,
      next: eligible ? "Preview GC; apply only within the authorized scope." : "Read the document and evidence; submit keep/update/delete/defer. Age is not a deletion reason." });
  }
  const rank = item => item.action === "gc_eligible" ? 0 : item.reasons.some(reason => ["broken_reference", "substantive_dependency", "source_changed", "invalid_metadata"].includes(reason)) ? 1 : item.reasons.includes("missing_metadata") ? 3 : 2;
  results.sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path));
  return { documents: all.length, results, cooling, refs };
}
export function gcPlan(files, prefix, options = {}) {
  const report = inventory(files, prefix, options);
  const deleted = report.results.filter(item => item.action === "gc_eligible").map(item => item.path);
  const deletedSet = new Set(deleted), changes = Object.fromEntries(deleted.map(name => [name, null]));
  const routes = report.refs.filter(item => deletedSet.has(item.target) && !deletedSet.has(item.path));
  for (const name of new Set(routes.map(item => item.path))) {
    const lines = new Set(routes.filter(item => item.path === name).map(item => item.line));
    changes[name] = files[name].split("\n").filter((_, index) => !lines.has(index + 1)).join("\n");
  }
  return { deleted, navigation: routes, blocked: report.results.filter(item => item.reasons.includes("destruction_due") && item.action !== "gc_eligible"), changes };
}
export function assertDeletionLinks(before, after) {
  const deleted = new Set(Object.keys(before).filter(name => !own(after, name)));
  if (!deleted.size) return;
  const unresolved = Object.entries(after).flatMap(([name, content]) => references(name, content, [...deleted])).filter(item => deleted.has(item.target));
  if (unresolved.length) fail("DEPENDENCY", "Repair incoming links in the same deletion batch.", { applied: false, references: unresolved.slice(0, 30) });
}
export function applyReviews(before, after, reviews, { now = Date.now(), environment, checkoutRoot } = {}) {
  const seen = new Set();
  for (const review of reviews) {
    documentPath(review.path);
    if (seen.has(review.path)) fail("ARGUMENT", "One review per document per batch.");
    seen.add(review.path);
    if (!review.reason?.trim() || !["keep", "update", "delete", "defer"].includes(review.outcome)) fail("ARGUMENT", "A review needs its outcome and concrete reason.");
    if (review.outcome === "delete") {
      if (!own(before, review.path)) fail("NOT_FOUND", "Cannot review-delete a missing document.");
      delete after[review.path]; continue;
    }
    const content = after[review.path];
    if (typeof content !== "string") fail("NOT_FOUND", "Review an existing document or create it in this batch.");
    const parsed = parseDocument(content), old = parseDocument(before[review.path] || "");
    if (parsed.error) fail("METADATA", "Repair invalid metadata explicitly before reviewing.", { path: review.path });
    if (["keep", "defer"].includes(review.outcome) && before[review.path] !== undefined && bodyHash(old.body) !== bodyHash(parsed.body)) fail("REVIEW", "Use update when changing the reviewed body.");
    if (review.outcome !== "defer" && (!Array.isArray(review.evidence) || !review.evidence.length || review.evidence.some(item => typeof item !== "string" || !item.trim()))) fail("REVIEW", "A successful review needs current evidence.");
    const kind = review.kind || parsed.metadata?.kind || (review.path.includes("/tasks/") ? "handoff" : "knowledge");
    if (!own(intervals, kind)) fail("ARGUMENT", "Use knowledge, handoff, or transient.");
    const stamp = new Date(now).toISOString();
    const meta = { ...parsed.metadata, version: 1, kind, created_at: parsed.metadata?.created_at || stamp,
      review_days: review.review_days ?? parsed.metadata?.review_days ?? intervals[kind] };
    if (review.scope) meta.scope = review.scope;
    if (review.outcome === "defer") {
      if (review.kind || review.scope || review.review_days || review.delete_after || review.clear_delete_after || review.sources) fail("REVIEW", "Defer cannot change retention, scope, or evidence baselines.");
      meta.attempted_at = stamp; meta.attempt_reason = review.reason;
      const interim = withMetadata(content, meta);
      meta.deferred_fingerprint = lifecycle(interim, { now, environment, checkoutRoot }).fingerprint;
      meta.retry_after = new Date(now + 30 * DAY).toISOString();
    } else {
      meta.verified_at = stamp; meta.verified_hash = bodyHash(parsed.body); meta.evidence = review.evidence; meta.reason = review.reason;
      meta.review_after = new Date(now + meta.review_days * DAY).toISOString();
      delete meta.retry_after; delete meta.deferred_fingerprint; delete meta.attempt_reason; delete meta.attempted_at;
      if (review.sources) {
        meta.sources = review.sources.map(name => {
          const value = sourceHash(checkoutRoot, name);
          if (value.unavailable) fail("EVIDENCE", "Cannot baseline a source without its checkout file.", { path: name });
          return { path: name, hash: value.hash };
        });
      }
      if (review.clear_delete_after || kind !== "transient") { delete meta.delete_after; delete meta.deletion_reason; delete meta.deletion_hash; }
      if (review.delete_after) {
        if (kind !== "transient" || /\/INDEX\.md$/u.test(review.path) || !date(review.delete_after) || !review.deletion_reason?.trim()) fail("RETENTION", "Only transient non-INDEX records may declare destruction, with a UTC date and reason.");
        meta.delete_after = review.delete_after; meta.deletion_reason = review.deletion_reason; meta.deletion_hash = bodyHash(parsed.body);
      }
    }
    validateMetadata(meta);
    after[review.path] = withMetadata(content, meta);
  }
}
