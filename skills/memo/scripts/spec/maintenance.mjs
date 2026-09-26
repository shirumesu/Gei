import fs from "node:fs";
import path from "node:path";
import { fail, hash, documentPath, metadataPath, isDocument } from "./io.mjs";
import { metadataFor, writeMetadata, validateMetadata, contentHash, reviewAfter, referenceContent, parseDocument } from "./metadata.mjs";

const DAY = 86400000;
const intervals = { knowledge: 90, handoff: 14, transient: 30 };
const own = (value, key) => Object.hasOwn(value, key);
const date = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) && Number.isFinite(Date.parse(value));
function excerpt(value, limit) {
  const characters = Array.from(value);
  return { text: characters.slice(0, limit).join(""), truncated: characters.length > limit };
}

export function scopePrefix(value) {
  if (typeof value !== "string" || (value !== "all" && value !== "projects/" && !/^(?:projects\/[^/]+\/|context\/)/u.test(value))) fail("ARGUMENT", "Provide path_prefix: projects/<project>/, projects/, context/, or all.");
  if (value !== "all" && (!value.endsWith("/") || value.includes("\\") || value.split("/").some(part => part === "." || part === ".."))) fail("ARGUMENT", "Use a directory knowledge prefix.");
  return name => value === "all" || name.startsWith(value);
}
function sourceHash(root, name) {
  if (!root) return { unavailable: true, status: "not_checked" };
  if (typeof name !== "string" || path.isAbsolute(name) || name.includes("\\") || name.split("/").some(part => !part || part === ".." || part === ".")) return { unavailable: true, status: "unavailable" };
  let base;
  try { base = fs.realpathSync(root); }
  catch { return { unavailable: true, status: "unavailable" }; }
  try {
    const file = fs.realpathSync(path.join(base, name));
    if (!file.startsWith(base + path.sep) || !fs.statSync(file).isFile()) return { unavailable: true, status: "unavailable" };
    return { hash: hash(fs.readFileSync(file)) };
  } catch (error) { return { unavailable: true, status: ["ENOENT", "ENOTDIR"].includes(error.code) ? "missing" : "unavailable" }; }
}
export function lifecycle(content, { now = Date.now(), environment, checkoutRoot, state } = {}) {
  const parsed = state || { metadata: null }, meta = parsed.metadata;
  const reasons = [];
  const observedSources = [];
  const sourceChanges = [];
  const sourceCoverage = { references: 0, checked: 0, missing: 0, not_checked: 0, unavailable: 0 };
  if (parsed.error) reasons.push("invalid_metadata");
  else if (meta) {
    if (meta.verified_hash !== contentHash(content, meta)) reasons.push(meta.verified_at ? "content_changed" : "unverified");
    if (reviewAfter(meta) && Date.parse(reviewAfter(meta)) <= now) reasons.push("review_due");
    if (meta.scope?.environment && environment !== meta.scope.environment) reasons.push("environment_unconfirmed");
    for (const source of meta.sources || []) {
      const actual = sourceHash(checkoutRoot, source.path);
      observedSources.push([source.path, actual.hash || null]);
      sourceCoverage.references++;
      if (actual.unavailable) {
        sourceCoverage[actual.status]++;
        sourceChanges.push({ path: source.path, status: actual.status });
        if (!reasons.includes("source_unavailable")) reasons.push("source_unavailable");
      } else {
        sourceCoverage.checked++;
        if (actual.hash !== source.hash) {
          sourceChanges.push({ path: source.path, status: "changed" });
          if (!reasons.includes("source_changed")) reasons.push("source_changed");
        }
      }
    }
    if (meta.delete_after && Date.parse(meta.delete_after) <= now) reasons.push(meta.deletion_hash === contentHash(content, meta) ? "destruction_due" : "destruction_content_changed");
  }
  const fingerprint = hash(JSON.stringify([contentHash(content, meta), reasons, observedSources, meta?.scope, environment]));
  const cooling = meta?.deferred_fingerprint === fingerprint && Date.parse(meta.retry_after) > now;
  return { metadata: meta, reasons, fingerprint, cooling: Boolean(cooling), source_changes: sourceChanges, source_coverage: sourceCoverage,
    ...(parsed.error ? { error: parsed.error } : {}) };
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
  const lines = referenceContent(content).split("\n");
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
function proseBlocks(content) {
  const headerLines = parseDocument(content).header.split("\n").length - 1;
  const result = [], paragraph = [];
  let start = 0, fence = null, navigation = false, comment = false;
  const flush = () => {
    const text = paragraph.join(" ").replace(/\s+/gu, " ").trim();
    if (Array.from(text).length >= 160) result.push({ text, line: start });
    paragraph.length = 0;
  };
  content.split("\n").forEach((line, index) => {
    if (index < headerLines) return;
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return;
    }
    if (marker) { flush(); fence = marker[1]; return; }
    if (line.includes("<!-- gei:navigation -->")) { flush(); navigation = true; }
    if (navigation) {
      if (line.includes("<!-- /gei:navigation -->")) navigation = false;
      return;
    }
    if (comment || line.includes("<!--")) {
      flush(); comment = !line.includes("-->"); return;
    }
    const onlyLinks = line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)?/u, "")
      .replace(/!?\[[^\]]*\]\(\s*(?:<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/gu, "")
      .replace(/\[[^\]]+\]\[[^\]]*\]/gu, "").trim();
    if (!line.replace(/`+[^`]*`+/gu, "").trim() || /^(?: {4}|\t)|^ {0,3}#{1,6}(?:\s|$)|^\s*[-=]{3,}\s*$|^\s*\[[^\]]+\]:/u.test(line) || !onlyLinks) { flush(); return; }
    if (!paragraph.length) start = index + 1;
    paragraph.push(line.trim());
  });
  flush();
  return result;
}
function duplicateProse(documents) {
  const blocks = new Map(), byDocument = new Map();
  for (const [name, content] of documents) {
    for (const block of proseBlocks(content)) {
      if (!blocks.has(block.text)) blocks.set(block.text, []);
      blocks.get(block.text).push({ path: name, line: block.line });
    }
  }
  for (const [text, occurrences] of blocks) {
    if (new Set(occurrences.map(item => item.path)).size < 2) continue;
    const sample = excerpt(text, 240);
    for (const item of occurrences) {
      const peers = occurrences.filter(peer => peer.path !== item.path);
      if (!byDocument.has(item.path)) byDocument.set(item.path, []);
      byDocument.get(item.path).push({ line: item.line, excerpt: sample.text, excerpt_truncated: sample.truncated,
        peers: peers.slice(0, 5), peers_omitted: Math.max(0, peers.length - 5) });
    }
  }
  for (const blocks of byDocument.values()) blocks.sort((a, b) => a.line - b.line);
  return byDocument;
}
export function inventory(files, prefix, options = {}) {
  const selected = scopePrefix(prefix);
  const refs = Object.entries(files).filter(([name]) => isDocument(name)).flatMap(([name, content]) => references(name, content, Object.keys(files).filter(isDocument)));
  const all = Object.entries(files).filter(([name]) => isDocument(name) && selected(name)).sort(([a], [b]) => a.localeCompare(b));
  const duplicates = duplicateProse(all);
  const results = [], unsignaled = [];
  const coverage = { documents: all.length, lifecycle_tracked: 0, plain_documents: 0, verification_baselines: 0,
    source_baseline_documents: 0, source_references: 0, sources_checked: 0, sources_changed: 0, sources_missing: 0,
    sources_not_checked: 0, sources_unavailable: 0, unsignaled_documents: 0,
    not_assessed: ["semantic_validity", "retention_value", "live_behavior"] };
  let cooling = 0;
  for (const [name, content] of all) {
    const status = lifecycle(content, { ...options, state: metadataFor(files, name) });
    coverage[status.metadata || status.error ? "lifecycle_tracked" : "plain_documents"]++;
    if (status.metadata?.verified_at && status.metadata?.verified_hash) coverage.verification_baselines++;
    if (status.source_coverage.references) coverage.source_baseline_documents++;
    coverage.source_references += status.source_coverage.references;
    for (const key of ["checked", "missing", "not_checked", "unavailable"]) coverage[`sources_${key}`] += status.source_coverage[key];
    coverage.sources_changed += status.source_changes.filter(item => item.status === "changed").length;
    const incoming = refs.filter(item => item.target === name && item.path !== name);
    const broken = refs.filter(item => item.path === name && !own(files, item.target));
    const repeated = duplicates.get(name) || [];
    const reasons = [...status.reasons];
    if (broken.length) reasons.push("broken_reference");
    if (repeated.length) reasons.push("duplicate_content");
    const blockers = incoming.filter(item => !item.navigation);
    if (reasons.includes("destruction_due") && blockers.length) reasons.push("substantive_dependency");
    const eligible = reasons.includes("destruction_due") && !blockers.length && !/\/INDEX\.md$/u.test(name);
    if (!reasons.length) { unsignaled.push({ path: name }); continue; }
    if (status.cooling && !broken.length && !reasons.includes("destruction_due")) { cooling++; continue; }
    const basis = excerpt(status.metadata?.basis || status.metadata?.evidence?.join("; ") || "", 1200);
    const lastAttempt = status.metadata?.attempt_reason === undefined ? undefined : excerpt(status.metadata.attempt_reason, 1200);
    results.push({ path: name, reasons, action: eligible ? "gc_eligible" : "review",
      basis: basis.text, basis_truncated: basis.truncated, scope: status.metadata?.scope,
      kind: status.metadata?.kind, delete_after: status.metadata?.delete_after, deletion_reason: status.metadata?.deletion_reason,
      last_attempt: lastAttempt?.text, last_attempt_truncated: lastAttempt?.truncated, retry_after: status.metadata?.retry_after,
      verified_at: status.metadata?.verified_at, review_after: reviewAfter(status.metadata),
      incoming: incoming.slice(0, 20), incoming_total: incoming.length, broken: broken.slice(0, 20), broken_total: broken.length,
      source_changes: status.source_changes, source_coverage: status.source_coverage,
      duplicates: repeated.slice(0, 3), duplicates_omitted: Math.max(0, repeated.length - 3),
      next: eligible ? "Preview GC; apply only within the authorized scope." : "Read the document and evidence; submit verify/delete/defer. Age is not a deletion reason." });
  }
  const rank = item => item.action === "gc_eligible" ? 0 : item.reasons.some(reason => ["broken_reference", "substantive_dependency", "source_changed", "invalid_metadata"].includes(reason)) ? 1 : 2;
  results.sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path));
  coverage.unsignaled_documents = unsignaled.length;
  return { documents: all.length, results, cooling, refs, coverage, unsignaled };
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
  return { deleted, declarations: report.results.filter(item => deletedSet.has(item.path)).map(({ path, delete_after, deletion_reason }) => ({ path, delete_after, deletion_reason })), navigation: routes, blocked: report.results.filter(item => item.reasons.includes("destruction_due") && item.action !== "gc_eligible"), changes };
}
export function assertDeletionLinks(before, after) {
  const deleted = new Set(Object.keys(before).filter(name => isDocument(name) && !own(after, name)));
  if (!deleted.size) return;
  const unresolved = Object.entries(after).filter(([name]) => isDocument(name)).flatMap(([name, content]) => references(name, content, [...deleted])).filter(item => deleted.has(item.target));
  if (unresolved.length) fail("DEPENDENCY", "Repair incoming links in the same deletion batch.", { applied: false, references: unresolved.slice(0, 30) });
}
export function applyReviews(before, after, reviews, { now = Date.now(), environment, checkoutRoot } = {}) {
  const seen = new Set();
  for (const review of reviews) {
    documentPath(review.path);
    if (seen.has(review.path)) fail("ARGUMENT", "One review per document per batch.");
    seen.add(review.path);
    if (typeof review.basis !== "string" || !review.basis.trim() || !["verify", "delete", "defer"].includes(review.outcome)) fail("ARGUMENT", "A review needs its outcome and a concrete basis: verification evidence, deletion rationale, or the evidence still missing.");
    if (Array.from(review.basis).length > 1200) fail("ARGUMENT", "Keep the review basis within 1200 characters; put detailed evidence in the owning document or source.");
    if (review.outcome === "delete") {
      if (!own(before, review.path)) fail("NOT_FOUND", "Cannot review-delete a missing document.");
      delete after[review.path]; delete after[metadataPath(review.path)]; continue;
    }
    const content = after[review.path];
    if (typeof content !== "string") fail("NOT_FOUND", "Review an existing document or create it in this batch.");
    const parsed = metadataFor(after, review.path);
    if (parsed.error && review.outcome !== "verify") fail("METADATA", "Lifecycle state is invalid. Verify the document with current evidence to rebuild it, or leave it unchanged.", { path: review.path });
    const kind = review.kind || parsed.metadata?.kind || (review.path.includes("/tasks/") ? "handoff" : "knowledge");
    if (!own(intervals, kind)) fail("ARGUMENT", "Use knowledge, handoff, or transient.");
    const stamp = new Date(now).toISOString();
    const meta = { ...parsed.metadata, version: parsed.metadata?.version || 4, kind,
      review_days: review.review_days ?? (kind === parsed.metadata?.kind ? parsed.metadata.review_days : intervals[kind]) };
    if (review.outcome === "defer") {
      if (["kind", "scope", "review_days", "delete_after", "clear_delete_after", "sources"].some(key => own(review, key))) fail("REVIEW", "Defer cannot change retention, scope, or evidence baselines.");
      meta.attempted_at = stamp; meta.attempt_reason = review.basis;
      meta.deferred_fingerprint = lifecycle(content, { now, environment, checkoutRoot, state: { metadata: meta } }).fingerprint;
      meta.retry_after = new Date(now + 30 * DAY).toISOString();
    } else {
      if (own(review, "scope")) {
        if (review.scope === null) delete meta.scope;
        else {
          const scope = review.scope;
          if (!scope || typeof scope !== "object" || Array.isArray(scope) || !Object.keys(scope).length
            || Object.entries(scope).some(([key, value]) => !["environment", "platform"].includes(key) || typeof value !== "string" || !value.trim())) {
            fail("REVIEW", "Use nonempty environment/platform qualifiers, omit scope to preserve it, or pass null to clear it.", { path: review.path });
          }
          meta.scope = Object.fromEntries(Object.entries(scope).map(([key, value]) => [key, value.trim()]));
        }
      }
      meta.version = 4; delete meta.migrated_hash; delete meta.created_at; meta.verified_at = stamp; meta.verified_hash = contentHash(content, meta); meta.basis = review.basis;
      delete meta.evidence; delete meta.reason;
      delete meta.review_after;
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
        meta.delete_after = review.delete_after; meta.deletion_reason = review.deletion_reason; meta.deletion_hash = contentHash(content, meta);
      }
    }
    validateMetadata(meta);
    writeMetadata(after, review.path, meta);
  }
}
