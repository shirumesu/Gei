import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { hookContext } from "../skills/memo/scripts/spec/context.mjs";
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
  return resolveProject(startDir, { knownProjects: await store.projectNames(), rootsFile: projectRootsFile(store) });
}

// Each SessionStart hook injects one document, or nothing when it is empty or Spec is disabled.
async function load(name, header) {
  const store = new SpecStore({ authTimeout: 500 });
  if (!store.config().enabled) return "";
  return hookContext(header, name, await store.startup(name));
}

export const loadAgents = () => load("AGENTS.md",
  "# Gei AGENTS.md\nShared instructions for every project. Change this file only when the user explicitly asks.");

export const loadShared = () => load("context/MEMORY.md",
  "# Gei shared memory (context/MEMORY.md)\nApplies across projects; a project memory that conflicts wins. Read linked files with spec_read.");

export async function loadProject(cwd) {
  const store = new SpecStore({ authTimeout: 500 });
  if (!store.config().enabled) return "";
  const project = await resolveWorkspace(cwd, store);
  if (!project.projectExists) return "";
  rememberProjectRoot(projectRootsFile(store), project.projectId, project.projectRoot);
  const name = `projects/${project.projectId}/MEMORY.md`;
  const via = project.parent ? `; parent workspace ${project.parent.root}` : "";
  return hookContext(`# Gei project memory · ${project.projectId} (${name}${via})\nRead linked files with spec_read.`, name, await store.startup(name));
}
