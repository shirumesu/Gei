import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { scopeContext } from "../skills/memo/scripts/spec/context.mjs";
import { writeJson } from "../skills/memo/scripts/spec/io.mjs";

export function getHookStartDir(input, env = process.env) {
  return typeof input.cwd === "string" && input.cwd
    ? input.cwd : env.CLAUDE_PROJECT_DIR || process.cwd();
}

export function readHookInput() {
  if (process.stdin.isTTY) return {};
  const raw = fs.readFileSync(0, "utf8");
  if (!raw.trim()) return {};
  const input = JSON.parse(raw);
  return input && typeof input === "object" ? input : {};
}

export function writeSessionStartContext(additionalContext) {
  if (!additionalContext?.trim()) return;
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext },
  })}\n`);
}

export function writeSessionStartError(operation, error) {
  process.stdout.write(`${JSON.stringify({ systemMessage: `Gei ${operation} failed.\n${String(error.message || error).slice(0, 800)}` })}\n`);
}

export function normalizeRoot(value) {
  const resolved = path.resolve(value);
  try { return fs.realpathSync.native(resolved); }
  catch (error) {
    if (error.code === "ENOENT") return resolved;
    throw error;
  }
}

function projectName(value) {
  return value.normalize("NFKC").trim().toLowerCase()
    .replace(/\s+/gu, "-").replace(/[^\p{Letter}\p{Number}._-]+/gu, "-")
    .replace(/^[._-]+|[._-]+$/gu, "") || "project";
}

export function projectIdForRoot(value) {
  return projectName(path.basename(normalizeRoot(value)));
}

export function resolveRepository(startDir) {
  const cwd = normalizeRoot(startDir);
  if (!fs.statSync(cwd).isDirectory()) throw new Error(`Not a workspace directory: ${cwd}`);
  let output;
  try {
    output = execFileSync("git", ["-C", cwd, "rev-parse", "--path-format=absolute",
      "--git-common-dir", "--show-toplevel"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 2000,
      windowsHide: true,
    });
  } catch (error) {
    if (/must be run in a work tree/iu.test(String(error.stderr)) && String(error.stdout || "").trim()) {
      output = String(error.stdout);
    } else if (error.code === "ENOENT" || /not a git repository/iu.test(String(error.stderr))) {
      return { checkoutRoot: cwd, projectRoot: cwd, gitCommonDir: null };
    } else throw error;
  }
  const [common, checkout] = output.trim().split(/\r?\n/u);
  const gitCommonDir = normalizeRoot(common);
  // Linked worktrees share the main root; separate metadata uses its own directory name.
  const projectRoot = path.basename(gitCommonDir) === ".git"
    ? path.dirname(gitCommonDir) : gitCommonDir;
  const checkoutRoot = checkout ? normalizeRoot(checkout) : projectRoot;
  return { checkoutRoot, projectRoot, gitCommonDir };
}

export function readProjectRoots(file) {
  let value;
  try { value = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return {}; }
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).map(([id, roots]) =>
    [id, (Array.isArray(roots) ? roots : []).filter(root => typeof root === "string" && fs.existsSync(root))]));
}

export function rememberProjectRoot(file, projectId, root) {
  const roots = readProjectRoots(file);
  if (roots[projectId]?.includes(root)) return;
  roots[projectId] = [...(roots[projectId] || []), root];
  writeJson(file, Object.fromEntries(Object.entries(roots).filter(([, list]) => list.length)));
}

function parentProject(start, knownProjects, roots) {
  const home = normalizeRoot(os.homedir());
  if (start === home) return null;
  for (let dir = path.dirname(start); dir !== home && dir !== path.dirname(dir); dir = path.dirname(dir)) {
    const id = projectName(path.basename(dir));
    if (!knownProjects.has(id)) continue;
    const recorded = roots[id] || [];
    if (recorded.length && !recorded.includes(dir)) continue;
    return { projectId: id, root: dir, recorded: recorded.length > 0 };
  }
  return null;
}

export function resolveProject(startDir, { knownProjects = null, rootsFile = null } = {}) {
  const repository = resolveRepository(startDir);
  const ownProjectId = projectIdForRoot(repository.projectRoot);
  const parent = knownProjects && !knownProjects.has(ownProjectId)
    ? parentProject(repository.projectRoot, knownProjects, readProjectRoots(rootsFile)) : null;
  if (parent) {
    repository.projectRoot = parent.root;
    if (!repository.gitCommonDir) repository.checkoutRoot = parent.root;
  }
  const projectId = parent?.projectId || ownProjectId;
  return { ...repository, projectId, ownProjectId, parent, projectExists: Boolean(knownProjects?.has(projectId)) };
}

export const projectRootsFile = store => path.join(store.state, "roots.json");

export async function resolveWorkspace(startDir, store = new SpecStore({ authTimeout: 500 })) {
  let knownProjects = null;
  try { knownProjects = await store.projectNames(); } catch {}
  return resolveProject(startDir, { knownProjects, rootsFile: projectRootsFile(store) });
}

const BACKGROUND = "Background Memo is on: after the session a worker records what qualifies. During the session, change memory only when the user explicitly asks to record, correct, or remove something; do not offer to record.";
const background = config => config.background !== false;
const GUIDE = "Memory entries below are short facts this agent cannot find in the code: rules, pitfalls, environment, and decisions. Follow them; check an entry against the code when they disagree. Read listed docs and tasks with spec_read.";

export async function loadProjectContext(cwd) {
  const store = new SpecStore({ authTimeout: 500 });
  const config = store.config();
  if (!config.enabled || process.env.GEI_MEMO_WORKER === "1") return "";
  const project = await resolveWorkspace(cwd, store);
  if (project.projectExists) rememberProjectRoot(projectRootsFile(store), project.projectId, project.projectRoot);
  const scope = `projects/${project.projectId}/`;
  const result = await store.startup(scope);
  const via = project.parent ? ` (parent workspace ${project.parent.root}; ${project.ownProjectId} has no memory)` : "";
  const header = [`Gei project memory · ${project.projectId}${via} · checkout ${project.checkoutRoot}`, GUIDE,
    background(config) ? BACKGROUND : "Background Memo is off: record what qualifies with the Memo skill before the final reply.",
    ...(result.memory || result.index ? [] : [`No memory for this project yet; the first add_entry on ${scope}MEMORY.md creates it.`])].join("\n");
  return scopeContext(header, scope, result);
}

export async function loadSharedContext() {
  const store = new SpecStore({ authTimeout: 500 });
  const config = store.config();
  if (!config.enabled || process.env.GEI_MEMO_WORKER === "1") return "";
  const result = await store.startup("context/");
  if (!result.memory && !result.index) return "";
  return scopeContext("Gei shared memory · applies across projects; a project entry that conflicts wins.", "context/", result);
}
