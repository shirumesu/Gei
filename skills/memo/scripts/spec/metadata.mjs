// Frontmatter is ordinary YAML the author writes. Lifecycle state is not stored here.
export class Frontmatter {
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
}
