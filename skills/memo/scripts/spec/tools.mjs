import { fail } from "./io.mjs";
import { Memory } from "./memory.mjs";

const string = description => ({ type: "string", description });
const integer = (description, minimum, maximum) => ({ type: "integer", description, minimum, maximum });
const schema = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const revision = string("Omit for current knowledge. To continue a snapshot, copy the returned revision unchanged; obtain a fresh read if it is unavailable.");
const path = string("Knowledge-relative Markdown path, e.g. projects/example/MEMORY.md, projects/example/docs/release.md, or context/MEMORY.md. Not a local filesystem path or repository URL.");
const FIELD_NAMES = [...new Set(Object.keys(Memory.TYPES).flatMap(type => Memory.fields(type)))];
const entryFields = Object.fromEntries(FIELD_NAMES.map(name => [name, string(name === "key" ? `env only: one of ${Memory.KEYS.join(", ")}.` : name === "basis" ? "user (the user said it), observed (seen in this work), or inferred (agent reasoning, not confirmed)." : name === "until" ? "Optional retirement condition; delete the entry once it holds." : name === "date" ? "Optional YYYY-MM or YYYY-MM-DD when the fact was established." : `One line, at most ${Memory.FIELD_BYTES} bytes.`)]));
const memoryPath = string("The scope's memory file: projects/<project>/MEMORY.md or context/MEMORY.md.");
export const tools = [
  { name: "spec_read", description: "Read known knowledge paths from one snapshot. Each file starts with an extracted overview, explicit missing-description state, and physical body_start_line, followed by raw Markdown. The default window starts at line 1. body_start_line is the first line after YAML frontmatter when that header exists; all line numbers are physical and match replace_lines. The overview is navigation, not a semantic summary or evidence of coverage. exists=false means absent from this snapshot. Read the body before deciding. Truncated files supply pinned next_read arguments; missing fields or omitted text are not proof that a constraint does not exist. Consume structuredContent once; text is the equivalent compatibility representation.",
    inputSchema: schema({ paths: { type: "array", items: path, minItems: 1, maxItems: 20, description: 'Required array of 1–20 Markdown file paths. Even one file uses an array: {"paths":["projects/example/MEMORY.md"]}. Batch related files in one call.' }, revision,
      start_line: integer("First physical line, 1-based. Omit to start at line 1. Applies to every requested file. For continuation, use that file's next_line.", 1, 1000000), start_column: integer("Unicode character column on the first selected line, 1-based, default 1; requires start_line. Continue using that file's next_column.", 1, 2000000), max_lines: integer("Maximum lines per file, default 200. A shared output byte budget can truncate earlier; check each file's truncated flag.", 1, 1000),
      line_numbers: { type: "boolean", description: "Default false (document Markdown). Set true for line edits: content is prefixed with line numbers, which are not part of the document." } }, ["paths"]),
    annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_search", description: "List documents with extracted overviews when query is empty, or find literal matching lines in the full Markdown, including frontmatter. Listings put MEMORY.md and INDEX.md before docs and tasks. Missing descriptions are reported, never invented. Snippets and overviews do not establish document coverage; read relevant bodies before acting. Follow pinned next_search when truncated to enumerate the same snapshot. structuredContent and text represent the same result; use one, not both.",
    inputSchema: schema({ query: string("Case-insensitive literal text, not regex or semantic search. Omit or use an empty string to list paths."), path_prefix: string("Knowledge path prefix, e.g. projects/example/ or context/. Defaults to projects/ (all projects); prefer the injected project scope."), revision,
      offset: integer("Default 0. For pagination use next_search, or pass next_offset with the same revision, query and prefix.", 0, 1000000),
      max_results: integer("Maximum matching lines or listed paths, default 30.", 1, 100) }), annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: "spec_edit", description: "Save a batch of knowledge edits against a prior revision. Memory entries use add_entry/update_entry/remove_entry on <scope>MEMORY.md; the tool checks shape and size, never truth. MEMORY_FULL means the memory is at its byte budget: remove or merge entries in the same batch. docs/ and tasks/ documents use the text operations and need a one-line description (tasks also status todo|doing|blocked). INDEX.md and tasks/INDEX.md are regenerated in the same save and cannot be edited.",
    inputSchema: schema({ base_revision: string("Copy the revision from the read or search that informed this update. A stale revision applies nothing; reread and reconcile rather than merely substituting a newer revision."), summary: string("Concise single-line description of the final change (1–200 characters)."),
      edits: { type: "array", minItems: 1, maxItems: 100, description: "Operations, 1–100 items. Line ranges use the base snapshot; other operations run in order. An invalid operation applies none of the batch.", items: { oneOf: [
        schema({ op: { const: "replace", type: "string", description: "Replace a small, unique exact passage. On NO_MATCH or AMBIGUOUS_MATCH, reread the returned context before retrying." }, path, old_text: string("Nonempty text matching exactly once, including whitespace and line endings."), new_text: string("Replacement text; empty removes the matched text.") }, ["op", "path", "old_text", "new_text"]),
        schema({ op: { const: "replace_lines", type: "string", description: "Replace a larger section after a numbered read. Ranges use physical lines at base_revision; do not mix with other edit operations on the same file." }, path,
          start_line: integer("First line in the base snapshot, inclusive, 1-based.", 1, 1000000), end_line: integer("Last line in the base snapshot, inclusive. Ranges on the same file must not overlap.", 1, 1000000),
          new_text: string("Replacement lines, without number prefixes; empty deletes the range. Uses the replaced block's newline style and ending; one optional final newline is ignored.") }, ["op", "path", "start_line", "end_line", "new_text"]),
        schema({ op: { const: "create", type: "string", description: "Create a missing docs/<name>.md or tasks/<name>.md; fails if the path exists. Content starts with YAML frontmatter: a one-line description (what it covers and when to read it), plus status for a task. Its INDEX line appears in this save." }, path, content: string("Complete Markdown for the new document, frontmatter included.") }, ["op", "path", "content"]),
        schema({ op: { const: "rename", type: "string", description: "Move the complete document; generated INDEX links update in this save." }, path, to: string("New knowledge-relative Markdown path; must not already exist.") }, ["op", "path", "to"]),
        schema({ op: { const: "delete", type: "string", description: "Delete an existing document. Delete a finished task in the batch that saves its lasting conclusions as entries." }, path }, ["op", "path"]),
        schema({ op: { const: "add_entry", type: "string", description: "Add one entry. The id is assigned. DUPLICATE_ENTRY means an entry already has the same rule when+do, pitfall when+avoid, why choice, or env subject+key: update it." }, path: memoryPath,
          entry: schema({ type: { type: "string", enum: Object.keys(Memory.TYPES), description: "rule {when, do}, pitfall {when, avoid, instead}, env {subject, key, value}, why {choice, because}; all need basis. Optional: because (rule, pitfall), note (env), rejected (why), until, date." }, ...entryFields }, ["type", "basis"]) }, ["op", "path", "entry"]),
        schema({ op: { const: "update_entry", type: "string", description: "Change fields of one entry by id. An empty string removes an optional field." }, path: memoryPath, id: string("Entry id such as p3."),
          fields: schema(entryFields) }, ["op", "path", "id", "fields"]),
        schema({ op: { const: "remove_entry", type: "string", description: "Remove one entry by id." }, path: memoryPath, id: string("Entry id such as p3.") }, ["op", "path", "id"]),
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
