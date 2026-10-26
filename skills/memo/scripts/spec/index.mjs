// Project and shared INDEX catalogs. One line per valid document, grouped by type.
// Text outside the markers is the hand-written header and is left in place.
// Injection still clips the comment-stripped body at PROJECT_BODY_BYTES / SHARED_BODY_BYTES.
import path from "node:path";
import { Frontmatter } from "./metadata.mjs";
import { DuplicateGuard } from "./retrieval.mjs";

export class ProjectIndex {
  static START = "<!-- gei:index start -->";
  static END = "<!-- gei:index end -->";
  static PROJECT_BODY_BYTES = 3072;
  static SHARED_BODY_BYTES = 1024;

  static scope(docPath) {
    return DuplicateGuard.scope(docPath);
  }

  static indexPath(scope) {
    return `${scope}INDEX.md`;
  }

  static bodyBudget(indexPath) {
    return indexPath === "context/INDEX.md" ? this.SHARED_BODY_BYTES : this.PROJECT_BODY_BYTES;
  }

  // Same bytes the SessionStart hook injects: body after YAML frontmatter, comments removed.
  static injectedBody(content) {
    return Frontmatter.split(content || "").body.replace(/<!--[\s\S]*?-->/gu, "").trim();
  }

  static bodyBytes(content) {
    return Buffer.byteLength(this.injectedBody(content), "utf8");
  }

  static newline(content) {
    return typeof content === "string" && content.includes("\r\n") ? "\r\n" : "\n";
  }

  static consumeNewline(tail) {
    if (tail.startsWith("\r\n")) return tail.slice(2);
    if (tail.startsWith("\n")) return tail.slice(1);
    return tail;
  }

  static lineValue(value) {
    return String(value).replace(/<!--/gu, "<!-").replace(/\s+/gu, " ").trim();
  }

  static linkTitle(value) {
    const cleaned = String(value).replace(/[\[\]]/gu, "").replace(/\s+/gu, " ").trim();
    return cleaned || "document";
  }

  static titleFor(docPath, content) {
    const stem = docPath.slice(docPath.lastIndexOf("/") + 1).replace(/\.md$/iu, "");
    return this.linkTitle(DuplicateGuard.title(content) || stem);
  }

  static href(indexPath, docPath) {
    const relative = path.posix.relative(path.posix.dirname(indexPath), docPath);
    return /[()\s]/u.test(relative) ? `<${relative}>` : relative;
  }

  static header(indexPath, eol) {
    const title = indexPath === "context/INDEX.md" ? "Shared" : "Project";
    return `# ${title}${eol}${eol}Purpose:${eol}Agreements:${eol}${eol}`;
  }

  static entries(files, scope) {
    const indexPath = this.indexPath(scope);
    const order = new Map(Frontmatter.typeOrder().map((type, index) => [type, index]));
    const items = [];
    for (const name of Object.keys(files).sort()) {
      const content = files[name];
      if (typeof content !== "string" || !name.startsWith(scope) || !name.endsWith(".md") || name.endsWith("/INDEX.md")) continue;
      if (Frontmatter.problems(name, content).length) continue;
      const { values } = Frontmatter.scalars(content);
      const description = this.lineValue(values.description || "");
      if (!order.has(values.type) || !description) continue;
      items.push({
        path: name,
        type: values.type,
        description,
        title: this.titleFor(name, content),
        href: this.href(indexPath, name),
      });
    }
    items.sort((left, right) => order.get(left.type) - order.get(right.type) || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
    return items;
  }

  static block(entries, eol) {
    const lines = [];
    let type = "";
    for (const entry of entries) {
      if (entry.type !== type) {
        if (lines.length) lines.push("");
        lines.push(`## ${entry.type}`, "");
        type = entry.type;
      }
      lines.push(`- [${entry.title}](${entry.href}): ${entry.description}`);
    }
    const body = lines.length ? `${lines.join(eol)}${eol}` : "";
    return `${this.START}${eol}${body}${this.END}${eol}`;
  }

  static compose(indexPath, previous, entries) {
    const eol = this.newline(previous);
    const block = this.block(entries, eol);
    if (typeof previous !== "string") return this.header(indexPath, eol) + block;
    const startAt = previous.indexOf(this.START);
    const endAt = previous.lastIndexOf(this.END);
    if (startAt >= 0 && endAt >= startAt) {
      let head = previous.slice(0, startAt);
      const tail = this.consumeNewline(previous.slice(endAt + this.END.length));
      if (head && !head.endsWith("\n")) head += eol;
      return head + block + tail;
    }
    let head = previous.split(this.START).join("").split(this.END).join("");
    if (head && !head.endsWith("\n")) head += eol;
    if (head.trim() && !head.endsWith(`${eol}${eol}`)) head += eol;
    return head + block;
  }

  static scopesTouched(before, after) {
    const scopes = new Set();
    for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const had = Object.hasOwn(before, name);
      const has = Object.hasOwn(after, name);
      if (had && has && before[name] === after[name]) continue;
      if (!/^(?:projects\/[^/]+\/|context\/).+\.md$/u.test(name)) continue;
      scopes.add(this.scope(name));
    }
    return [...scopes].sort();
  }

  // `before` supplies the header when this batch deleted INDEX.md but documents remain.
  static apply(files, before, scopes) {
    for (const scope of scopes) {
      const indexPath = this.indexPath(scope);
      const entries = this.entries(files, scope);
      const kept = Object.hasOwn(files, indexPath);
      if (!kept && !entries.length) continue;
      const base = kept ? files[indexPath] : before[indexPath];
      const next = this.compose(indexPath, base, entries);
      if (files[indexPath] !== next) files[indexPath] = next;
    }
  }
}
