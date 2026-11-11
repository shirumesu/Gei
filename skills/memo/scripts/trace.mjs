// What memory a Claude Code session was given and which memory files it read, from the
// transcripts Claude Code keeps under ~/.claude/projects/<encoded cwd>/<session>.jsonl.
// The transcript format is not a documented interface; this reads only what it needs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { storeDir } from "./store.mjs";

const projectsDir = () => path.join(os.homedir(), ".claude", "projects");
export const transcriptDir = cwd => path.join(projectsDir(), path.resolve(cwd).replace(/[^A-Za-z0-9]/gu, "-"));

function sessionFile(cwd, session) {
  if (session && session.endsWith(".jsonl")) return path.resolve(session);
  const dir = transcriptDir(cwd);
  if (!fs.existsSync(dir)) throw new Error(`No Claude Code transcripts for ${cwd} (looked in ${dir}).`);
  if (session) {
    const file = path.join(dir, `${session}.jsonl`);
    if (!fs.existsSync(file)) throw new Error(`No transcript ${file}.`);
    return file;
  }
  const files = fs.readdirSync(dir).filter(name => name.endsWith(".jsonl"))
    .map(name => path.join(dir, name)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files.length) throw new Error(`No transcripts in ${dir}.`);
  return files[0];
}

const entries = file => fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line));

// Memory paths a tool call touched: native file tools on the store, and the old spec_* tools.
function touched(tool, store) {
  const input = tool.input || {};
  const inStore = value => typeof value === "string" && path.resolve(value.replace(/^~(?=\/)/u, os.homedir())).startsWith(store + path.sep);
  const rel = value => path.relative(store, path.resolve(value.replace(/^~(?=\/)/u, os.homedir())));
  if (["Read", "Edit", "Write", "MultiEdit"].includes(tool.name) && inStore(input.file_path)) {
    return { kind: tool.name === "Read" ? "read" : "write", paths: [rel(input.file_path)] };
  }
  if (["Grep", "Glob"].includes(tool.name) && inStore(input.path)) return { kind: "search", paths: [rel(input.path) || "."] };
  if (/spec_read$/u.test(tool.name)) return { kind: "read", paths: input.paths || [] };
  if (/spec_edit$/u.test(tool.name)) return { kind: "write", paths: (input.edits || []).map(edit => edit.path) };
  return null;
}

function sessionEvents(file, store) {
  const injected = [];
  const events = [];
  let step = 0;
  for (const entry of entries(file)) {
    const attachment = entry.attachment;
    if (attachment?.type === "hook_additional_context" && attachment.hookEvent === "SessionStart") {
      const content = [].concat(attachment.content).join("\n");
      if (/^# Gei (memo|project memory|shared memory|AGENTS\.md)/mu.test(content)) injected.push({ time: entry.timestamp, content });
    }
    if (entry.type !== "assistant") continue;
    for (const block of entry.message?.content || []) {
      if (block.type !== "tool_use") continue;
      step += 1;
      const hit = touched(block, store);
      if (hit) events.push({ step, time: entry.timestamp, ...hit });
    }
  }
  return { injected, events, steps: step };
}

export function traceSession({ cwd, session }) {
  const store = storeDir();
  const file = sessionFile(cwd, session);
  const { injected, events, steps } = sessionEvents(file, store);
  const out = [`Session ${path.basename(file, ".jsonl")} (${file})`, `${steps} tool calls.`, ""];
  out.push(injected.length ? "Injected at session start:" : "Nothing from Gei memo was injected.");
  for (const item of injected) {
    for (const line of item.content.split("\n")) if (/^#/u.test(line) || /^- \[/u.test(line) || / → /u.test(line)) out.push(`  ${line}`);
  }
  out.push("", events.length ? "Memory files the session touched (step, time, action, path):" : "The session touched no memory files.");
  for (const event of events) for (const item of event.paths) out.push(`  #${event.step} ${event.time} ${event.kind} ${item}`);
  return out.join("\n");
}

// Read counts and last read time per memory file across every transcript; the least recently
// read files come first, as eviction candidates for tidy.
export function usage() {
  const store = storeDir();
  const stats = new Map();
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) { walk(full); continue; }
      if (!item.name.endsWith(".md") || item.name === "MEMORY.md" || item.name === "MAP.md") continue;
      stats.set(path.relative(store, full), { reads: 0, last: null });
    }
  };
  walk(path.join(store, "context"));
  walk(path.join(store, "projects"));
  const root = projectsDir();
  const files = fs.existsSync(root) ? fs.readdirSync(root).flatMap(dir => {
    const full = path.join(root, dir);
    return fs.statSync(full).isDirectory() ? fs.readdirSync(full).filter(name => name.endsWith(".jsonl")).map(name => path.join(full, name)) : [];
  }) : [];
  for (const file of files) {
    for (const event of sessionEvents(file, store).events) {
      if (event.kind !== "read") continue;
      for (const item of event.paths) {
        const stat = stats.get(item) || { reads: 0, last: null, missing: true };
        stat.reads += 1;
        if (!stat.last || event.time > stat.last) stat.last = event.time;
        stats.set(item, stat);
      }
    }
  }
  const rows = [...stats.entries()].filter(([, stat]) => !stat.missing)
    .sort(([a, x], [b, y]) => (x.last || "").localeCompare(y.last || "") || a.localeCompare(b));
  return [`Reads per memory file across ${files.length} transcripts, least recently read first:`,
    ...rows.map(([name, stat]) => `  ${String(stat.reads).padStart(4)}  ${(stat.last || "never").padEnd(24)}  ${name}`)].join("\n");
}
