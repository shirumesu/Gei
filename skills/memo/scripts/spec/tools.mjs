import { fail } from "./io.mjs";

const string = description => ({ type: "string", description });
const integer = (description, minimum, maximum) => ({ type: "integer", description, minimum, maximum });
const schema = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const revision = string("Short revision reference returned by read/search. Copy it unchanged to continue the same snapshot; reread if lost. Omit to read current knowledge.");
const path = string("Knowledge-relative Markdown path, e.g. projects/example/INDEX.md or context/INDEX.md. Use the project route injected at startup; never provide a repository or machine path.");
const prefix = string("Required explicit scope: projects/<project>/, context/, projects/, or all. Ordinary maintenance uses the injected project scope.");
const checkout = string("Optional current code checkout for repository-relative evidence. Never stored in knowledge. Supply only for the corresponding single project.");
const review = schema({ path, outcome: { type: "string", enum: ["verify", "delete", "defer"], description: "Verify confirms the entire resulting document against current evidence, with or without edits. Delete removes it. Defer records missing evidence without renewal." },
  basis: string("Brief verification evidence (may reference evidence in the document), deletion rationale, or missing evidence for deferral."),
  kind: { type: "string", enum: ["knowledge", "handoff", "transient"], description: "Default knowledge (handoff under tasks/). Transient is only for intentionally disposable records." },
  review_days: integer("Review interval, not TTL. Defaults: knowledge 90, handoff 14, transient 30; stable decisions may use 365.", 1, 365),
  scope: schema({ environment: string("Target environment instance returned by check, not the author's machine."), platform: string("Optional platform/version applicability cue.") }, ["environment"]),
  sources: { type: "array", maxItems: 20, items: string("Repository-relative evidence file to baseline from checkout_root; [] clears obsolete baselines.") },
  delete_after: string("Explicit UTC destruction date, allowed only for transient non-INDEX documents. Never infer from review age."),
  deletion_reason: string("Why this transient record is deliberately disposable after that date."),
  clear_delete_after: { type: "boolean", description: "Remove a prior destruction rule." },
}, ["path", "outcome", "basis"]);
export const tools = [
  { name: "spec_check", description: "Return a bounded maintenance worklist with reasons, evidence, incoming references, and a revision. Review age and inactivity never authorize deletion. Read-only knowledge access; local check cadence is cached. Paginate on the same revision for an explicit wider audit.",
    inputSchema: schema({ path_prefix: prefix, revision, offset: integer("Offset; requires revision when nonzero.", 0, 1000000), max_results: integer("Batch size; default 10.", 1, 100), checkout_root: checkout }, ["path_prefix"]), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_gc", description: "Preview deterministic cleanup. Only explicitly expired transient records with unchanged destruction content and no substantive incoming dependency qualify. Applies deletions and plain navigation repairs atomically. No topic/project age deletion. Apply requires the preview's base_revision and authorized cleanup scope.",
    inputSchema: schema({ path_prefix: prefix, base_revision: string("Revision from GC preview; required to apply."), plan_id: string("Plan identifier from GC preview; required to apply, including across deadline changes."), apply: { type: "boolean", description: "Default false: preview only. True executes the preview against its current revision." } }, ["path_prefix"]), annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true } },
  { name: "spec_read", description: "Read up to 20 knowledge documents from one snapshot. Follow injected INDEX links directly to relevant documents. Returns the stored Markdown verbatim (including any unmigrated frontmatter), an opaque revision, and explicit truncation. Missing files are reported and can be created with spec_edit. Continue with revision to keep related reads on the same snapshot.",
    inputSchema: schema({ paths: { type: "array", items: path, minItems: 1, maxItems: 20 }, revision,
      start_line: integer("First line, default 1.", 1, 1000000), start_column: integer("Unicode character column on the first line, default 1. Continue a long line using next_column.", 1, 2000000), max_lines: integer("Lines per file, default 200. Content output is bounded; continue with next_line and next_column on the same revision.", 1, 1000),
      line_numbers: { type: "boolean", description: "Default false (document Markdown). Set true for line edits: content is prefixed with line numbers, which are not part of the document." } }, ["paths"]),
    annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_search", description: "Search document content by literal text (case-insensitive) within a path prefix. Empty query lists document paths. Returns a compact batch of matches and the snapshot revision; narrow the prefix or query when truncated.",
    inputSchema: schema({ query: string("Literal text; default empty to list paths."), path_prefix: string("Knowledge prefix, e.g. projects/example/ or context/. Default projects/."), revision,
      max_results: integer("Maximum matches, default 30.", 1, 100) }), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_edit", description: "Save one knowledge update atomically using a prior read/search revision. Small changes: replace unique exact old_text. Larger changes: read with line_numbers and use replace_lines without copying old content. Read, search and edits use the stored Markdown coordinates. Lifecycle state lives in separate records. Rename moves both; repair affected links in the batch. Line ranges always refer to the base snapshot; never mix them with other operations on the same file. Other operations run in order. A stale revision or invalid operation applies nothing. GitHub success means remote persistence, no push. Reconcile conflicts instead of substituting a newer revision blindly.",
    inputSchema: schema({ base_revision: string("Revision returned by the read/search that informed this update."), summary: string("Concise single-line description of the final change (1–200 characters)."),
      checkout_root: checkout,
      reviews: { type: "array", maxItems: 100, items: review, description: "Optional maintenance outcomes after explicit review. Ordinary edits need no review and never renew whole-document verification. Deletions must repair incoming links in this batch." },
      edits: { type: "array", maxItems: 100, items: { oneOf: [
        schema({ op: { const: "replace", type: "string" }, path, old_text: string("Nonempty, unique exact text to replace."), new_text: string("Replacement text; empty removes the matched text.") }, ["op", "path", "old_text", "new_text"]),
        schema({ op: { const: "replace_lines", type: "string" }, path,
          start_line: integer("First line in the base snapshot, inclusive, 1-based.", 1, 1000000), end_line: integer("Last line in the base snapshot, inclusive. Ranges on the same file must not overlap.", 1, 1000000),
          new_text: string("Replacement lines, without number prefixes; empty deletes the range. Uses the replaced block's newline style and ending; one optional final newline is ignored.") }, ["op", "path", "start_line", "end_line", "new_text"]),
        schema({ op: { const: "create", type: "string" }, path, content: string("Complete Markdown for a new document.") }, ["op", "path", "content"]),
        schema({ op: { const: "rename", type: "string" }, path, to: string("New knowledge-relative Markdown path. Moves lifecycle state without renewing it; repair links in this batch.") }, ["op", "path", "to"]),
        schema({ op: { const: "delete", type: "string" }, path }, ["op", "path"]),
      ] } } }, ["base_revision", "summary"]), annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true } },
  { name: "spec_status", description: "Inspect Spec enablement, storage binding, and last cache/connection status. No network request. Settings are controlled by the bundled CLI; this is not required before ordinary reads or edits.",
    inputSchema: schema({}), annotations: { readOnlyHint: true, openWorldHint: false } },
];

