// Frontmatter is ordinary YAML the author writes. Lifecycle state is not stored here.
import { fail } from "./io.mjs";

const TYPES = ["facts", "decisions", "runbooks", "log", "tasks"];
const STATUSES = ["todo", "doing", "blocked", "done"];

export class Frontmatter {
  static typeOrder() {
    return TYPES.slice();
  }

  static split(content) {
    const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)(?<=\n)---(?:\r?\n|$)/u.exec(content || "");
    if (!match) return { header: "", body: content || "", block: "" };
    return { header: match[0], body: (content || "").slice(match[0].length), block: match[1] };
  }

  // A leftover `gei:` line is ordinary text for edits. Link scans still skip it so
  // old JSON paths are not reported as references.
  static maskGei(content) {
    return String(content).replace(/^gei:[^\n]*(?:\n[ \t]+[^\n]*)*/gmu, match => match.replace(/[^\n]/gu, " "));
  }

  // Every generated catalog, including tasks/INDEX.md, skips frontmatter.
  static exempt(docPath) {
    return typeof docPath === "string" && docPath.endsWith("/INDEX.md");
  }

  static unquote(value) {
    const trimmed = String(value).trim();
    if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) return trimmed.slice(1, -1);
    return trimmed;
  }

  // A trailing comment is ` #...` outside quotes. `C#` and `"PR #4060"` stay intact.
  static stripLineComment(line) {
    let quote = "";
    let escaped = false;
    const chars = Array.from(line);
    for (let index = 0; index < chars.length; index++) {
      const char = chars[index];
      if (escaped) { escaped = false; continue; }
      if (quote === '"' && char === "\\") { escaped = true; continue; }
      if (quote) { if (char === quote) quote = ""; continue; }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === "#" && index > 0 && /[ \t]/u.test(chars[index - 1])) return chars.slice(0, index).join("").replace(/[ \t]+$/u, "");
    }
    return line;
  }


  // Scalar `type`, `description`, and `status` only. `sources` stays with SourceDrift.
  static scalars(content) {
    const parsed = this.split(content);
    const watched = new Set(["type", "description", "status"]);
    const values = {};
    const repeated = [];
    const multiline = [];
    for (const source of parsed.block.split(/\r?\n/u)) {
      const line = this.stripLineComment(source);
      if (/^[ \t]*#/u.test(line) || /^[ \t]*$/u.test(line)) continue;
      const key = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/u.exec(line);
      if (!key || !watched.has(key[1])) continue;
      const name = key[1];
      const raw = key[2].trim();
      if (Object.hasOwn(values, name)) {
        if (!repeated.includes(name)) repeated.push(name);
      }
      if (!raw || /^[|>]/u.test(raw)) {
        multiline.push(name);
        values[name] = "";
      } else values[name] = this.unquote(raw);
    }
    return { opened: parsed.header !== "", values, repeated, multiline };
  }

  static problems(docPath, content) {
    if (this.exempt(docPath)) return [];
    const { opened, values, repeated, multiline } = this.scalars(content || "");
    if (!opened) return ["Add YAML frontmatter with type (facts, decisions, runbooks, log, or tasks) and a one-line description."];
    const problems = [];
    if (repeated.includes("type")) problems.push("Set type once.");
    else if (!Object.hasOwn(values, "type") || values.type.trim() === "") problems.push("Add type: facts, decisions, runbooks, log, or tasks.");
    else if (!TYPES.includes(values.type)) problems.push("Set type to one of facts, decisions, runbooks, log, tasks.");
    if (repeated.includes("description")) problems.push("Set description once.");
    else if (!Object.hasOwn(values, "description")) problems.push("Add a one-line description.");
    else if (multiline.includes("description") || values.description.trim() === "") problems.push("Set description to one non-empty line.");
    if (repeated.includes("status")) problems.push("Set status once.");
    else if (multiline.includes("status") || (Object.hasOwn(values, "status") && !STATUSES.includes(values.status))) problems.push("Set status to one of todo, doing, blocked, done.");
    else if (values.type === "tasks" && !STATUSES.includes(values.status)) problems.push("Add status: todo, doing, blocked, or done.");
    return problems;
  }

  static assertChanged(files, paths) {
    const documents = [];
    for (const docPath of [...paths].sort()) {
      const problems = this.problems(docPath, files[docPath]);
      if (problems.length) documents.push({ path: docPath, problems });
    }
    if (!documents.length) return;
    fail("FRONTMATTER", documents.map(item => `${item.path}: ${item.problems.join(" ")}`).join("\n"), { applied: false, documents });
  }
}
