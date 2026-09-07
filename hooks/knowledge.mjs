import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const SCHEMA_VERSION = 3;
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

function comparablePath(value) {
  const normalized = normalizeRoot(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

export function projectIdForRoot(value) {
  const root = normalizeRoot(value);
  const slug = path.basename(root).normalize("NFKC").trim().toLowerCase()
    .replace(/\s+/gu, "-").replace(/[^\p{Letter}\p{Number}._-]+/gu, "-")
    .replace(/^[._-]+|[._-]+$/gu, "") || "project";
  const hash = createHash("sha256").update(comparablePath(root)).digest("hex").slice(0, 12);
  return `${slug}-${hash}`;
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
  // Normal repositories and linked worktrees retain the original root id.
  const projectRoot = path.basename(gitCommonDir) === ".git"
    ? path.dirname(gitCommonDir) : gitCommonDir;
  const checkoutRoot = checkout ? normalizeRoot(checkout) : projectRoot;
  return { checkoutRoot, projectRoot, gitCommonDir };
}

export function resolveProject(startDir, { geiSpecHome = getGeiSpecHome() } = {}) {
  const repository = resolveRepository(startDir);
  const projectId = projectIdForRoot(repository.projectRoot);
  const projectsRoot = path.join(geiSpecHome, "projects");
  let specRoot = path.join(projectsRoot, projectId);
  let manifestText = readOptional(path.join(specRoot, "project.json"));
  // Explicit root/alias edits preserve identity when a project moves.
  if (!manifestText && fs.existsSync(projectsRoot)) {
    const matches = [];
    for (const entry of fs.readdirSync(projectsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidateRoot = path.join(projectsRoot, entry.name);
      const raw = readOptional(path.join(candidateRoot, "project.json"));
      if (!raw) continue;
      let candidate;
      try { candidate = JSON.parse(raw); } catch { continue; }
      if (!candidate || typeof candidate !== "object") continue;
      const aliases = Array.isArray(candidate.aliases) ? candidate.aliases : [];
      const roots = [candidate.root, ...aliases].filter(x => typeof x === "string");
      const matched = roots.find(root => {
        return comparablePath(root) === comparablePath(repository.checkoutRoot)
          || comparablePath(root) === comparablePath(repository.projectRoot);
      });
      const commonMatch = repository.gitCommonDir && typeof candidate.gitCommonDir === "string"
        && comparablePath(candidate.gitCommonDir) === comparablePath(repository.gitCommonDir);
      if (matched || commonMatch) matches.push({ candidateRoot, raw });
    }
    if (matches.length > 1) throw new Error("Multiple project manifests match this directory; fix their roots or aliases.");
    if (matches.length === 1) {
      specRoot = matches[0].candidateRoot;
      manifestText = matches[0].raw;
    }
  }
  const manifest = manifestText ? JSON.parse(manifestText) : {
    schemaVersion: SCHEMA_VERSION, id: projectId,
    name: path.basename(repository.projectRoot), root: repository.projectRoot,
    ...(repository.gitCommonDir ? { gitCommonDir: repository.gitCommonDir } : {}),
  };
  if (!manifest || manifest.id !== path.basename(specRoot) || typeof manifest.root !== "string") {
    throw new Error(`Invalid project manifest: ${specRoot}`);
  }
  return { ...repository, projectId: manifest.id, specRoot, manifest,
    manifestExists: Boolean(manifestText), geiSpecHome };
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
  fs.mkdirSync(project.specRoot, { recursive: true });
  publishMissing(path.join(project.specRoot, "project.json"), `${JSON.stringify(project.manifest, null, 2)}\n`);
  const legacy = ["OVERVIEW.md", "ARCHITECTURE.md", "IMPACTS.md", "MEMORY.md", "CHANGELOG.md"]
    .filter(name => fs.existsSync(path.join(project.specRoot, name)));
  const index = [`# ${project.manifest.name || "Workspace"}`, "",
    "Agent workspace allocated. Add reliable background and topic routes as work establishes them."];
  if (legacy.length) index.push("", "Legacy knowledge: use Memo migration before replacing these sources.",
    ...legacy.map(name => `- [${name}](${name})`));
  publishMissing(path.join(project.specRoot, "INDEX.md"), `${index.join("\n")}\n`);
  return { ...project, manifestExists: true };
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
    "Read matching INDEX routes -> topic -> relevant notes or source. Resolve source evidence against this checkout; verify branch-specific claims."].join("\n");
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
  return boundedIndex("Gei shared conditions: read only matching lessons; check their applicability.",
    indexPath, SHARED_INDEX_BYTES, SHARED_CONTEXT_BYTES);
}
