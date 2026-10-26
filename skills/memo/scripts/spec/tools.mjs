import { fail } from "./io.mjs";

const string = description => ({ type: "string", description });
const integer = (description, minimum, maximum) => ({ type: "integer", description, minimum, maximum });
const schema = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const revision = string("Omit for current knowledge. To continue a snapshot, copy the returned revision unchanged; obtain a fresh read if it is unavailable.");
const path = string("Knowledge-relative Markdown file path from the injected project routes, e.g. projects/example/INDEX.md or context/INDEX.md. Not a local filesystem path or repository URL.");
const prefix = string("Required explicit scope: projects/<project>/, context/, projects/, or all. Ordinary maintenance uses the injected project scope.");
const checkout = string("Local code checkout. spec_check resolves frontmatter sources relative to this directory and compares each source file's last git commit time with the document's. Supply it for one project; this directory is not stored in knowledge.");
export const tools = [
  { name: "spec_check", description: "Inspect mechanical signals in an explicit scope: broken references, topic notes not linked from their topic README, duplicate prose, and source drift. Zero candidates does not establish factual correctness, continued value, or live behavior. With checkout_root, a document whose frontmatter lists sources reports source_changed when a source file's last git commit is newer than the document's, and source_unavailable when that path does not exist. Results never delete knowledge. Follow next_check to continue candidates; paginate spec_search for a complete audit. Knowledge is read-only; check cadence is local state.",
    inputSchema: schema({ path_prefix: prefix, revision, offset: integer("Default 0. For the next batch, copy next_offset from spec_check and pass its revision with the same scope.", 0, 1000000), max_results: integer("Maximum candidates per batch, default 10. Output size may reduce the batch; inspect remaining.", 1, 100), checkout_root: checkout }, ["path_prefix"]), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_read", description: "Read known knowledge paths from one snapshot. Each file starts with an extracted overview, explicit missing-description state, and physical body_start_line, followed by raw Markdown. The default window starts at line 1. body_start_line is the first line after YAML frontmatter when that header exists; all line numbers are physical and match replace_lines. The overview is navigation, not a semantic summary or evidence of coverage. exists=false means absent from this snapshot. Read the body before deciding. Truncated files supply pinned next_read arguments; missing fields or omitted text are not proof that a constraint does not exist. Consume structuredContent once; text is the equivalent compatibility representation.",
    inputSchema: schema({ paths: { type: "array", items: path, minItems: 1, maxItems: 20, description: 'Required array of 1–20 Markdown file paths. Even one file uses an array: {"paths":["projects/example/INDEX.md"]}. Batch related files in one call.' }, revision,
      start_line: integer("First physical line, 1-based. Omit to start at line 1. Applies to every requested file. For continuation, use that file's next_line.", 1, 1000000), start_column: integer("Unicode character column on the first selected line, 1-based, default 1; requires start_line. Continue using that file's next_column.", 1, 2000000), max_lines: integer("Maximum lines per file, default 200. A shared output byte budget can truncate earlier; check each file's truncated flag.", 1, 1000),
      line_numbers: { type: "boolean", description: "Default false (document Markdown). Set true for line edits: content is prefixed with line numbers, which are not part of the document." } }, ["paths"]),
    annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_search", description: "List documents with extracted overviews when query is empty, or find literal matching lines in the full Markdown, including frontmatter. Listings put INDEX and topic owners before notes by explicit path order, not inferred importance. Missing descriptions are reported, never invented. Snippets and overviews do not establish document coverage; read relevant bodies before acting. Follow pinned next_search when truncated to enumerate the same snapshot. structuredContent and text represent the same result; use one, not both.",
    inputSchema: schema({ query: string("Case-insensitive literal text, not regex or semantic search. Omit or use an empty string to list paths."), path_prefix: string("Knowledge path prefix, e.g. projects/example/ or context/. Defaults to projects/ (all projects); prefer the injected project scope."), revision,
      offset: integer("Default 0. For pagination use next_search, or pass next_offset with the same revision, query and prefix.", 0, 1000000),
      max_results: integer("Maximum matching lines or listed paths, default 30.", 1, 100) }), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_edit", description: "Save a batch of knowledge edits against a prior revision. The same save rewrites INDEX.md and tasks/INDEX.md. Do not hand-edit text between the generated markers. Change a catalog line by editing the document description. A heading that is still the placeholder <标题> returns PLACEHOLDER_TITLE.",
    inputSchema: schema({ base_revision: string("Copy the revision from the read/search/check that informed this update. A stale revision applies nothing; reread and reconcile rather than merely substituting a newer revision."), summary: string("Concise single-line description of the final change (1–200 characters)."),
      edits: { type: "array", minItems: 1, maxItems: 100, description: "Document operations, 1–100 items. Line ranges use the base snapshot; other operations run in order. An invalid operation applies none of the batch.", items: { oneOf: [
        schema({ op: { const: "replace", type: "string", description: "Replace a small, unique exact passage. On NO_MATCH or AMBIGUOUS_MATCH, reread the returned context before retrying." }, path, old_text: string("Nonempty text matching exactly once, including whitespace and line endings."), new_text: string("Replacement text; empty removes the matched text.") }, ["op", "path", "old_text", "new_text"]),
        schema({ op: { const: "replace_lines", type: "string", description: "Replace a larger section after a numbered read. Ranges use physical lines at base_revision; do not mix with other edit operations on the same file." }, path,
          start_line: integer("First line in the base snapshot, inclusive, 1-based.", 1, 1000000), end_line: integer("Last line in the base snapshot, inclusive. Ranges on the same file must not overlap.", 1, 1000000),
          new_text: string("Replacement lines, without number prefixes; empty deletes the range. Uses the replaced block's newline style and ending; one optional final newline is ignored.") }, ["op", "path", "start_line", "end_line", "new_text"]),
        schema({ op: { const: "create", type: "string", description: "Create a missing document; fails if the path already exists. Except for a path ending in /INDEX.md, content must start with YAML frontmatter: type, a one-line description, status when type is tasks, and optional sources. DUPLICATE means this project already has a similar title, description, or path; edit that document. existing_paths lists the matches. A topic README or task gains a catalog line in this same save. Sub-notes do not." }, path, content: string("Complete Markdown for a new document. Non-INDEX files include type, a one-line description, status when type is tasks, and optional sources.") }, ["op", "path", "content"]),
        schema({ op: { const: "rename", type: "string", description: "Move the complete document. Generated catalog links update in this save. Repair other incoming links in this batch." }, path, to: string("New knowledge-relative Markdown path; must not already exist.") }, ["op", "path", "to"]),
        schema({ op: { const: "delete", type: "string", description: "Delete an existing document. Its generated catalog line is removed in this save. A done task is not deleted for being done. Repair other incoming links in this batch." }, path }, ["op", "path"]),
      ] } } }, ["base_revision", "summary", "edits"]), annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true } },
  { name: "spec_status", description: "Diagnose Spec setup or connection issues. Returns enabled, storage mode, configured locations and recorded cache/connection state; it does not test live connectivity. Call directly with {} when needed, not as a prerequisite for reads or edits. Change settings through the bundled CLI.",
    inputSchema: schema({}), annotations: { readOnlyHint: true, openWorldHint: false } },
];

