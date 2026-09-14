import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { parseDocument } from "../skills/memo/scripts/spec/metadata.mjs";

export const PROJECT_INDEX_BYTES = 3072;
export const SHARED_INDEX_BYTES = 1024;
export const CONTEXT_BYTES = 4096;
export const SHARED_CONTEXT_BYTES = 1536;

export function getGeiSpecHome(env = process.env) {
  const configured = env.GEI_SPEC_HOME?.trim() || "";
  const expanded = configured === "~" ? os.homedir()
    : configured.replace(/^~[\\/]/u, `${os.homedir()}${path.sep}`);
  return path.resolve(expanded || path.join(os.homedir(), ".agents", "geispec"));
}

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
  process.stdout.write(`${JSON.stringify({
    systemMessage: clipLines(`Gei ${operation} failed.\n${error.message || String(error)}`, 1024,
      "\n[Error detail clipped.]"),
  })}\n`);
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

function readOptional(filePath) {
  try { return fs.readFileSync(filePath, "utf8"); }
  catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
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

export function resolveProject(startDir, { geiSpecHome = getGeiSpecHome() } = {}) {
  const repository = resolveRepository(startDir);
  const projectId = projectIdForRoot(repository.projectRoot);
  const projectsRoot = path.join(geiSpecHome, "projects");
  const specRoot = path.join(projectsRoot, projectId);
  const legacyRoots = [];
  if (fs.existsSync(projectsRoot)) {
    for (const entry of fs.readdirSync(projectsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === projectId) continue;
      const candidateRoot = path.join(projectsRoot, entry.name);
      if (entry.name.replace(/-[a-f0-9]{12}$/u, "") === projectId) {
        legacyRoots.push(candidateRoot);
        continue;
      }
      const raw = readOptional(path.join(candidateRoot, "project.json"));
      if (!raw) continue;
      let candidate;
      try { candidate = JSON.parse(raw); } catch { continue; }
      if (!candidate || typeof candidate !== "object") continue;
      const names = [candidate.name, candidate.root, candidate.gitCommonDir,
        ...(Array.isArray(candidate.aliases) ? candidate.aliases : [])]
        .filter(value => typeof value === "string")
        .map(value => projectName(value.replace(/\\/gu, "/").replace(/\/\.git\/?$/u, "")
          .replace(/\/$/u, "").split("/").pop()));
      if (names.includes(projectId)) legacyRoots.push(candidateRoot);
    }
  }
  return { ...repository, projectId, specRoot, legacyRoots, geiSpecHome };
}

export function clipLines(content, maxBytes, suffix = "\n[Clipped: read the source index if relevant; shorten it during maintenance.]") {
  if (Buffer.byteLength(content, "utf8") <= maxBytes) return content;
  const lines = [];
  const budget = maxBytes - Buffer.byteLength(suffix, "utf8");
  if (budget < 0) return "";
  let used = 0;
  for (const line of content.split(/\r?\n/u)) {
    const size = Buffer.byteLength(line, "utf8") + (lines.length ? 1 : 0);
    if (used + size > budget) break;
    lines.push(line);
    used += size;
  }
  return lines.join("\n") + suffix;
}

function publishMissing(filePath, content) {
  if (fs.existsSync(filePath)) return;
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, content, { flag: "wx" });
  try {
    // Publish complete bytes without replacing another session's file.
    try { fs.linkSync(temporary, filePath); }
    catch (error) { if (error.code !== "EEXIST") throw error; }
  } finally { fs.unlinkSync(temporary); }
}

export function ensureWorkspace(startDir, options = {}) {
  const project = resolveProject(startDir, options);
  if (project.legacyRoots.length) {
    throw new Error(`Legacy knowledge needs Memo migration into ${project.specRoot}. Merge and repair links before moving old directories out of projects: ${project.legacyRoots.join(", ")}`);
  }
  fs.mkdirSync(project.specRoot, { recursive: true });
  const legacy = ["OVERVIEW.md", "ARCHITECTURE.md", "IMPACTS.md", "MEMORY.md", "CHANGELOG.md"]
    .filter(name => fs.existsSync(path.join(project.specRoot, name)));
  const index = [`# ${project.projectId}`, "",
    "Agent workspace allocated. Add reliable background and topic routes as work establishes them."];
  if (legacy.length) index.push("", "Legacy knowledge: use Memo migration before replacing these sources.",
    ...legacy.map(name => `- [${name}](${name})`));
  publishMissing(path.join(project.specRoot, "INDEX.md"), `${index.join("\n")}\n`);
  return project;
}

