export class CheckText {
  static descriptions = {
    source_unavailable: "A listed source path does not exist in the checkout",
    source_changed: "A listed source's last git commit is newer than this document",
    broken_reference: "Outgoing reference is missing",
    orphan_note: "This topic note is not linked from its topic README",
    duplicate_content: "Substantial prose repeats in another document; assess ownership before merging",
  };

  static oneLine(value) { return String(value).replace(/[\r\n]+/gu, " "); }
  static brief(value, truncated = false) {
    const text = Array.from(this.oneLine(value));
    return text.slice(0, 240).join("") + (truncated || text.length > 240 ? " [excerpt; read full document]" : "");
  }
  static reasonText(reasons) { return reasons.map(reason => this.descriptions[reason] || reason).join("; "); }
  static entry(item) {
    const lines = [`- ${item.path}`, `  Status: ${this.reasonText(item.reasons)}`, `  Next: ${item.next}`];
    for (const source of item.source_changes || []) lines.push(`  Source: ${source.path} — ${source.status}`);
    for (const duplicate of item.duplicates || []) {
      lines.push(`  Repeated at line ${duplicate.line}: ${this.brief(duplicate.excerpt, duplicate.excerpt_truncated)}`);
      for (const peer of duplicate.peers || []) lines.push(`    Also: ${peer.path}:${peer.line}`);
      if (duplicate.peers_omitted) lines.push(`    ${duplicate.peers_omitted} more occurrences omitted.`);
    }
    if (item.duplicates_omitted) lines.push(`  ${item.duplicates_omitted} more duplicate blocks omitted.`);
    if (item.topic_readme) lines.push(`  Topic README: ${item.topic_readme}`);
    for (const ref of item.broken || []) lines.push(`  Missing: ${ref.target}, referenced at line ${ref.line}`);
    if (item.broken_total > item.broken?.length) lines.push(`  Missing references: ${item.broken_total} total; remaining entries omitted.`);
    return lines.join("\n");
  }
  static format(result) {
    const lines = [`Maintenance check: ${result.path_prefix}`,
      `Revision: ${result.revision}${result.stale ? " (cached snapshot)" : ""}`,
      `Documents: ${result.documents}; candidates: ${result.candidates}`,
      "Signals: broken references, topic notes missing from their README, duplicate prose, and source drift. Not assessed: factual correctness, continued value, and live behavior. Zero candidates is not a quality verdict."];
    const counts = Object.entries(result.counts || {});
    if (counts.length) lines.push(`Counts: ${counts.map(([key, value]) => `${key} ${value}`).join("; ")}`);
    if (result.next_check) lines.push(`Continue candidates: spec_check ${JSON.stringify(result.next_check)}`);
    if (!result.results.length) lines.push("No mechanical candidates in this batch.");
    lines.push(...result.results.map(item => this.entry(item)));
    if (result.remaining) lines.push(`Remaining: ${result.remaining}; continue with offset ${result.next_offset} and this revision.`);
    return lines.join("\n");
  }
}
