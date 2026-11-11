// Which projects/<name>/ directory a workspace belongs to.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stateDir, storeDir } from "./store.mjs";

export function normalizeRoot(value) {
  const resolved = path.resolve(value);
  try { return fs.realpathSync.native(resolved); }
  catch (error) {
    if (error.code === "ENOENT") return resolved;
    throw error;
  }
}

export function projectName(value) {
  return value.normalize("NFKC").trim().toLowerCase()
    .replace(/\s+/gu, "-").replace(/[^\p{Letter}\p{Number}._-]+/gu, "-")
    .replace(/^[._-]+|[._-]+$/gu, "") || "project";
}

function resolveRepository(startDir) {
  const cwd = normalizeRoot(startDir);
  if (!fs.statSync(cwd).isDirectory()) throw new Error(`Not a workspace directory: ${cwd}`);
  let output;
  try {
    output = execFileSync("git", ["-C", cwd, "rev-parse", "--path-format=absolute",
      "--git-common-dir", "--show-toplevel"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 2000, windowsHide: true,
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
  const projectRoot = path.basename(gitCommonDir) === ".git" ? path.dirname(gitCommonDir) : gitCommonDir;
  const checkoutRoot = checkout ? normalizeRoot(checkout) : projectRoot;
  return { checkoutRoot, projectRoot, gitCommonDir };
}

const rootsFile = () => path.join(stateDir(), "roots.json");

function readRoots() {
  if (!fs.existsSync(rootsFile())) return {};
  const value = JSON.parse(fs.readFileSync(rootsFile(), "utf8"));
  return Object.fromEntries(Object.entries(value).map(([id, roots]) => [id, roots.filter(root => fs.existsSync(root))]));
}

function rememberRoot(projectId, root) {
  const roots = readRoots();
  if (roots[projectId]?.includes(root)) return;
  roots[projectId] = [...(roots[projectId] || []), root];
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(rootsFile(), JSON.stringify(Object.fromEntries(Object.entries(roots).filter(([, list]) => list.length)), null, 2) + "\n");
}

export function knownProjects() {
  const dir = path.join(storeDir(), "projects");
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name));
}

// A workspace whose own name has no memory belongs to the nearest parent directory (below
// home) whose name has some; roots.json keeps that from matching a same-named project elsewhere.
function parentProject(start, known, roots) {
  const home = normalizeRoot(os.homedir());
  if (start === home) return null;
  for (let dir = path.dirname(start); dir !== home && dir !== path.dirname(dir); dir = path.dirname(dir)) {
    const id = projectName(path.basename(dir));
    if (!known.has(id)) continue;
    const recorded = roots[id] || [];
    if (recorded.length && !recorded.includes(dir)) continue;
    return { projectId: id, root: dir };
  }
  return null;
}

export function resolveProject(startDir) {
  const repository = resolveRepository(startDir);
  const known = knownProjects();
  const ownId = projectName(path.basename(repository.projectRoot));
  const parent = known.has(ownId) ? null : parentProject(repository.projectRoot, known, readRoots());
  if (parent) {
    repository.projectRoot = parent.root;
    if (!repository.gitCommonDir) repository.checkoutRoot = parent.root;
  }
  const projectId = parent?.projectId || ownId;
  const exists = known.has(projectId);
  if (exists) rememberRoot(projectId, repository.projectRoot);
  return { ...repository, projectId, parent, exists };
}
