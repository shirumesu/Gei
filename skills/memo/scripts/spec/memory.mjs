// MEMORY.md holds typed one-fact entries. The tool checks shape and size, never truth.
// Stored shape (readable and hand-editable on GitHub):
//   ## pitfall
//   - **p3** <head field value>
//     - avoid: ...
// Injection renders the same entries as one compact line each.
import { fail } from "./io.mjs";

const TYPES = {
  rule: { prefix: "r", head: "when", required: ["do", "basis"], optional: ["because", "until", "date"] },
  pitfall: { prefix: "p", head: "when", required: ["avoid", "instead", "basis"], optional: ["because", "until", "date"] },
  env: { prefix: "e", head: "subject", required: ["key", "value", "basis"], optional: ["note", "until", "date"] },
  why: { prefix: "w", head: "choice", required: ["because", "basis"], optional: ["rejected", "until", "date"] },
};
const KEYS = ["host", "ip", "url", "port", "path", "version", "account", "owner", "id", "name", "branch",
  "schedule", "retention", "scope", "cert", "setting", "limit", "location", "command"];
const BASIS = ["user", "observed", "inferred"];
const ENTRY = /^- \*\*([a-z]\d+)\*\* (.+)$/u;
const FIELD = /^ {2}- ([a-z]+): (.*)$/u;
const bytes = value => Buffer.byteLength(value, "utf8");

export class Memory {
  static FILE = "MEMORY.md";
  static TYPES = TYPES;
  static KEYS = KEYS;
  static BASIS = BASIS;
  static FIELD_BYTES = 240;
  static ENTRY_BYTES = 480;
  // Rendered bytes. Both hosts spill hook text near 10 KB, so the whole injection stays below that.
  static BUDGET = { project: 7000, context: 2500 };

  static isPath(docPath) { return /^(projects\/[^/]+\/|context\/)MEMORY\.md$/u.test(docPath); }
  static budget(docPath) { return docPath.startsWith("context/") ? this.BUDGET.context : this.BUDGET.project; }
  static fields(type) { const spec = TYPES[type]; return [spec.head, ...spec.required, ...spec.optional]; }
  // Stored field order after the head line: content first, then provenance.
  static order(type) { const rest = this.fields(type).slice(1).filter(name => !["basis", "until", "date"].includes(name)); return [...rest, "until", "basis", "date"]; }