export function validate(value, rule, location = "arguments") {
  if (rule.oneOf) {
    const operation = rule.oneOf.find(candidate => candidate.properties?.op?.const === value?.op);
    if (operation) { validate(value, operation, location); return; }
    const matching = rule.oneOf.filter(candidate => { try { validate(value, candidate, location); return true; } catch { return false; } });
    if (matching.length !== 1) fail("ARGUMENT", `${location} must match one supported operation schema.`);
    return;
  }
  if (rule.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail("ARGUMENT", `${location} must be an object.`);
    for (const key of rule.required || []) if (!Object.hasOwn(value, key)) fail("ARGUMENT", `${location}.${key} is required.`);
    for (const [key, item] of Object.entries(value)) {
      if (!rule.properties[key]) fail("ARGUMENT", `Unknown argument ${location}.${key}.`);
      validate(item, rule.properties[key], `${location}.${key}`);
    }
  } else if (rule.type === "array") {
    if (!Array.isArray(value) || value.length < (rule.minItems || 0) || value.length > (rule.maxItems || Infinity)) fail("ARGUMENT", `${location} has an invalid number of items.`);
    value.forEach((item, index) => validate(item, rule.items, `${location}[${index}]`));
  } else if (rule.type === "integer") {
    if (!Number.isInteger(value) || value < rule.minimum || value > rule.maximum) fail("ARGUMENT", `${location} is out of range.`);
  } else if (typeof value !== rule.type) fail("ARGUMENT", `${location} must be ${rule.type}.`);
  if (rule.const !== undefined && value !== rule.const) fail("ARGUMENT", `${location} must be ${rule.const}.`);
  if (rule.enum && !rule.enum.includes(value)) fail("ARGUMENT", `${location} must be one of ${rule.enum.join(", ")}.`);
}
export async function callTool(store, name, args = {}) {
  const tool = tools.find(item => item.name === name);
  if (!tool) fail("UNKNOWN_TOOL", `Unknown tool: ${name}`);
  validate(args, tool.inputSchema);
  return store[name.slice(5)](args);
}
