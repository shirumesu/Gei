// Lint the store and build what a session sees at startup.
import fs from "node:fs";
import path from "node:path";
import { storeDir } from "./store.mjs";

export const BUDGET = { header: 10, shared: 20, project: 30, map: 40, lines: 100, chars: 8000, line: 150 };

// The purpose and the safety rules. Injected every session so they do not depend on a skill firing.
export function header(dir = storeDir()) {
  return [
    `# Gei memo · store: ${dir}`,
    "Memory exists so later sessions repeat fewer mistakes, ask the user fewer repeated questions, and rebuild less of what already exists.",
    "- Read and edit these files directly with your file tools; hooks commit and sync the store. Never put memory in the repository.",
    "- An index line says only when to read its file; the rule is in the file. Read it before acting on such a task.",
    "- When a note conflicts with the current code or with what the user says now, follow the code and the user, and fix the note this turn.",
    "- Worth recording: a user correction or preference, a practice or pitfall that will recur, a reuse pointer just earned.",
    "- Not worth recording: progress, finished work, one-off problems, rejected proposals, general knowledge, secrets.",
    "- Before writing, load the memo skill for where and how.",
  ];
}

const INDEX_LINE = /^- \[[^\]]+\]\(([A-Za-z0-9][A-Za-z0-9._-]*\.md)\) - \S/u;
const MAP_LINE = /^- (.+?) → ([^#\s]+)#([^:\s]+): \S/u;
const lines = text => text.replace(/\r\n/gu, "\n").split("\n").filter(line => line.trim());
const read = file => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

// Problems are strings naming the file, so the agent or the user can fix them.
function lintIndex(dir, rel, limit) {
  const problems = [];
  const text = read(path.join(dir, "MEMORY.md"));
  const indexed = new Set();
  for (const [number, line] of (text === null ? [] : text.replace(/\r\n/gu, "\n").split("\n")).entries()) {
    if (!line.trim()) continue;
    const match = INDEX_LINE.exec(line);
    if (!match) { problems.push(`${rel}/MEMORY.md:${number + 1} is not an index line \`- [topic](topic.md) - when to read it\`.`); continue; }
    indexed.add(match[1]);
    if (!fs.existsSync(path.join(dir, match[1]))) problems.push(`${rel}/MEMORY.md:${number + 1} links ${match[1]}, which does not exist.`);
    if (line.length > BUDGET.line) problems.push(`${rel}/MEMORY.md:${number + 1} is over ${BUDGET.line} characters.`);
  }
  const count = text === null ? 0 : lines(text).length;
  if (count > limit) problems.push(`${rel}/MEMORY.md has ${count} lines; the budget is ${limit}. Merge or drop the least recently read entries before adding.`);
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.endsWith(".md") && name !== "MEMORY.md" && name !== "MAP.md" && !indexed.has(name)) problems.push(`${rel}/${name} has no line in ${rel}/MEMORY.md.`);
    }
  }
  return { problems, lines: text === null ? [] : lines(text) };
}

// A pointer is live when its file exists in the current checkout and contains its symbol.
function checkMap(dir, rel, checkoutRoot) {
  const text = read(path.join(dir, "MAP.md"));
  const result = { live: [], problems: [] };
  if (text === null) return result;
  const all = text.replace(/\r\n/gu, "\n").split("\n");
  let count = 0;
  for (const [number, line] of all.entries()) {
    if (!line.trim()) continue;
    count += 1;
    const where = `${rel}/MAP.md:${number + 1}`;
    const match = MAP_LINE.exec(line);
    if (!match) { result.problems.push(`${where} is not a pointer \`- <when you need X> → <path>#<symbol>: <contract>\`.`); continue; }
    if (line.length > BUDGET.line) result.problems.push(`${where} is over ${BUDGET.line} characters.`);
    if (!checkoutRoot) { result.live.push(line); continue; }
    const [, , file, symbol] = match;
    const target = path.resolve(checkoutRoot, file);
    const contents = fs.existsSync(target) && fs.statSync(target).isFile() ? fs.readFileSync(target, "utf8") : null;
    if (contents === null) result.problems.push(`${where} is dead: ${file} does not exist in this checkout. Fix or delete it.`);
    else if (!new RegExp(`(?<![\\p{L}\\p{N}_$])${escape(symbol)}(?![\\p{L}\\p{N}_$])`, "u").test(contents)) result.problems.push(`${where} is dead: ${file} has no \`${symbol}\`. Fix or delete it.`);
    else result.live.push(line);
  }
  if (count > BUDGET.map) result.problems.push(`${rel}/MAP.md has ${count} lines; the budget is ${BUDGET.map}. Merge or drop the least used pointers before adding.`);
  return result;
}

// What the SessionStart hook injects for one project, plus the problems lint found.
export function sessionContext(project, dir = storeDir()) {
  const shared = lintIndex(path.join(dir, "context"), "context", BUDGET.shared);
  const rel = `projects/${project.projectId}`;
  const own = project.exists ? lintIndex(path.join(dir, rel), rel, BUDGET.project) : { problems: [], lines: [] };
  const map = project.exists ? checkMap(path.join(dir, rel), rel, project.checkoutRoot) : { problems: [], live: [] };
  const parts = [header(dir).join("\n")];
  if (shared.lines.length) parts.push(`## Shared memory · context/MEMORY.md\n${shared.lines.join("\n")}`);
  const via = project.parent ? `; workspace is under ${project.parent.root}` : "";
  parts.push(project.exists
    ? `## Project memory · ${project.projectId} · ${rel}/MEMORY.md${via}\n${own.lines.join("\n") || "(empty index)"}`
    : `## Project memory · ${project.projectId}\nNone yet. This project's scope is ${rel}/; creating its MEMORY.md starts it.`);
  if (map.live.length) parts.push(`## Reuse pointers · ${rel}/MAP.md\n${map.live.join("\n")}`);
  const problems = [...shared.problems, ...own.problems, ...map.problems];
  const injected = header(dir).length + shared.lines.length + own.lines.length + map.live.length;
  const chars = parts.join("\n\n").length;
  if (injected > BUDGET.lines || chars > BUDGET.chars) problems.push(`Injected memory is ${injected} lines and ${chars} characters; the budget is ${BUDGET.lines} lines and ${BUDGET.chars} characters.`);
  if (problems.length) parts.push(`## Memory problems (fix them when you touch these files)\n${problems.map(item => `- ${item}`).join("\n")}`);
  return { context: parts.join("\n\n"), problems };
}

// Lint every scope; pointers are checked against the given checkout only for its own project.
export function lintStore(project, dir = storeDir()) {
  const problems = [...lintIndex(path.join(dir, "context"), "context", BUDGET.shared).problems];
  const projectsDir = path.join(dir, "projects");
  const names = fs.existsSync(projectsDir) ? fs.readdirSync(projectsDir, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name).sort() : [];
  for (const name of names) {
    const rel = `projects/${name}`;
    problems.push(...lintIndex(path.join(dir, rel), rel, BUDGET.project).problems);
    problems.push(...checkMap(path.join(dir, rel), rel, project?.projectId === name ? project.checkoutRoot : null).problems);
  }
  return problems;
}
