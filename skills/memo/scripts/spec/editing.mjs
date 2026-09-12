import { fail } from "./io.mjs";

export function editHelp(text, edit, revision) {
  const lines = (text || "").split(/\r?\n/u);
  const anchor = edit.old_text?.split(/\r?\n/u).find(line => line.trim())?.trim();
  const match = anchor ? lines.findIndex(line => line.includes(anchor)) : -1;
  const start = Math.max(1, Math.min(lines.length, (match >= 0 ? match + 1 : edit.start_line || 1)) - 2);
  let context = "";
  for (let index = start - 1; index < Math.min(lines.length, start + 7); index++) {
    let line = `${index + 1}: `;
    for (const char of Array.from(lines[index])) {
      if (Buffer.byteLength(line + char) > 280) { line += "…"; break; }
      line += char;
    }
    context += (context ? "\n" : "") + line;
  }
  return { context, context_stage: "base", read: { paths: [edit.path], revision, start_line: start, max_lines: 12, line_numbers: true } };
}

// All ranges address the immutable base. Apply from the bottom so earlier changes cannot shift them.
export function rangeReplacements(files, edits, revision) {
  const groups = new Map();
  edits.forEach((edit, index) => {
    if (edit.op === "replace_lines") {
      if (!groups.has(edit.path)) groups.set(edit.path, []);
      groups.get(edit.path).push({ ...edit, index });
    }
  });
  const replacements = new Map();
  for (const [name, ranges] of groups) {
    const text = files[name];
    const invalid = (edit, message) => fail("RANGE", message, { applied: false, edit_index: edit.index, path: name, ...editHelp(text, edit, revision) });
    if (typeof text !== "string") invalid(ranges[0], "Read an existing document before replacing lines.");
    if (edits.some(edit => edit.path === name && edit.op !== "replace_lines")) invalid(ranges[0], "Do not mix line ranges with other operations on the same document in one batch.");
    const lines = text.split("\n");
    const starts = [0];
    for (let i = 0; i < lines.length - 1; i++) starts.push(starts[i] + lines[i].length + 1);
    ranges.sort((a, b) => a.start_line - b.start_line);
    for (const [index, edit] of ranges.entries()) {
      if (!Number.isInteger(edit.start_line) || !Number.isInteger(edit.end_line) || edit.start_line < 1 || edit.end_line < edit.start_line || edit.end_line > lines.length || typeof edit.new_text !== "string") {
        invalid(edit, `Use an inclusive line range between 1 and ${lines.length}, and a string new_text.`);
      }
      if (index && edit.start_line <= ranges[index - 1].end_line) invalid(edit, "Line ranges in one document must not overlap.");
    }
    let result = text;
    for (const edit of ranges.reverse()) {
      const start = starts[edit.start_line - 1], end = starts[edit.end_line] ?? text.length;
      const original = text.slice(start, end);
      const eol = original.match(/\r?\n/u)?.[0] || text.match(/\r?\n/u)?.[0] || "\n";
      const body = edit.new_text.replace(/\r?\n$/u, "").replace(/\r?\n/gu, eol);
      const replacement = edit.new_text === "" ? "" : body + (original.endsWith("\n") ? eol : "");
      result = result.slice(0, start) + replacement + result.slice(end);
    }
    replacements.set(name, result);
  }
  return replacements;
}
