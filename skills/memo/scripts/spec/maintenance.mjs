import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fail, documentPath, isDocument } from "./io.mjs";
import { Frontmatter } from "./metadata.mjs";
import { ProjectIndex } from "./index.mjs";

// Source drift uses git commit times, not stored content hashes.
export class SourceDrift {
  static unquote(value) {
    const trimmed = String(value).trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1);
    return trimmed;
  }
  static flow(text) {
    const values = [];
    let current = "", quote = "";
    for (const char of text) {
      if (quote) {
        if (char === quote) quote = "";
        else current += char;
        continue;
      }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === ",") {
        const value = this.unquote(current);
        if (value) values.push(value);
        current = "";
        continue;
      }
      current += char;
    }
    const tail = this.unquote(current);
    if (tail) values.push(tail);
    return values;
  }
  // Optional `sources` list in YAML frontmatter. A `gei:` line is not this field.
  static list(content) {
    const { block } = Frontmatter.split(content);
    if (!block) return [];
    const items = [];
    let reading = false, seen = false;
    for (const line of block.split(/\r?\n/u)) {
      if (/^[ \t]*#/u.test(line) || /^gei\s*:/u.test(line)) { reading = false; continue; }
      if (reading) {
        const item = /^[ \t]*-\s+(.*)$/u.exec(line);
        if (item) {
          const value = this.unquote(item[1]);
          if (value) items.push(value);
          continue;
        }
        if (/^[ \t]*$/u.test(line)) continue;
        reading = false;
      }
      const key = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/u.exec(line);
      if (!key || key[1] !== "sources" || seen) continue;
      seen = true;
      const value = key[2].trim();
      if (value.startsWith("[") && value.endsWith("]")) return this.flow(value.slice(1, -1));
      if (!value) reading = true;
    }
    return items;
  }
  static locate(root, name) {
    if (typeof root !== "string" || !root || typeof name !== "string" || path.isAbsolute(name) || name.includes("\\")
      || name.split("/").some(part => !part || part === "." || part === "..")) return null;
    let base;
    try { base = fs.realpathSync(root); }
    catch { return null; }
    const file = path.resolve(base, name);
    if (file !== base && !file.startsWith(base + path.sep)) return null;
    let real;
    try { real = fs.realpathSync(file); }
    catch { return null; }
    if (real !== base && !real.startsWith(base + path.sep)) return null;
    try { if (!fs.statSync(real).isFile()) return null; }
    catch { return null; }
    return real;
  }
  // Committer time of the last commit that touched this path, or null when git cannot say.
  static commitTime(root, relativePath) {
    if (typeof root !== "string" || !root || typeof relativePath !== "string" || !relativePath) return null;
    try {
      const output = execFileSync("git", ["-C", root, "log", "-1", "--format=%ct", "--", relativePath], {
        encoding: "utf8", timeout: 10000, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
      }).trim();
      return /^\d+$/u.test(output) ? Number(output) : null;
    } catch { return null; }
  }
  static assess(content, { checkoutRoot, docTime } = {}) {
    const sources = this.list(content);
    const source_changes = [];
    const reasons = [];
    if (!sources.length || typeof checkoutRoot !== "string" || !checkoutRoot) return { reasons, source_changes };
    for (const source of [...new Set(sources)]) {
      if (!this.locate(checkoutRoot, source)) {
        source_changes.push({ path: source, status: "unavailable" });
        if (!reasons.includes("source_unavailable")) reasons.push("source_unavailable");
        continue;
      }
      const sourceTime = this.commitTime(checkoutRoot, source);
      if (Number.isInteger(docTime) && Number.isInteger(sourceTime) && sourceTime > docTime) {
        source_changes.push({ path: source, status: "changed" });
        if (!reasons.includes("source_changed")) reasons.push("source_changed");
      }
    }
    return { reasons, source_changes };
  }
}

