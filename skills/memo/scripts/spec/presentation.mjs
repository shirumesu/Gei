const descriptions = {
  invalid_metadata: "Lifecycle state needs rebuilding through an evidence-based verification",
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
};
const oneLine = value => String(value).replace(/[\r\n]+/gu, " ");
const reasonText = reasons => reasons.map(reason => descriptions[reason] || reason).join("; ");
function entry(item) {
  const lines = [`- ${item.path}`, `  Status: ${reasonText(item.reasons)}`];
  if (item.basis) lines.push(`  Last verification basis: ${oneLine(item.basis)}`);
  if (item.verified_at) lines.push(`  Last verified: ${item.verified_at}; review after: ${item.review_after}`);
  if (item.scope) lines.push(`  Environment: ${item.scope.environment}${item.scope.platform ? ` (${oneLine(item.scope.platform)})` : ""}`);
  if (item.delete_after) lines.push(`  Retention ends: ${item.delete_after}; ${oneLine(item.deletion_reason)}`);
  if (item.last_attempt) lines.push(`  Unresolved: ${oneLine(item.last_attempt)}; retry after: ${item.retry_after}`);
  for (const ref of item.incoming || []) lines.push(`  Incoming: ${ref.path}:${ref.line} (${ref.navigation ? "navigation" : "substantive"})`);
  if (item.incoming_total > item.incoming?.length) lines.push(`  Incoming references: ${item.incoming_total} total; remaining entries omitted.`);
  for (const ref of item.broken || []) lines.push(`  Missing: ${ref.target}, referenced at line ${ref.line}`);
  if (item.broken_total > item.broken?.length) lines.push(`  Missing references: ${item.broken_total} total; remaining entries omitted.`);
  lines.push(`  Next: ${item.next}`);
  return lines.join("\n");
}
export function formatMaintenance(name, result) {
  const lines = [`${name === "spec_check" ? "Maintenance check" : "Cleanup " + (result.preview ? "preview" : "result")}: ${result.path_prefix}`,
    `Revision: ${result.revision}${result.stale ? " (cached; source unavailable)" : ""}`];
  if (name === "spec_check") {
    lines.push(`Documents: ${result.documents}; candidates: ${result.candidates}; deferred: ${result.cooling}; eligible for cleanup: ${result.gc_eligible}`,
      `Current environment: ${result.environment}`);
    if (!result.results.length) lines.push("No review candidates in this batch.");
    lines.push(...result.results.map(entry));
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
