import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const SCHEMA_VERSION = 3;
export const PROJECT_INDEX_BYTES = 3072;
export const SHARED_INDEX_BYTES = 1024;
export const CONTEXT_BYTES = 7168;

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
    systemMessage: `Gei ${operation} failed: ${error.message || String(error)}`,
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
  const normalized = path.normalize(value);
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
  let output;
  try {
    output = execFileSync("git", ["-C", cwd, "rev-parse", "--path-format=absolute",
      "--show-toplevel", "--git-common-dir"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 2000,
      windowsHide: true,
    });
  } catch (error) {
    if (error.code === "ENOENT" || /not a git repository/iu.test(String(error.stderr))) {
      return { checkoutRoot: cwd, projectRoot: cwd, gitCommonDir: null };
    }
    throw error;
  }
  const [checkout, common] = output.trim().split(/\r?\n/u);
  const checkoutRoot = normalizeRoot(checkout);
  const gitCommonDir = normalizeRoot(common);
  // Normal repositories and linked worktrees retain the original root id.
  const projectRoot = path.basename(gitCommonDir) === ".git"
    ? path.dirname(gitCommonDir) : gitCommonDir;
  return { checkoutRoot, projectRoot, gitCommonDir };
}

export function resolveProject(startDir, { geiSpecHome = getGeiSpecHome() } = {}) {
  const repository = resolveRepository(startDir);
  const projectId = projectIdForRoot(repository.projectRoot);
  const projectsRoot = path.join(geiSpecHome, "projects");
  let specRoot = path.join(projectsRoot, projectId);
  let manifestText = readOptional(path.join(specRoot, "project.json"));
  let matchedRoot;
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
        const relative = path.relative(comparablePath(root), comparablePath(repository.checkoutRoot));
        return relative === "" || comparablePath(root) === comparablePath(repository.projectRoot)
          || (!repository.gitCommonDir && relative !== ".."
          && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
      });
      if (matched) matches.push({ candidateRoot, raw, matchedRoot: matched });
    }
    if (matches.length > 1) throw new Error("Multiple project manifests match this directory; fix their roots or aliases.");
    if (matches.length === 1) {
      specRoot = matches[0].candidateRoot;
      manifestText = matches[0].raw;
      matchedRoot = matches[0].matchedRoot;
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
  const checkoutRoot = !repository.gitCommonDir && matchedRoot
    ? normalizeRoot(matchedRoot) : repository.checkoutRoot;
  return { ...repository, checkoutRoot, projectId: manifest.id, specRoot, manifest,
    manifestExists: Boolean(manifestText), geiSpecHome };
}

export function clipLines(content, maxBytes, suffix = "\n[Clipped: read the source index if relevant; shorten it during maintenance.]") {
  if (Buffer.byteLength(content, "utf8") <= maxBytes) return content;
  const lines = [];
  const budget = Math.max(0, maxBytes - Buffer.byteLength(suffix, "utf8"));
  for (const line of content.split(/\r?\n/u)) {
    if (Buffer.byteLength([...lines, line].join("\n"), "utf8") > budget) break;
    lines.push(line);
  }
  return lines.join("\n") + suffix;
}

function indexBlock(indexPath, budget) {
  const content = readOptional(indexPath).replace(/<!--[\s\S]*?-->/gu, "").trim();
  return content ? `Index: ${indexPath}\n${clipLines(content, budget)}` : "";
}

function legacyBlock(root) {
  const names = ["OVERVIEW.md", "ARCHITECTURE.md", "IMPACTS.md", "MEMORY.md", "CHANGELOG.md"]
    .filter(name => fs.existsSync(path.join(root, name)));
  return names.length
    ? `Legacy files in ${root}: ${names.join(", ")}. Use memo references/migrate.md to build INDEX.md from relevant verified knowledge; preserve originals until links and unique lessons are accounted for.`
    : "";
}

export function buildProjectContext(startDir, options = {}) {
  const project = resolveProject(startDir, options);
  const indexPath = path.join(project.specRoot, "INDEX.md");
  const sharedRoot = path.join(project.geiSpecHome, "context");
  const policy = [
    "Gei external project knowledge",
    `Checkout: ${project.checkoutRoot}`,
    `Knowledge: ${project.specRoot}`,
    `Shared: ${sharedRoot}`,
    "Read matching INDEX routes -> topic README -> relevant notes/code only. Search that topic by business terms and decision criteria; widen only for a concrete dependency. Stop when scope, constraints and verification are clear.",
    "Existing user/project instructions govern. Code establishes current behavior; accepted requirements establish the target. Notes are scoped evidence, not universal rules. Recheck old tradeoff conditions before applying them to new alternatives.",
    "You own this external knowledge. Write/update it autonomously in this task when background becomes clear, a decision is accepted, a reusable pitfall is verified, a route becomes stale, or a handoff is needed. No separate user confirmation; honor host filesystem permissions. Do not merely offer to remember. Use memo for maintenance; ordinary reading needs no skill load.",
    "Keep agent-readable facts and retrieval cues terse. No repository scaffolding, transcripts, routine changelog or whole-store audit. Resolve repo-relative evidence against this checkout and verify branch-specific claims. Briefly report meaningful writes; silence when nothing merits writing.",
  ].join("\n");
  const projectIndex = indexBlock(indexPath, PROJECT_INDEX_BYTES);
  const blocks = [policy];
  if (!project.manifestExists) {
    blocks.push(`On the first useful write, create project.json here with: ${JSON.stringify(project.manifest)}`);
  }
  blocks.push(projectIndex || `No usable INDEX.md at ${indexPath}. Recover focused project evidence, then create a short background/working-agreements/topic-routing index autonomously when the task reveals reliable context. Do not fill unknowns.`);
  if (!projectIndex) blocks.push(legacyBlock(project.specRoot));
  const sharedIndex = indexBlock(path.join(sharedRoot, "INDEX.md"), SHARED_INDEX_BYTES);
  if (sharedIndex) blocks.push(sharedIndex);
  else blocks.push(legacyBlock(sharedRoot));
  return clipLines(blocks.filter(Boolean).join("\n\n"), CONTEXT_BYTES);
}
