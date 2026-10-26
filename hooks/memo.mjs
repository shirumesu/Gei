import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { hash, readJson, writeJson } from "../skills/memo/scripts/spec/io.mjs";
import { resolveProject } from "./knowledge.mjs";

// Capture follows mem0's hook design: record prompts and final replies from hook
// input instead of parsing host transcripts, whose formats are not stable interfaces.
export const WORKER_ENV = "GEI_MEMO_WORKER";
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// Thresholds count UTF-8 bytes so dense CJK text is not undercounted.
const ENTRY_CHARS = 8000;
const CHECKPOINT_BYTES = 150000;
const MIN_BYTES = 3000;
const FINAL_MIN_BYTES = 120;
const CONTEXT_CHARS = 4000;
const RUN_BYTES = 300000;
const STALE_MS = 10 * 60000;
const HEARTBEAT_MS = 30000;
const EXPIRY_MS = 7 * 86400000;
const LAUNCH_LIMIT = 3;
const MAX_ATTEMPTS = 3;
const RUN_TIMEOUT_MS = 20 * 60000;
const idleSeconds = () => {
  const value = Number(process.env.GEI_MEMO_IDLE_SECONDS);
  return process.env.GEI_MEMO_IDLE_SECONDS && value >= 0 ? value : 900;
};

export function memoState(store = new SpecStore()) {
  const config = store.config();
  return { store, config, dir: path.join(store.state, "memo"), active: config.enabled && config.background !== false && process.env[WORKER_ENV] !== "1" };
}

const sessionKey = id => /^[A-Za-z0-9_-]{1,80}$/u.test(id) ? id : hash(String(id)).slice(0, 32);
const files = (dir, id) => {
  const key = sessionKey(id);
  return { key, journal: path.join(dir, "sessions", `${key}.jsonl`), meta: path.join(dir, "sessions", `${key}.json`), lock: path.join(dir, "sessions", `${key}.lock`) };
};
const clip = text => text.length <= ENTRY_CHARS ? text
  : `${text.slice(0, ENTRY_CHARS - 2000)}\n[… ${text.length - ENTRY_CHARS} characters omitted …]\n${text.slice(-2000)}`;
const touch = file => { try { const now = new Date(); fs.utimesSync(file, now, now); } catch {} };
const age = file => { try { return Date.now() - fs.statSync(file)["m" + "timeMs"]; } catch { return Infinity; } };

export function log(dir, message) {
  const file = path.join(dir, "worker.log");
  try {
    fs.mkdirSync(dir, { recursive: true });
    if (age(file) !== Infinity && fs.statSync(file).size > 1024 * 1024) fs.writeFileSync(file, fs.readFileSync(file, "utf8").slice(-256 * 1024));
    fs.appendFileSync(file, `${new Date().toISOString()} ${message}\n`, { mode: 0o600 });
  } catch {}
}

export function readJournal(file) {
  try { return fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line)); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

export function record(dir, host, input) {
  const id = input.session_id;
  if (typeof id !== "string" || !id) return null;
  const paths = files(dir, id);
  fs.mkdirSync(path.dirname(paths.journal), { recursive: true });
  const meta = readJson(paths.meta, { session_id: id, host, cursor: 0, started_at: new Date().toISOString() });
  Object.assign(meta, { host, updated_at: new Date().toISOString(),
    ...(typeof input.cwd === "string" && input.cwd ? { cwd: input.cwd } : {}),
    ...(typeof input.transcript_path === "string" ? { transcript_path: input.transcript_path } : {}),
    ...(typeof input.model === "string" && input.model ? { model: input.model } : {}),
    ...(typeof input.effort?.level === "string" ? { effort: input.effort.level } : {}) });
  const event = input.hook_event_name;
  const text = event === "UserPromptSubmit" ? input.prompt : event === "Stop" ? input.last_assistant_message : null;
  if (typeof text === "string" && text.trim()) {
    fs.appendFileSync(paths.journal, JSON.stringify({ at: meta.updated_at, role: event === "Stop" ? "agent" : "user", text: clip(text.trim()) }) + "\n", { mode: 0o600 });
  }
  if (event === "SessionEnd") meta.ended = true;
  else delete meta.ended;
  writeJson(paths.meta, meta);
  return { ...paths, meta };
}

