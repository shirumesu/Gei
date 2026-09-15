import { fail } from "./io.mjs";

const string = description => ({ type: "string", description });
const integer = (description, minimum, maximum) => ({ type: "integer", description, minimum, maximum });
const schema = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const revision = string("Omit for current knowledge. To continue a snapshot, copy the returned revision unchanged; obtain a fresh read if it is unavailable.");
const path = string("Knowledge-relative Markdown file path from the injected project routes, e.g. projects/example/INDEX.md or context/INDEX.md. Not a local filesystem path or repository URL.");
const prefix = string("Required explicit scope: projects/<project>/, context/, projects/, or all. Ordinary maintenance uses the injected project scope.");
const checkout = string("Local code checkout directory for checking or baselining repository-relative sources. Supply for the corresponding single project; this directory is not stored in knowledge.");
const review = schema({ path, outcome: { type: "string", enum: ["verify", "delete", "defer"], description: "verify: confirm the entire resulting document against evidence. delete: remove it and repair incoming links in this batch. defer: record missing evidence without renewal; supply only path, outcome and basis." },
  basis: string("Brief verification evidence (may reference evidence in the document), deletion rationale, or missing evidence for deferral."),
  kind: { type: "string", enum: ["knowledge", "handoff", "transient"], description: "Omit to preserve existing kind; new records default to handoff under tasks/, otherwise knowledge. Use transient only for intentionally disposable records." },
  review_days: integer("Days until review, not deletion. Omit to preserve the interval when kind is unchanged; new or changed kinds default to knowledge 90, handoff 14, transient 30.", 1, 365),
  scope: { ...schema({ environment: string("Copy environment from spec_check for this scope."), platform: string("Optional platform/version applicability cue.") }, ["environment"]), description: "Optional applicability scope for verification. Omit to preserve the existing scope." },
  sources: { type: "array", maxItems: 20, description: "Evidence files to baseline during verification; requires checkout_root for nonempty arrays. Omit to preserve baselines; [] clears them.", items: string("File path relative to checkout_root, e.g. hooks/knowledge.mjs.") },
  delete_after: string("Explicit UTC destruction date, allowed only for transient non-INDEX documents. Never infer from review age."),
  deletion_reason: string("Required with delete_after: why this transient record is deliberately disposable after that date."),
  clear_delete_after: { type: "boolean", description: "Set true during verification to remove a prior destruction rule; omit delete_after when clearing." },
}, ["path", "outcome", "basis"]);
export const tools = [
  { name: "spec_check", description: "Find documents needing maintenance within an explicit knowledge scope. Returns candidate results with reasons, evidence, incoming references, next actions, environment and revision; candidates require review, and age alone never authorizes deletion. For a wider audit, continue with next_offset and the same revision while remaining > 0. Knowledge is read-only; local check cadence is cached.",
    inputSchema: schema({ path_prefix: prefix, revision, offset: integer("Default 0. For the next batch, copy next_offset from spec_check and pass its revision with the same scope.", 0, 1000000), max_results: integer("Maximum candidates per batch, default 10. Output size may reduce the batch; inspect remaining.", 1, 100), checkout_root: checkout }, ["path_prefix"]), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_gc", description: "Preview cleanup of explicitly expired transient documents. Returns proposed deleted paths, navigation repairs, blocked items, revision and plan_id; preview applies nothing. Only unchanged destruction content without substantive incoming dependencies qualifies. With authorized cleanup scope, apply the same preview atomically; on REVISION_CONFLICT or PLAN_CHANGED, preview again before deciding to retry.",
    inputSchema: schema({ path_prefix: prefix, base_revision: string("When apply is true, copy revision from the GC preview into this field."), plan_id: string("When apply is true, copy plan_id from the same GC preview unchanged."), apply: { type: "boolean", description: "Default false: preview only. Set true with the preview's path_prefix, base_revision and plan_id to execute cleanup." } }, ["path_prefix"]), annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true } },
  { name: "spec_read", description: "Read known knowledge paths together from one snapshot; follow injected INDEX links directly. Returns revision and files with stored Markdown content, exists and per-file truncation. exists=false means absent from that snapshot. For each truncated file, read its path again on the same revision, passing its next_line as start_line and next_column as start_column.",
    inputSchema: schema({ paths: { type: "array", items: path, minItems: 1, maxItems: 20, description: 'Required array of 1–20 Markdown file paths. Even one file uses an array: {"paths":["projects/example/INDEX.md"]}. Batch related files in one call.' }, revision,
      start_line: integer("First line, 1-based, default 1; applies to every requested file. For continuation, use that file's next_line.", 1, 1000000), start_column: integer("Unicode character column on the first selected line, 1-based, default 1; applies to every requested file. Continue using that file's next_column.", 1, 2000000), max_lines: integer("Maximum lines per file, default 200. A shared output byte budget can truncate earlier; check each file's truncated flag.", 1, 1000),
      line_numbers: { type: "boolean", description: "Default false (document Markdown). Set true for line edits: content is prefixed with line numbers, which are not part of the document." } }, ["paths"]),
    annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_search", description: "Find knowledge paths or matching lines within a path prefix. Returns revision and results: paths for an empty query, or path/line/text snippets for a text query. Read relevant paths with spec_read for full context; snippets may be truncated. If top-level truncated is true, narrow the prefix or query; there is no search cursor.",
    inputSchema: schema({ query: string("Case-insensitive literal text, not regex or semantic search. Omit or use an empty string to list paths."), path_prefix: string("Knowledge path prefix, e.g. projects/example/ or context/. Defaults to projects/ (all projects); prefer the injected project scope."), revision,
      max_results: integer("Maximum matching lines or listed paths, default 30.", 1, 100) }), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_edit", description: "Save a batch of knowledge edits and optional maintenance reviews against a prior revision. Use unique exact replace for small passages, or numbered reads plus base-relative replace_lines for sections; do not mix range and other edits on one file. Repair incoming links when moving or deleting. Ordinary edits preserve lifecycle state; reviews maintain it. Returns applied, revision and changed paths; applied=false with unchanged=true is a successful no-op. GitHub success is remote persistence. On REVISION_CONFLICT, reread and reconcile; on SUBMISSION_UNCONFIRMED, read current documents before retrying because the write may have persisted.",
    inputSchema: schema({ base_revision: string("Copy the revision from the read/search/check that informed this update. A stale revision applies nothing; reread and reconcile rather than merely substituting a newer revision."), summary: string("Concise single-line description of the final change (1–200 characters)."),
      checkout_root: checkout,
      reviews: { type: "array", maxItems: 100, items: review, description: "Optional evidence-based maintenance, at most one review per document, applied after edits. Ordinary edits need no review. Supply 1–100 items across edits and reviews combined." },
      edits: { type: "array", maxItems: 100, description: "Document operations; supply 1–100 items across edits and reviews combined. Line ranges use the base snapshot; other operations run in order. An invalid operation applies none of the batch.", items: { oneOf: [
        schema({ op: { const: "replace", type: "string", description: "Replace a small, unique exact passage. On NO_MATCH or AMBIGUOUS_MATCH, reread the returned context before retrying." }, path, old_text: string("Nonempty text matching exactly once, including whitespace and line endings."), new_text: string("Replacement text; empty removes the matched text.") }, ["op", "path", "old_text", "new_text"]),
        schema({ op: { const: "replace_lines", type: "string", description: "Replace a larger section after a numbered read. Ranges use stored Markdown lines at base_revision; do not mix with other edit operations on the same file." }, path,
          start_line: integer("First line in the base snapshot, inclusive, 1-based.", 1, 1000000), end_line: integer("Last line in the base snapshot, inclusive. Ranges on the same file must not overlap.", 1, 1000000),
          new_text: string("Replacement lines, without number prefixes; empty deletes the range. Uses the replaced block's newline style and ending; one optional final newline is ignored.") }, ["op", "path", "start_line", "end_line", "new_text"]),
        schema({ op: { const: "create", type: "string", description: "Create a missing document; fails if the path already exists." }, path, content: string("Complete Markdown for a new document.") }, ["op", "path", "content"]),
        schema({ op: { const: "rename", type: "string", description: "Move the complete document and lifecycle state; repair affected incoming links in this batch." }, path, to: string("New knowledge-relative Markdown path; must not already exist.") }, ["op", "path", "to"]),
        schema({ op: { const: "delete", type: "string", description: "Delete an existing document and its lifecycle state; repair incoming links in this batch." }, path }, ["op", "path"]),
      ] } } }, ["base_revision", "summary"]), annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true } },
  { name: "spec_status", description: "Diagnose Spec setup or connection issues. Returns enabled, storage mode, configured locations and recorded cache/connection state; it does not test live connectivity. Call directly with {} when needed, not as a prerequisite for reads or edits. Change settings through the bundled CLI.",
    inputSchema: schema({}), annotations: { readOnlyHint: true, openWorldHint: false } },
];