  static parse(text) {
    const entries = [], errors = [];
    let type = null, current = null;
    for (const [index, raw] of String(text ?? "").replace(/\r\n/gu, "\n").split("\n").entries()) {
      const line = index + 1;
      if (!raw.trim() || /^# /u.test(raw) || /^<!--.*-->$/u.test(raw.trim())) continue;
      const section = /^## (\S+)\s*$/u.exec(raw);
      if (section) {
        type = section[1];
        current = null;
        if (!TYPES[type]) { errors.push({ line, message: `Unknown section "## ${type}". Use ${Object.keys(TYPES).join(", ")}.` }); type = null; }
        continue;
      }
      const entry = ENTRY.exec(raw);
      if (entry) {
        if (!type) { errors.push({ line, message: "Entry outside a type section." }); current = null; continue; }
        current = { id: entry[1], type, [TYPES[type].head]: entry[2].trim(), line };
        entries.push(current);
        continue;
      }
      const field = FIELD.exec(raw);
      if (field && current) {
        if (Object.hasOwn(current, field[1])) errors.push({ line, message: `Field ${field[1]} repeats in ${current.id}.` });
        current[field[1]] = field[2].trim();
        continue;
      }
      errors.push({ line, message: "Expected `## <type>`, `- **<id>** <text>`, or an indented `  - <field>: <value>` line." });
    }
    for (const entry of entries) {
      for (const problem of this.problems(entry)) errors.push({ line: entry.line, id: entry.id, message: problem });
    }
    const seen = new Set();
    for (const entry of entries) {
      if (seen.has(entry.id)) errors.push({ line: entry.line, id: entry.id, message: `Entry id ${entry.id} repeats.` });
      seen.add(entry.id);
    }
    return { entries, errors };
  }

  static problems(entry) {
    const spec = TYPES[entry.type];
    if (!spec) return [`type must be one of ${Object.keys(TYPES).join(", ")}.`];
    const problems = [];
    const allowed = new Set(this.fields(entry.type));
    for (const name of [spec.head, ...spec.required]) {
      if (typeof entry[name] !== "string" || !entry[name].trim()) problems.push(`${entry.type} needs ${name}.`);
    }
    for (const [name, value] of Object.entries(entry)) {
      if (["id", "type", "line"].includes(name)) continue;
      if (!allowed.has(name)) { problems.push(`${entry.type} has no field ${name}; allowed: ${[...allowed].join(", ")}.`); continue; }
      if (typeof value !== "string" || /[\r\n]/u.test(value)) problems.push(`${name} must be one line of text.`);
      else if (bytes(value) > this.FIELD_BYTES) problems.push(`${name} is ${bytes(value)} bytes; the limit is ${this.FIELD_BYTES}. Keep the fact, drop the story.`);
    }
    if (entry.type === "env" && entry.key && !KEYS.includes(entry.key)) problems.push(`env key must be one of ${KEYS.join(", ")}.`);
    if (entry.basis && !BASIS.includes(entry.basis)) problems.push(`basis must be one of ${BASIS.join(", ")}.`);
    if (entry.date && !/^\d{4}-\d{2}(-\d{2})?$/u.test(entry.date)) problems.push("date must be YYYY-MM or YYYY-MM-DD.");
    const size = bytes(this.renderEntry(entry));
    if (!problems.length && size > this.ENTRY_BYTES) problems.push(`The entry renders to ${size} bytes; the limit is ${this.ENTRY_BYTES}. Split it or cut it down.`);
    return problems;
  }

  static format(entries) {
    const lines = ["# Memory", ""];
    for (const type of Object.keys(TYPES)) {
      const group = entries.filter(entry => entry.type === type);
      if (!group.length) continue;
      lines.push(`## ${type}`, "");
      for (const entry of group) {
        lines.push(`- **${entry.id}** ${entry[TYPES[type].head]}`);
        for (const name of this.order(type)) if (entry[name]) lines.push(`  - ${name}: ${entry[name]}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  static renderEntry(entry) {
    const tail = [entry.basis === "inferred" ? "inferred" : "", entry.until ? `until ${entry.until}` : ""].filter(Boolean);
    const marks = tail.length ? ` [${tail.join("; ")}]` : "";
    switch (entry.type) {
      case "rule": return `- ${entry.id} ${entry.when} → ${entry.do}${entry.because ? ` (${entry.because})` : ""}${marks}`;
      case "pitfall": return `- ${entry.id} ${entry.when}: ✗ ${entry.avoid} → ✓ ${entry.instead}${entry.because ? ` (${entry.because})` : ""}${marks}`;
      case "env": return `- ${entry.id} ${entry.subject} · ${entry.key} = ${entry.value}${entry.note ? ` (${entry.note})` : ""}${marks}`;
      case "why": return `- ${entry.id} ${entry.choice} — ${entry.because}${entry.rejected ? `; rejected: ${entry.rejected}` : ""}${marks}`;
      default: return `- ${entry.id}`;
    }
  }

  static render(entries) {
    const blocks = [];
    for (const type of Object.keys(TYPES)) {
      const group = entries.filter(entry => entry.type === type);
      if (group.length) blocks.push([type, ...group.map(entry => this.renderEntry(entry))].join("\n"));
    }
    return blocks.join("\n");
  }

  static renderedBytes(entries) { return bytes(this.render(entries)); }

  static assertValid(docPath, text) {
    const { entries, errors } = this.parse(text);
    if (errors.length) fail("MEMORY_FORMAT", `${docPath} has invalid entries:\n${errors.map(item => `line ${item.line}${item.id ? ` (${item.id})` : ""}: ${item.message}`).join("\n")}`, { applied: false, path: docPath, errors });
    return entries;
  }

  static nextId(entries, type) {
    const prefix = TYPES[type].prefix;
    const numbers = entries.filter(entry => entry.id.startsWith(prefix)).map(entry => Number(entry.id.slice(1)));
    return `${prefix}${Math.max(0, ...numbers) + 1}`;
  }

  static fold(value) { return String(value ?? "").normalize("NFKC").replace(/\s+/gu, " ").trim().toLowerCase(); }

  static same(entry, other) {
    if (entry.type !== other.type) return false;
    if (entry.type === "env") return this.fold(entry.subject) === this.fold(other.subject) && entry.key === other.key;
    const head = TYPES[entry.type].head;
    return this.fold(entry[head]) === this.fold(other[head]);
  }

  // Eviction candidates: inferred, then observed, then user; older or undated first.
  static candidates(entries) {
    const rank = { inferred: 0, observed: 1, user: 2 };
    return [...entries].sort((a, b) => rank[a.basis] - rank[b.basis] || String(a.date || "").localeCompare(String(b.date || "")))
      .slice(0, 8).map(entry => ({ id: entry.id, basis: entry.basis, date: entry.date, text: this.renderEntry(entry) }));
  }

  static applyOperation(entries, edit, error) {
    if (edit.op === "add_entry") {
      const { type, ...fields } = edit.entry;
      if (!TYPES[type]) error("ARGUMENT", `entry.type must be one of ${Object.keys(TYPES).join(", ")}.`);
      const entry = { id: this.nextId(entries, type), type, ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== "")) };
      const problems = this.problems(entry);
      if (problems.length) error("MEMORY_ENTRY", problems.join(" "), { problems });
      const existing = entries.find(other => this.same(entry, other));
      if (existing) error("DUPLICATE_ENTRY", `Entry ${existing.id} already covers this; update it instead of adding another.`, { existing: this.renderEntry(existing) });
      return [...entries, entry];
    }
    const index = entries.findIndex(entry => entry.id === edit.id);
    if (index < 0) error("NOT_FOUND", `No entry ${edit.id} in this memory.`);
    if (edit.op === "remove_entry") return entries.filter((_, at) => at !== index);
    if (Object.hasOwn(edit.fields, "type") || Object.hasOwn(edit.fields, "id")) error("ARGUMENT", "update_entry cannot change id or type; remove the entry and add a new one.");
    const entry = { ...entries[index] };
    for (const [name, value] of Object.entries(edit.fields)) { if (value === "") delete entry[name]; else entry[name] = value; }
    const problems = this.problems(entry);
    if (problems.length) error("MEMORY_ENTRY", problems.join(" "), { problems });
    return entries.map((item, at) => at === index ? entry : item);
  }

  // A save may not grow a memory past its budget; a smaller memory always saves.
  static assertBudget(docPath, before, after) {
    const limit = this.budget(docPath);
    const size = this.renderedBytes(after);
    if (size <= limit || size < this.renderedBytes(before)) return;
    fail("MEMORY_FULL", `${docPath} would render to ${size} bytes; the limit is ${limit}. In this same batch, remove or merge entries (candidates below, weakest basis first) before adding. Do not remove basis=user entries without the user.`,
      { applied: false, path: docPath, bytes: size, limit, candidates: this.candidates(before.length ? before : after) });
  }
}
