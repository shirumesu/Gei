// Project and shared INDEX catalogs.
// INDEX.md lists topic READMEs, then at most TASKS_IN_INDEX tasks.
// tasks/INDEX.md lists every task and is not injected.
// Text outside the markers is the hand-written header and is left in place.
// Injection still clips the comment-stripped INDEX.md body at PROJECT_BODY_BYTES / SHARED_BODY_BYTES.
import path from "node:path";
import { Frontmatter } from "./metadata.mjs";
import { DuplicateGuard } from "./retrieval.mjs";

export class ProjectIndex {
  static START = "<!-- gei:index start -->";
  static END = "<!-- gei:index end -->";
  static PROJECT_BODY_BYTES = 3072;
  static SHARED_BODY_BYTES = 1024;
  static TASKS_IN_INDEX = 5;

  static scope(docPath) {
    return DuplicateGuard.scope(docPath);
  }

  static indexPath(scope) {
    return `${scope}INDEX.md`;
  }

  static tasksIndexPath(scope) {
    return `${scope}tasks/INDEX.md`;
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

  // One pass is not enough: replacing `<!--` with `<!-` turns `<!---` back into `<!--`.
  static catalogText(value) {
    let text = String(value).replace(/\\/gu, "\\\\");
    while (text.includes("<!--")) text = text.replaceAll("<!--", "<!-");
    return text.replace(/\s+/gu, " ").trim();
  }

  static lineValue(value) {
    return this.catalogText(value);
  }

  static linkTitle(value) {
    const cleaned = this.catalogText(String(value).replace(/[\[\]]/gu, ""));
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
    if (indexPath.endsWith("/tasks/INDEX.md")) return `# Tasks${eol}${eol}`;
    const title = indexPath === "context/INDEX.md" ? "Shared" : "Project";
    return `# ${title}${eol}${eol}Purpose:${eol}Agreements:${eol}${eol}`;
  }

  static moreTasksLine(hidden) {
    return `More tasks: ${hidden}. See [tasks/INDEX.md](tasks/INDEX.md).`;
  }

  // A topic note is any Markdown file under topics/<domain>/ except that domain's README and any INDEX.
  static topicNote(docPath) {
    const match = /^(projects\/[^/]+\/|context\/)topics\/([^/]+)\/(.+\.md)$/u.exec(docPath || "");
    if (!match || match[3] === "README.md" || match[3] === "INDEX.md" || match[3].endsWith("/INDEX.md")) return null;
    return { readme: `${match[1]}topics/${match[2]}/README.md` };
  }

  static isTopicReadme(scope, name) {
    if (!name.startsWith(`${scope}topics/`)) return false;
    return /^[^/]+\/README\.md$/u.test(name.slice(scope.length + "topics/".length));
  }

  static listable(name, content) {
    if (typeof content !== "string" || !name.endsWith(".md") || name.endsWith("/INDEX.md")) return null;
    if (Frontmatter.problems(name, content).length) return null;
    const { values } = Frontmatter.scalars(content);
    const description = this.lineValue(values.description || "");
    if (!Frontmatter.typeOrder().includes(values.type) || !description) return null;
    return { type: values.type, description, status: values.status || "" };
  }

  static isTaskDocument(name, content) {
    const meta = this.listable(name, content);
    return Boolean(meta && meta.type === "tasks");
  }

  // Context lists topic READMEs when it has one. Otherwise it lists context/notes/.
  // A project always lists topic READMEs only. Tasks are collected separately.
  static catalog(files, scope, updatedAt = () => null) {
    const topics = [];
    const notes = [];
    const tasks = [];
    let topicsMode = scope !== "context/";
    for (const name of Object.keys(files)) {
      if (name.startsWith(scope) && this.isTopicReadme(scope, name) && this.listable(name, files[name])) topicsMode = true;
    }
    for (const name of Object.keys(files)) {
      if (!name.startsWith(scope)) continue;
      const meta = this.listable(name, files[name]);
      if (!meta) continue;
      const entry = { path: name, ...meta, title: this.titleFor(name, files[name]), updated: updatedAt(name) };
      if (meta.type === "tasks") {
        tasks.push(entry);
        continue;
      }
      if (this.isTopicReadme(scope, name)) topics.push(entry);
      else if (!topicsMode && scope === "context/" && name.startsWith("context/notes/")) notes.push(entry);
    }
    const order = new Map(Frontmatter.typeOrder().map((type, index) => [type, index]));
    const byPath = (left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
    topics.sort(byPath);
    notes.sort((left, right) => order.get(left.type) - order.get(right.type) || byPath(left, right));
    tasks.sort((left, right) => {
      const leftTime = Number.isFinite(left.updated) ? left.updated : Number.NEGATIVE_INFINITY;
      const rightTime = Number.isFinite(right.updated) ? right.updated : Number.NEGATIVE_INFINITY;
      if (leftTime !== rightTime) return rightTime - leftTime;
      return byPath(left, right);
    });
    return { topicsMode, topics, notes, tasks };
  }

  static line(indexPath, entry) {
    const status = entry.type === "tasks" ? ` (${entry.status})` : "";
    return `- [${entry.title}](${this.href(indexPath, entry.path)}): ${entry.description}${status}`;
  }

  static scopeBlock(indexPath, catalog, eol) {
    const lines = [];
    if (catalog.topicsMode) {
      for (const entry of catalog.topics) lines.push(this.line(indexPath, entry));
    } else {
      let type = "";
      for (const entry of catalog.notes) {
        if (entry.type !== type) {
          if (lines.length) lines.push("");
          lines.push(`## ${entry.type}`, "");
          type = entry.type;
        }
        lines.push(this.line(indexPath, entry));
      }
    }
    const shown = catalog.tasks.slice(0, this.TASKS_IN_INDEX);
    const hidden = catalog.tasks.length - shown.length;
    if (shown.length) {
      if (lines.length) lines.push("");
      lines.push("## tasks", "");
      for (const entry of shown) lines.push(this.line(indexPath, entry));
      if (hidden) lines.push(this.moreTasksLine(hidden));
    }
    const body = lines.length ? `${lines.join(eol)}${eol}` : "";
    return `${this.START}${eol}${body}${this.END}${eol}`;
  }

  static tasksBlock(indexPath, tasks, eol) {
    const lines = tasks.map(entry => this.line(indexPath, entry));
    const body = lines.length ? `${lines.join(eol)}${eol}` : "";
    return `${this.START}${eol}${body}${this.END}${eol}`;
  }

  static compose(indexPath, previous, block) {
    const eol = this.newline(previous);
    if (typeof previous !== "string") return this.header(indexPath, eol) + block;
    const startAt = previous.indexOf(this.START);
    const endAt = previous.lastIndexOf(this.END);
    if (startAt >= 0 && endAt >= startAt) {
      let head = previous.slice(0, startAt);
      const tail = this.consumeNewline(previous.slice(endAt + this.END.length));
      if (head && !head.endsWith("\n")) head += eol;
      return head + block + tail;
    }
    // A start marker with no end marker after it is the generated region through EOF.
    // Text before the start, including an end marker that appears only earlier, stays.
    if (startAt >= 0) {
      let head = previous.slice(0, startAt);
      if (head && !head.endsWith("\n")) head += eol;
      return head + block;
    }
    let head = previous.split(this.END).join("");
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

  static write(files, before, indexPath, present, blockFor) {
    const kept = Object.hasOwn(files, indexPath);
    if (!kept && !present) return;
    const base = kept ? files[indexPath] : before[indexPath];
    const next = this.compose(indexPath, base, blockFor(this.newline(base)));
    if (files[indexPath] !== next) files[indexPath] = next;
  }

  // `before` supplies the header when this batch deleted an index but documents remain.
  // `updatedAt(path)` is milliseconds, or null when the file has no mtime or commit time.
  // Larger values sort first. The caller uses mtime locally and committer time on GitHub.
  static apply(files, before, scopes, updatedAt = () => null) {
    for (const scope of scopes) {
      const catalog = this.catalog(files, scope, updatedAt);
      const routed = catalog.topicsMode ? catalog.topics.length : catalog.notes.length;
      this.write(files, before, this.indexPath(scope), routed > 0 || catalog.tasks.length > 0, eol => this.scopeBlock(this.indexPath(scope), catalog, eol));
      this.write(files, before, this.tasksIndexPath(scope), catalog.tasks.length > 0, eol => this.tasksBlock(this.tasksIndexPath(scope), catalog.tasks, eol));
    }
  }
}