export function validate(value, rule, location = "arguments") {
  if (rule.oneOf) {
    const operation = rule.oneOf.find(candidate => candidate.properties?.op?.const === value?.op);
    if (operation) { validate(value, operation, location); return; }
    const matching = rule.oneOf.filter(candidate => { try { validate(value, candidate, location); return true; } catch { return false; } });
    if (matching.length !== 1) fail("ARGUMENT", `${location} must match one supported operation schema. Set op to one of: ${rule.oneOf.map(candidate => candidate.properties.op.const).join(", ")}.`);
    return;
  }
  if (rule.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail("ARGUMENT", `${location} must be an object.`);
    for (const key of rule.required || []) if (!Object.hasOwn(value, key)) {
      const expected = rule.properties[key];
      const hint = key === "paths" && Object.hasOwn(value, "path") && !rule.properties.path
        ? ' Use "paths" instead of "path", even for one file: {"paths":["projects/example/INDEX.md"]}.' : "";
      fail("ARGUMENT", `${location}.${key} is required (${expected.type}).${hint}`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (!rule.properties[key]) fail("ARGUMENT", `Unknown argument ${location}.${key}. Supported fields: ${Object.keys(rule.properties).join(", ") || "none"}.`);
      validate(item, rule.properties[key], `${location}.${key}`);
    }
  } else if (rule.type === "array") {
    if (!Array.isArray(value)) fail("ARGUMENT", `${location} must be an array${rule.items.type ? ` of ${rule.items.type} items` : ""}; wrap a single item in [].`);
    if (value.length < (rule.minItems || 0) || value.length > (rule.maxItems || Infinity)) fail("ARGUMENT", `${location} must contain ${rule.minItems || 0}–${rule.maxItems || Infinity} items; received ${value.length}.`);
    value.forEach((item, index) => validate(item, rule.items, `${location}[${index}]`));
  } else if (rule.type === "integer") {
    if (!Number.isInteger(value)) fail("ARGUMENT", `${location} must be an integer.`);
    if (value < rule.minimum || value > rule.maximum) fail("ARGUMENT", `${location} must be between ${rule.minimum} and ${rule.maximum}; received ${value}.`);
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