const pendingDir = dir => path.join(dir, "pending");
const handoffs = (dir, kind, key) => {
  try { return fs.readdirSync(pendingDir(dir)).filter(name => name.startsWith(`${kind}-${key}-`)).map(name => path.join(pendingDir(dir), name)); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
};

export function launch(dir, file) {
  const running = file.replace(/\.json$/u, ".running");
  try { fs.renameSync(file, running); } catch { return false; }
  const out = fs.openSync(path.join(dir, "worker.log"), "a", 0o600);
  try {
    spawn(process.execPath, [path.join(ROOT, "hooks", "memo_worker.mjs"), running], {
      detached: true, stdio: ["ignore", out, out], env: process.env, windowsHide: true,
    }).unref();
  } finally { fs.closeSync(out); }
  return true;
}

export function handOff(dir, kind, key, extra = {}) {
  fs.mkdirSync(pendingDir(dir), { recursive: true });
  const file = path.join(pendingDir(dir), `${kind}-${key}-${randomUUID().slice(0, 8)}.json`);
  writeJson(file, { kind, session: key, created_at: new Date().toISOString(), attempts: 0, ...extra });
  return launch(dir, file);
}

const bytes = entry => Buffer.byteLength(entry.text, "utf8");
const pendingBytes = (journal, cursor) => journal.slice(cursor).reduce((sum, entry) => sum + bytes(entry), 0);

// Stop debounces with one sleeping idle worker per session; a newer Stop replaces it.
export function schedule(dir, captured, event) {
  const { key, journal, meta } = captured;
  if (event === "SessionEnd") {
    for (const file of handoffs(dir, "idle", key)) fs.rmSync(file, { force: true });
    return handOff(dir, "end", key);
  }
  if (event !== "Stop") return false;
  if (pendingBytes(readJournal(journal), meta.cursor) >= CHECKPOINT_BYTES && !handoffs(dir, "checkpoint", key).length) {
    return handOff(dir, "checkpoint", key);
  }
  for (const file of handoffs(dir, "idle", key)) fs.rmSync(file, { force: true });
  return handOff(dir, "idle", key, { delay_seconds: idleSeconds() });
}

export function recover(dir) {
  const queue = pendingDir(dir);
  let names = [];
  try { names = fs.readdirSync(queue); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const queued = new Set();
  for (const name of names) {
    const file = path.join(queue, name);
    if (age(file) > EXPIRY_MS) { fs.rmSync(file, { force: true }); continue; }
    if (name.endsWith(".running") && age(file) > STALE_MS) {
      const value = readJson(file, null);
      if (value) { delete value.delay_seconds; writeJson(file, value); }
      try { fs.renameSync(file, file.replace(/\.running$/u, ".json")); } catch {}
    }
    queued.add(name.replace(/^[a-z]+-/u, "").replace(/-[0-9a-f]{8}\.(json|running)$/u, ""));
  }
  // Sessions whose idle worker died (sleep, reboot, killed SessionEnd) are caught up later.
  const sessions = path.join(dir, "sessions");
  let metas = [];
  try { metas = fs.readdirSync(sessions).filter(name => name.endsWith(".json")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  for (const name of metas) {
    const key = name.slice(0, -5);
    const paths = { journal: path.join(sessions, `${key}.jsonl`), meta: path.join(sessions, name) };
    const meta = readJson(paths.meta, null);
    const idle = age(paths.meta);
    if (!meta || queued.has(key) || idle < Math.max(idleSeconds() * 2000, STALE_MS)) continue;
    if (meta.cursor >= readJournal(paths.journal).length || (meta.failures || 0) >= MAX_ATTEMPTS || idle > EXPIRY_MS) {
      if (meta.ended || idle > EXPIRY_MS) for (const file of Object.values(paths)) fs.rmSync(file, { force: true });
      continue;
    }
    fs.mkdirSync(queue, { recursive: true });
    writeJson(path.join(queue, `recover-${key}-${randomUUID().slice(0, 8)}.json`), { kind: "recover", session: key, created_at: new Date().toISOString(), attempts: 0 });
  }
  let launched = 0;
  for (const name of (fs.existsSync(queue) ? fs.readdirSync(queue) : []).filter(name => name.endsWith(".json")).sort()) {
    if (launched >= LAUNCH_LIMIT) break;
    launched += Number(launch(dir, path.join(queue, name)));
  }
  return launched;
}

export function takeReports(dir, projectId) {
  const file = path.join(dir, "reports", `${projectId}.json`);
  const reports = readJson(file, []);
  const fresh = reports.filter(item => !item.reported);
  if (!fresh.length) return [];
  writeJson(file, reports.map(item => ({ ...item, reported: true })).slice(-20));
  return fresh;
}

function addReport(dir, projectId, report) {
  const file = path.join(dir, "reports", `${projectId}.json`);
  writeJson(file, [...readJson(file, []), report].slice(-20));
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function acquire(lock, running) {
  const deadline = Date.now() + RUN_TIMEOUT_MS;
  while (true) {
    try { fs.writeFileSync(lock, String(process.pid), { flag: "wx", mode: 0o600 }); return true; }
    catch (error) { if (error.code !== "EEXIST") throw error; }
    if (age(lock) > STALE_MS) { fs.rmSync(lock, { force: true }); continue; }
    if (Date.now() > deadline) return false;
    touch(running);
    await sleep(5000);
  }
}

function transcriptModel(file) {
  try {
    const fd = fs.openSync(file, "r");
    try {
      const size = fs.fstatSync(fd).size;
      const length = Math.min(size, 512 * 1024);
      const buffer = Buffer.alloc(length);
      fs.readSync(fd, buffer, 0, length, size - length);
      const models = [...buffer.toString("utf8").matchAll(/"model":"(claude-[^"]+)"/gu)];
      return models.at(-1)?.[1];
    } finally { fs.closeSync(fd); }
  } catch { return undefined; }
}

const SCHEMA = { type: "object", additionalProperties: false, required: ["summary", "paths"], properties: {
  summary: { type: "string", description: "One sentence: what changed in knowledge and why, or why nothing was written." },
  paths: { type: "array", items: { type: "string" }, description: "Knowledge paths created, edited or deleted; empty when nothing was written." } } };

function entryText(entry) {
  return `[${entry.role} ${entry.at.slice(0, 16).replace("T", " ")}]\n${entry.text}`;
}

export function buildPrompt({ project, sharedExists, meta, earlier, entries, store }) {
  const skill = fs.readFileSync(path.join(ROOT, "skills", "memo", "SKILL.md"), "utf8").replace(/^---[\s\S]*?---\n/u, "");
  const hints = [];
  if (project.indexExists) {
    const hint = store.maintenanceHint(`projects/${project.projectId}/`);
    if (hint) hints.push(`${hint} Use checkout_root ${project.checkoutRoot}.`);
  }
  const shared = sharedExists && store.maintenanceHint("context/");
  if (shared) hints.push(shared);
  return `# Gei background Memo

You maintain Gei knowledge after a coding session ended or paused. No user is present: do not ask questions, do not edit repository files, and do not run commands that change state.

Project: ${project.projectId} (knowledge root projects/${project.projectId}/; ${project.indexExists ? "INDEX.md exists" : "no INDEX.md yet"})
Checkout: ${project.checkoutRoot} (read-only evidence; it may have changed since the session)
Session: ${meta.host} ${meta.session_id}, ${meta.started_at} to ${meta.updated_at}${meta.ended ? ", ended" : ", may continue later"}
Memo skill files: ${path.join(ROOT, "skills", "memo")} (read references/ only when a write needs them)

The record lists each user prompt and the agent's final reply per turn. Intermediate tool output is absent; verify claims against the checkout or knowledge when a write depends on them.

Apply the Memo skill below to the whole record, not to the latest turn:
- Judge outcomes at the end of the record. A choice reversed later in the session is not a decision. A proposal the user did not accept is not accepted.
- Corrections and friction: when the user corrected the agent's approach, rejected a result, or stated a working preference, decide its scope. Project-specific: the hand-written header of the project INDEX (purpose and agreements) or the owning document. The generated catalog is not edited by hand. Applies across unrelated projects: context/ (shared knowledge injected at every session start). Never promote one choice into a universal preference.
- If existing knowledge already covered a correction the user had to repeat, that knowledge failed: make it shorter, more prominent, or move the agreement into the INDEX header instead of adding a duplicate. Change a document's description to change its catalog line. When a check, lint, or script could prevent the repeated mistake, record that check as the recommended fix.
- The agent may have written knowledge during the session. Read the current documents before editing and do not duplicate or revert their changes.
- Write in the language of the existing knowledge; for a new project use the session's main language.
- Skip non-durable content. Record only what will change future behavior and cannot be found in code, git, or docs. facts: environment, account ownership, external limits, pitfalls hit; not grep-able code, temporary state, or process. decisions: situation, why, how to apply, and what not to do; not the discussion; a rejected option is one line, "rejected X because Y". runbooks: repeated operations with non-obvious steps; not one-offs, steps \`--help\` explains, or standard git/PR flow. tasks: in progress and todo, with acceptance criteria and status; when done, lift conclusions into decisions or facts, then delete; do not leave status done and do not move the task into log. log: scratch; a weekly tidy distills, then deletes. Never record secrets or credentials, chit-chat, content already clear in a PR or commit, one-off verification results, or restated general knowledge. description is one sentence: what the document covers and when to read it.
- No write is a normal and frequent outcome.
${hints.length ? `\nScheduled maintenance for this run (bounded; skip when the record already needs the whole budget):\n${hints.map(item => `- ${item}`).join("\n")}\n` : ""}
Finish with the requested JSON: summary and paths.

<memo-skill>
${skill.trim()}
</memo-skill>
${earlier ? `\n<earlier-context note="already processed in a previous run; for reference only">\n${earlier}\n</earlier-context>\n` : ""}
<session-record>
${entries.map(entryText).join("\n\n")}
</session-record>
`;
}

function run(command, args, { cwd, input, env, running }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let stdout = "", stderr = "";
    const beat = setInterval(() => touch(running), HEARTBEAT_MS);
    const timer = setTimeout(() => child.kill("SIGTERM"), RUN_TIMEOUT_MS);
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      clearInterval(beat); clearTimeout(timer);
      code === 0 ? resolve(stdout) : reject(new Error(`${command} exited ${code}: ${(stderr || stdout).slice(-600)}`));
    });
    child.stdin.end(input);
  });
}

const specServer = () => ({ command: process.execPath, args: [path.join(ROOT, "skills", "memo", "scripts", "spec", "mcp.mjs")] });

async function runClaude({ meta, cwd, prompt, env, running }) {
  const model = meta.model || (meta.transcript_path && transcriptModel(meta.transcript_path));
  const tools = ["spec_read", "spec_search", "spec_edit", "spec_check"].map(name => `mcp__spec__${name}`);
  const stdout = await run(process.env.GEI_MEMO_CLAUDE || "claude", ["-p", "--setting-sources", "", "--strict-mcp-config",
    "--mcp-config", JSON.stringify({ mcpServers: { spec: specServer() } }), "--tools", "Read,Grep,Glob",
    "--allowedTools", ...tools, "Read", "Grep", "Glob", "--permission-mode", "dontAsk", "--no-session-persistence",
    "--output-format", "json", "--json-schema", JSON.stringify(SCHEMA),
    ...(model ? ["--model", model] : []), ...(meta.effort ? ["--effort", meta.effort] : [])], { cwd, input: prompt, env, running });
  const result = JSON.parse(stdout);
  if (result.is_error) throw new Error(`claude reported an error: ${String(result.result).slice(0, 600)}`);
  return result.structured_output || JSON.parse(result.result);
}

async function runCodex({ meta, cwd, prompt, env, running }) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "gei-memo-"));
  try {
    const schema = path.join(temporary, "schema.json"), output = path.join(temporary, "last.json");
    fs.writeFileSync(schema, JSON.stringify(SCHEMA));
    const server = specServer();
    await run(process.env.GEI_MEMO_CODEX || "codex", ["exec", "--ephemeral", "--skip-git-repo-check", "-C", cwd, "-s", "read-only",
      "-c", 'approval_policy="never"', "-c", `mcp_servers.gei_spec.command=${JSON.stringify(server.command)}`,
      "-c", `mcp_servers.gei_spec.args=${JSON.stringify(server.args)}`, "--output-schema", schema, "-o", output,
      ...(meta.model ? ["-m", meta.model] : []), "-"], { cwd, input: prompt, env, running });
    return JSON.parse(fs.readFileSync(output, "utf8"));
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}

