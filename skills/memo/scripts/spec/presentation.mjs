const descriptions = {
  invalid_metadata: "Lifecycle state needs rebuilding through an evidence-based verification",
  legacy_metadata: "Old lifecycle record format; convert it with migrate-metadata",
  unverified: "Document has not been verified",
  content_changed: "Content changed since its last verification",
  review_due: "Review is due; age does not establish invalidity",
  environment_unconfirmed: "The recorded environment is unconfirmed here",
  source_unavailable: "Source evidence is unavailable in this checkout",
  source_changed: "Source evidence changed",
  destruction_due: "Declared transient retention has ended",
  destruction_content_changed: "Content changed since retention was declared; reconsider retention",
  broken_reference: "Outgoing reference is missing",
  substantive_dependency: "Substantive incoming references block cleanup",
  duplicate_content: "Substantial prose repeats in another document; assess ownership before merging",
};
const oneLine = value => String(value).replace(/[\r\n]+/gu, " ");
const brief = (value, truncated = false) => { const text = Array.from(oneLine(value)); return text.slice(0, 240).join("") + (truncated || text.length > 240 ? " [excerpt; read full document]" : ""); };
const reasonText = reasons => reasons.map(reason => descriptions[reason] || reason).join("; ");
function entry(item) {
  const lines = [`- ${item.path}`, `  Status: ${reasonText(item.reasons)}`, `  Next: ${item.next}`];
  for (const source of item.source_changes || []) lines.push(`  Evidence: ${source.path} — ${source.status}`);
  for (const duplicate of item.duplicates || []) {
    lines.push(`  Repeated at line ${duplicate.line}: ${brief(duplicate.excerpt, duplicate.excerpt_truncated)}`);
    for (const peer of duplicate.peers || []) lines.push(`    Also: ${peer.path}:${peer.line}`);
    if (duplicate.peers_omitted) lines.push(`    ${duplicate.peers_omitted} more occurrences omitted.`);
  }
  if (item.duplicates_omitted) lines.push(`  ${item.duplicates_omitted} more duplicate blocks omitted.`);
  if (item.basis) lines.push(`  Last verification basis: ${brief(item.basis, item.basis_truncated)}`);
  if (item.verified_at) lines.push(`  Last verified: ${item.verified_at}; review after: ${item.review_after}`);
  if (item.scope) lines.push(`  Applicability: ${[item.scope.environment, item.scope.platform].filter(Boolean).map(oneLine).join("; ") || "not specified"}`);
  if (item.delete_after) lines.push(`  Retention ends: ${item.delete_after}; ${oneLine(item.deletion_reason)}`);
  if (item.last_attempt) lines.push(`  Unresolved: ${brief(item.last_attempt, item.last_attempt_truncated)}${item.retry_after ? `; retry after: ${item.retry_after}` : ""}`);
  for (const ref of item.incoming || []) lines.push(`  Incoming: ${ref.path}:${ref.line} (${ref.navigation ? "navigation" : "substantive"})`);
  if (item.incoming_total > item.incoming?.length) lines.push(`  Incoming references: ${item.incoming_total} total; remaining entries omitted.`);
  for (const ref of item.broken || []) lines.push(`  Missing: ${ref.target}, referenced at line ${ref.line}`);
  if (item.broken_total > item.broken?.length) lines.push(`  Missing references: ${item.broken_total} total; remaining entries omitted.`);
  return lines.join("\n");
}
export function formatMaintenance(name, result) {
  const lines = [`${name === "spec_check" ? "Maintenance check" : "Cleanup " + (result.preview ? "preview" : "result")}: ${result.path_prefix}`,
    `Revision: ${result.revision}${result.stale ? " (cached; source unavailable)" : ""}`];
  if (name === "spec_check") {
    lines.push(`Documents: ${result.documents}; candidates: ${result.candidates}; deferred: ${result.cooling}; eligible for cleanup: ${result.gc_eligible}`,
      "Not assessed: factual correctness, continued value, and live behavior. Zero candidates is not a quality verdict.");
    if (result.coverage) {
      const coverage = result.coverage;
      lines.push(`Coverage: ${coverage.lifecycle_tracked} with lifecycle state; ${coverage.plain_documents} plain documents; ${coverage.verification_baselines} verification baselines.`,
        `Sources: ${coverage.sources_checked} checked; ${coverage.sources_changed} changed; ${coverage.sources_missing} missing; ${coverage.sources_unavailable} unavailable; ${coverage.sources_not_checked} not checked (no checkout).`);
    }
    lines.push(`Current environment: ${result.environment}`);
    if (result.next_check) lines.push(`Continue candidates: spec_check ${JSON.stringify(result.next_check)}`);
    if (!result.results.length) lines.push("No mechanical candidates in this batch; review the sample below rather than treating this as approval.");
    lines.push(...result.results.map(entry));
    if (result.review_sample?.length) {
      lines.push("Bounded review sample without mechanical signals (proposed for agent review, not verified):");
      for (const item of result.review_sample) lines.push(`- ${item.path}\n  Next: ${item.next}\n  Read: spec_read ${JSON.stringify(item.read)}`);
    }
    else if (!result.results.length) lines.push("No sample available here; omitted, deferred or unread content remains unassessed.");
    if (result.remaining) lines.push(`Remaining: ${result.remaining}; continue with offset ${result.next_offset} and this revision.`);
  } else {
    lines.push(`Plan: ${result.plan_id}`, `Deleted or proposed: ${result.deleted.length}; navigation repairs: ${result.navigation.length}; blocked: ${result.blocked.length}; applied: ${Boolean(result.applied)}`);
    for (const item of result.declarations || []) lines.push(`- ${item.path}: retention ended ${item.delete_after}; ${oneLine(item.deletion_reason)}`);
    for (const ref of result.navigation) lines.push(`- Repair navigation: ${ref.path}:${ref.line} → ${ref.target}`);
    lines.push(...result.blocked.map(entry));
    if (result.preview && result.deleted.length) lines.push("Apply this plan with its revision and plan identifier when cleanup is authorized.");
  }
  return lines.join("\n");
}