function boundedIndex(header, indexPath, indexBudget, totalBudget) {
  const content = readOptional(indexPath).replace(/<!--[\s\S]*?-->/gu, "").trim();
  const prefix = `${header}\nIndex: ${indexPath}\n\n`;
  const available = Math.min(indexBudget, totalBudget - Buffer.byteLength(prefix));
  return clipLines(prefix + clipLines(content || "Index is empty; maintain it through Memo when context is known.", available), totalBudget);
}

export function buildProjectContext(startDir, options = {}) {
  const project = ensureWorkspace(startDir, options);
  const header = ["Gei agent workspace", `Checkout: ${project.checkoutRoot}`,
    `Knowledge: ${project.specRoot}`,
    "INDEX content is supplied below; follow matching links directly without rereading INDEX. Resolve source evidence against this checkout; verify branch-specific claims."].join("\n");
  return boundedIndex(header, path.join(project.specRoot, "INDEX.md"), PROJECT_INDEX_BYTES, CONTEXT_BYTES);
}

export function buildSharedContext({ geiSpecHome = getGeiSpecHome() } = {}) {
  const root = path.join(geiSpecHome, "context");
  const indexPath = path.join(root, "INDEX.md");
  if (!fs.existsSync(indexPath)) {
    return fs.existsSync(path.join(root, "MEMORY.md"))
      ? clipLines(`Gei shared legacy knowledge: ${path.join(root, "MEMORY.md")}. Read only when relevant; migrate through Memo.`, SHARED_CONTEXT_BYTES)
      : "";
  }
  return boundedIndex("Gei shared conditions: INDEX content is supplied below; follow matching lesson links directly without rereading INDEX. Check their applicability.",
    indexPath, SHARED_INDEX_BYTES, SHARED_CONTEXT_BYTES);
}

function toolContext(header, name, result, indexBudget, totalBudget) {
  const state = result.stale ? "offline cache" : result.source;
  const prefix = `${header}\nSpec: ${result.mode}; ${state}${result.checkedAt ? `; checked ${result.checkedAt}` : ""}\nIndex: ${name}\nUse spec_read/search/edit with knowledge-relative paths. CLI fallback: skills/memo/scripts/spec/cli.mjs in the installed Gei package.\n${result.maintenance ? result.maintenance + "\n" : ""}\n`;
  const content = parseDocument(result.content).body.replace(/<!--[\s\S]*?-->/gu, "").trim()
    || "Index is unavailable or not yet created. Read this path with spec_read before creating knowledge.";
  return clipLines(prefix + clipLines(content, Math.min(indexBudget, totalBudget - Buffer.byteLength(prefix))), totalBudget);
}

export async function loadProjectContext(cwd) {
  const store = new SpecStore({ authTimeout: 500 });
  if (!store.config().enabled) return "";
  const project = resolveProject(cwd);
  if (project.legacyRoots.length) throw new Error(`Legacy knowledge needs Memo migration into ${project.specRoot}. Merge and repair links before moving old directories: ${project.legacyRoots.join(", ")}`);
  const name = `projects/${project.projectId}/INDEX.md`;
  const legacy = ["OVERVIEW.md", "ARCHITECTURE.md", "IMPACTS.md", "MEMORY.md", "CHANGELOG.md"]
    .filter(file => fs.existsSync(path.join(project.specRoot, file)));
  const initialContent = [`# ${project.projectId}`, "", "Agent workspace allocated. Add reliable background and topic routes as work establishes them.",
    ...(legacy.length ? ["", "Legacy knowledge: use Memo migration before replacing these sources.", ...legacy.map(file => `- [${file}](${file})`)] : [])].join("\n") + "\n";
  const result = await store.index(name, { allocate: true, initialContent });
  const hint = store.maintenanceHint(`projects/${project.projectId}/`);
  if (hint) result.maintenance = hint;
  return toolContext(`Gei agent workspace\nCheckout: ${project.checkoutRoot}\nProject: ${project.projectId}\nINDEX content is supplied below; follow matching links directly without rereading INDEX. Resolve source evidence against this checkout.`, name, result, PROJECT_INDEX_BYTES, CONTEXT_BYTES);
}

export async function loadSharedContext() {
  const store = new SpecStore({ authTimeout: 500 });
  if (!store.config().enabled) return "";
  const result = await store.index("context/INDEX.md");
  if (!result.content) return "";
  const hint = store.maintenanceHint("context/");
  if (hint) result.maintenance = hint;
  return toolContext("Gei shared conditions: INDEX content is supplied below; follow matching lesson links directly without rereading INDEX. Check their applicability.", "context/INDEX.md", result, SHARED_INDEX_BYTES, SHARED_CONTEXT_BYTES);
}