export async function processSession(dir, handoff, running, { dryRun = false } = {}) {
  const store = new SpecStore();
  const paths = files(dir, handoff.session);
  if (!dryRun && !(await acquire(paths.lock, running))) throw new Error(`session ${handoff.session} stayed locked`);
  try {
    let meta = readJson(paths.meta, null);
    if (!meta) return "no session record";
    const journal = readJournal(paths.journal);
    const results = [];
    while (meta.cursor < journal.length) {
      // Idle runs wait for more turns; a final run still reviews a short but decisive exchange.
      const final = meta.ended || handoff.kind === "recover" || dryRun;
      const pending = pendingBytes(journal, meta.cursor);
      if (!final && pending < MIN_BYTES) { results.push("waiting for more turns"); break; }
      let end = meta.cursor, size = 0;
      while (end < journal.length && (end === meta.cursor || size + bytes(journal[end]) <= RUN_BYTES)) size += bytes(journal[end++]);
      const entries = journal.slice(meta.cursor, end);
      if (pending < FINAL_MIN_BYTES || !entries.some(entry => entry.role === "user")) {
        results.push("too little content");
      } else {
        if (!meta.cwd || !fs.existsSync(meta.cwd)) throw new Error(`session workspace is unavailable: ${meta.cwd}`);
        const resolved = resolveProject(meta.cwd);
        const index = await store.index(`projects/${resolved.projectId}/INDEX.md`);
        const project = { ...resolved, indexExists: Boolean(index.content) };
        const earlier = journal.slice(0, meta.cursor).map(entryText).join("\n\n").slice(-CONTEXT_CHARS);
        const sharedExists = Boolean((await store.index("context/INDEX.md")).content);
        const prompt = buildPrompt({ project, sharedExists, meta, earlier, entries, store });
        if (dryRun) return prompt;
        const env = { ...process.env, [WORKER_ENV]: "1" };
        const runner = meta.host === "codex" ? runCodex : runClaude;
        const result = await runner({ meta, cwd: project.checkoutRoot, prompt, env, running, dir });
        log(dir, `${meta.host} ${handoff.session} ${handoff.kind} entries ${meta.cursor}-${end}: ${result.summary} [${result.paths.join(", ")}]`);
        if (result.paths.length) addReport(dir, project.projectId, { at: new Date().toISOString(), session: meta.session_id, summary: result.summary, paths: result.paths });
        results.push(result.summary);
      }
      meta = { ...readJson(paths.meta, meta), cursor: end };
      writeJson(paths.meta, meta);
    }
    if (meta.ended && meta.cursor >= readJournal(paths.journal).length) for (const file of [paths.journal, paths.meta]) fs.rmSync(file, { force: true });
    return results.join(" | ") || "nothing pending";
  } finally { if (!dryRun) fs.rmSync(paths.lock, { force: true }); }
}

export function recordFailure(dir, session) {
  const paths = files(dir, session);
  const meta = readJson(paths.meta, null);
  if (meta) writeJson(paths.meta, { ...meta, failures: (meta.failures || 0) + 1 });
}

export async function sleepWhileQueued(running, seconds) {
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    if (!fs.existsSync(running)) return false;
    touch(running);
    await sleep(Math.min(HEARTBEAT_MS, until - Date.now()));
  }
  return fs.existsSync(running);
}

export { files as sessionFiles, MAX_ATTEMPTS };
