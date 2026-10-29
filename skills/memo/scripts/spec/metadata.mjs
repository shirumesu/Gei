// A scope holds MEMORY.md (entries), docs/ (long documents), tasks/ (handoffs), and generated indexes.
// docs and tasks carry YAML frontmatter: a one-line description, plus status for a task.
import { fail } from "./io.mjs";

const STATUSES = ["todo", "doing", "blocked"];

export class Documents {
  static split(docPath) {
    const match = /^(projects\/[^/]+\/|context\/)(.+)$/u.exec(docPath);
    return { scope: match[1], rest: match[2] };
  }

  static kind(docPath) {
    const { rest } = this.split(docPath);
    if (rest === "MEMORY.md") return "memory";
    if (rest === "INDEX.md" || rest === "tasks/INDEX.md") return "index";
    if (/^docs\/.+\.md$/u.test(rest)) return "doc";
    if (/^tasks\/[^/]+\.md$/u.test(rest)) return "task";
    return "legacy";
  }
}

export class Frontmatter {
  static STATUSES = STATUSES;

  static split(content) {
    const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)(?<=\n)---(?:\r?\n|$)/u.exec(content || "");
    if (!match) return { header: "", body: content || "", block: "" };
    return { header: match[0], body: (content || "").slice(match[0].length), block: match[1] };
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

  // Scalar `description` and `status` only; other keys are left as written.
  static scalars(content) {
    const parsed = this.split(content);
    const values = {};
    const repeated = [];
    const multiline = [];
    for (const source of parsed.block.split(/\r?\n/u)) {
      const line = this.stripLineComment(source);
      const key = /^(description|status)\s*:\s*(.*)$/u.exec(line);
      if (!key) continue;
      const [, name, raw] = key;
      if (Object.hasOwn(values, name) && !repeated.includes(name)) repeated.push(name);
      if (!raw.trim() || /^[|>]/u.test(raw.trim())) { multiline.push(name); values[name] = ""; }
      else values[name] = this.unquote(raw);
    }
    return { opened: parsed.header !== "", values, repeated, multiline };
  }

  static problems(docPath, content) {
    const kind = Documents.kind(docPath);
    if (kind === "legacy") return ["Only MEMORY.md, docs/ and tasks/ are writable. Move lasting facts into MEMORY.md entries or docs/, then delete this file."];
    if (kind !== "doc" && kind !== "task") return [];
    const { opened, values, repeated, multiline } = this.scalars(content || "");
    const needs = kind === "task" ? "a one-line description and status (todo, doing, or blocked)" : "a one-line description";
    if (!opened) return [`Add YAML frontmatter with ${needs}.`];
    const problems = [];
    if (repeated.includes("description")) problems.push("Set description once.");
    else if (multiline.includes("description") || !values.description?.trim()) problems.push("Set description to one non-empty line: what the document covers and when to read it.");
    if (kind === "task") {
      if (repeated.includes("status")) problems.push("Set status once.");
      else if (!STATUSES.includes(values.status)) problems.push("Set status to todo, doing, or blocked. A finished task is deleted, not marked done.");
    }
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
