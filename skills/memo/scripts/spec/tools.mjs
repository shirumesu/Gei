import { fail } from "./io.mjs";

const string = description => ({ type: "string", description });
const integer = (description, minimum, maximum) => ({ type: "integer", description, minimum, maximum });
const schema = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const revision = string("Omit for current knowledge. To continue a snapshot, copy the returned revision unchanged; obtain a fresh read if it is unavailable.");
const path = string("Knowledge-relative Markdown path: AGENTS.md, context/MEMORY.md, context/<name>.md, projects/<project>/MEMORY.md, or projects/<project>/<name>.md. Not a local filesystem path or repository URL.");
export const tools = [
  { name: "spec_read", description: "Read known knowledge paths from one snapshot as raw Markdown. The default window starts at line 1; line numbers are physical and match replace_lines. exists=false means absent from this snapshot. Truncated files supply pinned next_read arguments. Consume structuredContent once; text is the equivalent compatibility representation.",
    inputSchema: schema({ paths: { type: "array", items: path, minItems: 1, maxItems: 20, description: 'Required array of 1–20 Markdown file paths. Even one file uses an array: {"paths":["projects/example/MEMORY.md"]}. Batch related files in one call.' }, revision,
      start_line: integer("First physical line, 1-based. Omit to start at line 1. Applies to every requested file. For continuation, use that file's next_line.", 1, 1000000), start_column: integer("Unicode character column on the first selected line, 1-based, default 1; requires start_line. Continue using that file's next_column.", 1, 2000000), max_lines: integer("Maximum lines per file, default 200. A shared output byte budget can truncate earlier; check each file's truncated flag.", 1, 1000),
      line_numbers: { type: "boolean", description: "Default false (document Markdown). Set true for line edits: content is prefixed with line numbers, which are not part of the document." } }, ["paths"]),
    annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_search", description: "List document paths when query is empty, or find literal matching lines. Snippets do not establish document coverage; read relevant bodies before acting. Follow pinned next_search when truncated to enumerate the same snapshot. structuredContent and text represent the same result; use one, not both.",
    inputSchema: schema({ query: string("Case-insensitive literal text, not regex or semantic search. Omit or use an empty string to list paths."), path_prefix: string("Knowledge path prefix, e.g. projects/example/ or context/. Defaults to everything."), revision,
      offset: integer("Default 0. For pagination use next_search, or pass next_offset with the same revision, query and prefix.", 0, 1000000),
      max_results: integer("Maximum matching lines or listed paths, default 30.", 1, 100) }), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_edit", description: "Save a batch of plain Markdown edits against a prior revision. MEMORY.md is a list of one-line memories; a memory longer than a line lives in its own file in the same scope, linked from a MEMORY.md line. AGENTS.md changes only when the user explicitly asks. The tool checks paths and revisions, never content.",
    inputSchema: schema({ base_revision: string("Copy the revision from the read or search that informed this update. A stale revision applies nothing; reread and reconcile rather than merely substituting a newer revision."), summary: string("Concise single-line description of the final change (1–200 characters)."),
      edits: { type: "array", minItems: 1, maxItems: 100, description: "Operations, 1–100 items. Line ranges use the base snapshot; other operations run in order. An invalid operation applies none of the batch.", items: { oneOf: [
        schema({ op: { const: "replace", type: "string", description: "Replace a small, unique exact passage. On NO_MATCH or AMBIGUOUS_MATCH, reread the returned context before retrying." }, path, old_text: string("Nonempty text matching exactly once, including whitespace and line endings."), new_text: string("Replacement text; empty removes the matched text.") }, ["op", "path", "old_text", "new_text"]),
        schema({ op: { const: "replace_lines", type: "string", description: "Replace a larger section after a numbered read. Ranges use physical lines at base_revision; do not mix with other edit operations on the same file." }, path,
          start_line: integer("First line in the base snapshot, inclusive, 1-based.", 1, 1000000), end_line: integer("Last line in the base snapshot, inclusive. Ranges on the same file must not overlap.", 1, 1000000),
          new_text: string("Replacement lines, without number prefixes; empty deletes the range. Uses the replaced block's newline style and ending; one optional final newline is ignored.") }, ["op", "path", "start_line", "end_line", "new_text"]),
        schema({ op: { const: "create", type: "string", description: "Create a missing document; fails if the path exists. A new MEMORY.md creates the project." }, path, content: string("Complete Markdown for the new document.") }, ["op", "path", "content"]),
        schema({ op: { const: "rename", type: "string", description: "Move the complete document. Update links to it in the same batch." }, path, to: string("New knowledge-relative Markdown path; must not already exist.") }, ["op", "path", "to"]),
        schema({ op: { const: "delete", type: "string", description: "Delete an existing document. Remove its MEMORY.md line in the same batch." }, path }, ["op", "path"]),
      ] } } }, ["base_revision", "summary", "edits"]), annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true } },
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
        ? ' Use "paths" instead of "path", even for one file: {"paths":["projects/example/MEMORY.md"]}.' : "";
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
