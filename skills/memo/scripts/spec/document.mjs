import { fail } from "./io.mjs";

const header = content => /^(\uFEFF?---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/u.exec(content);
const reserved = row => /^gei:/u.test(row);

// All reader-facing coordinates address this view, including search and edit recovery.
export function documentView(content) {
  const match = header(content);
  if (!match) return content;
  const rows = match[2].split(/\r?\n/u);
  if (!rows.some(reserved)) return content;
  const kept = rows.filter(row => !reserved(row));
  const body = content.slice(match[0].length);
  return kept.some(row => row.trim())
    ? match[1] + kept.join(content.includes("\r\n") ? "\r\n" : "\n") + match[3] + body
    : body;
}

export function restoreDocument(original, content) {
  const next = header(content);
  if (next?.[2].split(/\r?\n/u).some(reserved)) fail("CONTENT", "Submit the document content returned by read. Lifecycle changes use the optional reviews parameter.");
  if (original === undefined) return content;
  if (documentView(original) === content) return original;
  const previous = header(original);
  const fields = previous?.[2].split(/\r?\n/u).filter(reserved) || [];
  if (!fields.length) return content;
  const eol = content.includes("\r\n") ? "\r\n" : original.includes("\r\n") ? "\r\n" : "\n";
  if (next) return next[1] + next[2] + eol + fields.join(eol) + next[3] + content.slice(next[0].length);
  return `---${eol}${fields.join(eol)}${eol}---${eol}${content}`;
}