export function validate(value, rule, location = "arguments") {
  if (rule.oneOf) {
    const operation = rule.oneOf.find(candidate => candidate.properties?.op && candidate.properties.op.const === value?.op);
    if (operation) { validate(value, operation, location); return; }
    const matching = rule.oneOf.filter(candidate => { try { validate(value, candidate, location); return true; } catch { return false; } });
    if (matching.length !== 1) {
      const operations = rule.oneOf.flatMap(candidate => candidate.properties?.op?.const ? [candidate.properties.op.const] : []);
      fail("ARGUMENT", operations.length ? `${location} must match one supported operation schema. Set op to one of: ${operations.join(", ")}.` : `${location} must match one supported schema.`);
    }
    return;
  }
  if (rule.type === "null") { if (value !== null) fail("ARGUMENT", `${location} must be null.`); return; }
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
    if (!Array.isArray(value)) fail("ARGUMENT", `${location} must be an array${rule.items?.type ? ` of ${rule.items.type} items` : ""}; wrap a single item in [].`);
    if (value.length < (rule.minItems || 0) || value.length > (rule.maxItems || Infinity)) fail("ARGUMENT", `${location} must contain ${rule.minItems || 0}–${rule.maxItems || Infinity} items; received ${value.length}.`);
    value.forEach((item, index) => validate(item, rule.items, `${location}[${index}]`));
  } else if (rule.type === "integer") {
    if (!Number.isInteger(value)) fail("ARGUMENT", `${location} must be an integer.`);
    if (value < rule.minimum || value > rule.maximum) fail("ARGUMENT", `${location} must be between ${rule.minimum} and ${rule.maximum}; received ${value}.`);
  } else if (typeof value !== rule.type) fail("ARGUMENT", `${location} must be ${rule.type}.`);
  if (rule.type === "string" && ((rule.minLength !== undefined && Array.from(value).length < rule.minLength) || (rule.maxLength !== undefined && Array.from(value).length > rule.maxLength))) fail("ARGUMENT", `${location} must contain ${rule.minLength || 0}–${rule.maxLength || "unlimited"} characters; keep detailed evidence in its owning document.`);
  if (rule.const !== undefined && value !== rule.const) fail("ARGUMENT", `${location} must be ${rule.const}.`);
  if (rule.enum && !rule.enum.includes(value)) fail("ARGUMENT", `${location} must be one of ${rule.enum.join(", ")}.`);
}
export async function callTool(store, name, args = {}) {
  const tool = tools.find(item => item.name === name);
  if (!tool) fail("UNKNOWN_TOOL", `Unknown tool: ${name}`);
  validate(args, tool.inputSchema);
  return store[name.slice(5)](args);
}