export class SpecCheck {
  static scopePrefix(value) {
    if (typeof value !== "string" || (value !== "all" && value !== "projects/" && !/^(?:projects\/[^/]+\/|context\/)/u.test(value))) fail("ARGUMENT", "Provide path_prefix: projects/<project>/, projects/, context/, or all.");
    if (value !== "all" && (!value.endsWith("/") || value.includes("\\") || value.split("/").some(part => part === "." || part === ".."))) fail("ARGUMENT", "Use a directory knowledge prefix.");
    return name => value === "all" || name.startsWith(value);
  }
  static targetPath(owner, raw) {
    let target;
    try { target = decodeURIComponent(raw.trim().replace(/^<|>$/gu, "").split(/[?#]/u)[0]); } catch { return null; }
    if (!target || /^(?:[a-z][a-z\d+.-]*:|\/)/iu.test(target)) return null;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(owner), target));
    try { return documentPath(resolved); } catch { return null; }
  }
  static references(owner, content, knownTargets = []) {
    const result = [], definitions = new Map();
    const textualTargets = knownTargets.filter(target => target !== owner).map(target => {
      const aliases = [target, path.posix.relative(path.posix.dirname(owner), target)];
      if (!aliases[1].startsWith("../")) aliases.push(`./${aliases[1]}`);
      const escaped = aliases.map(alias => alias.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"));
      return { target, pattern: new RegExp(`(?<![\\p{L}\\p{N}_./%:+-])(?:${escaped.join("|")})(?![\\p{L}\\p{N}_./%+-])`, "iu") };
    });
    const lines = Frontmatter.maskGei(content).split("\n");
    let fence = null, comment = false;
    const usable = lines.map(raw => {
      if (fence) {
        const marker = /^\s*(`{3,}|~{3,})/u.exec(raw);
        if (marker && marker[1][0] === fence) fence = null;
        return "";
      }
      let line = raw;
      if (comment) {
        const end = line.indexOf("-->");
        if (end < 0) return "";
        comment = false;
        line = line.slice(end + 3);
      }
      const marker = /^\s*(`{3,}|~{3,})/u.exec(line);
      const commentAt = line.indexOf("<!--");
      if (marker && (commentAt < 0 || marker.index < commentAt)) { fence = marker[1][0]; return ""; }
      let visible = "";
      while (line.length) {
        const start = line.indexOf("<!--");
        if (start < 0) { visible += line; break; }
        visible += line.slice(0, start);
        const end = line.indexOf("-->", start + 4);
        if (end < 0) { comment = true; break; }
        line = line.slice(end + 3);
      }
      return visible.replace(/`+[^`]*`+/gu, "");
    });
    usable.forEach((line, index) => {
      const match = /^\s*\[([^\]]+)\]:\s*(<[^>]+>|\S+)/u.exec(line);
      if (match) definitions.set(match[1].toLowerCase(), { target: this.targetPath(owner, match[2]), line: index + 1 });
    });
    let managed = false;
    usable.forEach((line, index) => {
      if (line.includes("<!-- gei:navigation -->")) managed = true;
      if (line.includes("<!-- /gei:navigation -->")) managed = false;
      const inline = [...line.matchAll(/!?\[([^\]]*)\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/gu)];
      const original = lines[index].trim();
      const nextContent = lines.slice(index + 1).find(value => value.trim()) || "";
      const nested = /^\s*/u.exec(nextContent)[0].length > /^\s*/u.exec(lines[index])[0].length;
      const pure = inline.length === 1 && /^[-*+]\s+/u.test(original) && original.replace(/^[-*+]\s+/u, "") === inline[0][0] && !nested && (managed || /\/(?:INDEX|README)\.md$/u.test(owner));
      for (const match of inline) {
        const target = this.targetPath(owner, match[2]);
        if (target) result.push({ path: owner, target, line: index + 1, navigation: pure, text: lines[index].slice(0, 500) });
      }
      if (/^\s*\[[^\]]+\]:/u.test(line)) return;
      for (const match of line.matchAll(/\[([^\]]+)\](?:\[([^\]]*)\])?(?!\()/gu)) {
        const definition = definitions.get((match[2] || match[1]).toLowerCase());
        if (definition?.target) result.push({ path: owner, target: definition.target, line: index + 1, navigation: false, text: lines[index].slice(0, 500) });
      }
      for (const match of line.matchAll(/(?:href|src)=["']([^"']+)["']/giu)) {
        const target = this.targetPath(owner, match[1]);
        if (target) result.push({ path: owner, target, line: index + 1, navigation: false, text: lines[index].slice(0, 500) });
      }
      let mention = lines[index].replaceAll("\\", "");
      try { mention = decodeURIComponent(mention); } catch { /* Keep literal malformed URI text. */ }
      for (const { target, pattern } of textualTargets) {
        if (pattern.test(mention) && !result.some(item => item.target === target && item.line === index + 1)) {
          result.push({ path: owner, target, line: index + 1, navigation: false, text: lines[index].slice(0, 500), uncertain: true });
        }
      }
    });
    return result;
  }
  static proseBlocks(content) {
    const headerLines = Frontmatter.split(content).header.split("\n").length - 1;
    const result = [], paragraph = [];
    let start = 0, fence = null, navigation = false, comment = false;
    const flush = () => {
      const text = paragraph.join(" ").replace(/\s+/gu, " ").trim();
      if (Array.from(text).length >= 160) result.push({ text, line: start });
      paragraph.length = 0;
    };
    content.split("\n").forEach((line, index) => {
      if (index < headerLines) return;
      const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
      if (fence) {
        if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
        return;
      }
      if (marker) { flush(); fence = marker[1]; return; }
      if (line.includes("<!-- gei:navigation -->")) { flush(); navigation = true; }
      if (navigation) {
        if (line.includes("<!-- /gei:navigation -->")) navigation = false;
        return;
      }
      if (comment || line.includes("<!--")) {
        flush(); comment = !line.includes("-->"); return;
      }
      const onlyLinks = line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)?/u, "")
        .replace(/!?\[[^\]]*\]\(\s*(?:<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/gu, "")
        .replace(/\[[^\]]+\]\[[^\]]*\]/gu, "").trim();
      if (!line.replace(/`+[^`]*`+/gu, "").trim() || /^(?: {4}|\t)|^ {0,3}#{1,6}(?:\s|$)|^\s*[-=]{3,}\s*$|^\s*\[[^\]]+\]:/u.test(line) || !onlyLinks) { flush(); return; }
      if (!paragraph.length) start = index + 1;
      paragraph.push(line.trim());
    });
    flush();
    return result;
  }
  static excerpt(value, limit) {
    const characters = Array.from(value);
    return { text: characters.slice(0, limit).join(""), truncated: characters.length > limit };
  }
  static duplicateProse(documents) {
    const blocks = new Map(), byDocument = new Map();
    for (const [name, content] of documents) {
      for (const block of this.proseBlocks(content)) {
        if (!blocks.has(block.text)) blocks.set(block.text, []);
        blocks.get(block.text).push({ path: name, line: block.line });
      }
    }
    for (const [text, occurrences] of blocks) {
      if (new Set(occurrences.map(item => item.path)).size < 2) continue;
      const sample = this.excerpt(text, 240);
      for (const item of occurrences) {
        const peers = occurrences.filter(peer => peer.path !== item.path);
        if (!byDocument.has(item.path)) byDocument.set(item.path, []);
        byDocument.get(item.path).push({ line: item.line, excerpt: sample.text, excerpt_truncated: sample.truncated,
          peers: peers.slice(0, 5), peers_omitted: Math.max(0, peers.length - 5) });
      }
    }
    for (const found of byDocument.values()) found.sort((a, b) => a.line - b.line);
    return byDocument;
  }
  // A topic note is reachable when its topic README links it. INDEX does not list it.
  static unlinkedTopicNotes(files) {
    const byReadme = new Map();
    for (const name of Object.keys(files)) {
      const note = ProjectIndex.topicNote(name);
      if (!note || typeof files[name] !== "string") continue;
      if (!byReadme.has(note.readme)) byReadme.set(note.readme, []);
      byReadme.get(note.readme).push(name);
    }
    const orphans = new Map();
    for (const [readme, notes] of byReadme) {
      const content = files[readme];
      const linked = new Set(typeof content === "string" ? this.references(readme, content).filter(item => !item.uncertain).map(item => item.target) : []);
      for (const name of notes) if (!linked.has(name)) orphans.set(name, readme);
    }
    return orphans;
  }
  static inventory(files, prefix, { checkoutRoot, commitTime = () => null } = {}) {
    const selected = this.scopePrefix(prefix);
    const known = Object.keys(files).filter(isDocument);
    const refs = Object.entries(files).filter(([name]) => isDocument(name)).flatMap(([name, content]) => this.references(name, content, known));
    const all = Object.entries(files).filter(([name]) => isDocument(name) && selected(name)).sort(([a], [b]) => a.localeCompare(b));
    const duplicates = this.duplicateProse(all);
    const orphans = this.unlinkedTopicNotes(files);
    const results = [];
    for (const [name, content] of all) {
      const drift = SourceDrift.assess(content, { checkoutRoot, docTime: SourceDrift.list(content).length ? commitTime(name) : null });
      const broken = refs.filter(item => item.path === name && !Object.hasOwn(files, item.target));
      const repeated = duplicates.get(name) || [];
      const reasons = [...drift.reasons];
      if (broken.length) reasons.push("broken_reference");
      if (orphans.has(name)) reasons.push("orphan_note");
      if (repeated.length) reasons.push("duplicate_content");
      if (!reasons.length) continue;
      results.push({ path: name, reasons,
        broken: broken.slice(0, 20), broken_total: broken.length,
        topic_readme: orphans.get(name),
        source_changes: drift.source_changes,
        duplicates: repeated.slice(0, 3), duplicates_omitted: Math.max(0, repeated.length - 3),
        next: "Read the document. Repair a missing link, link a topic note from its topic README, reconcile a source whose latest git commit is newer than this document, or merge repeated prose. A signal does not delete the document." });
    }
    const rank = item => item.reasons.some(reason => reason === "broken_reference" || reason === "orphan_note" || reason === "source_changed") ? 0 : 1;
    results.sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path));
    return { documents: all.length, results };
  }
  static assertDeletionLinks(before, after) {
    const deleted = new Set(Object.keys(before).filter(name => isDocument(name) && !Object.hasOwn(after, name)));
    if (!deleted.size) return;
    const unresolved = Object.entries(after).filter(([name]) => isDocument(name)).flatMap(([name, content]) => this.references(name, content, [...deleted])).filter(item => deleted.has(item.target));
    if (unresolved.length) fail("DEPENDENCY", "Repair incoming links in the same deletion batch.", { applied: false, references: unresolved.slice(0, 30) });
  }
}
