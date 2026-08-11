import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const GEISPEC_SCHEMA_VERSION = 2;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultTemplateRoot = path.resolve(
  scriptDir,
  "..",
  "skills",
  "memo",
  "templates",
);

export function getGeiSpecHome(env = process.env) {
  const configured =
    typeof env.GEI_SPEC_HOME === "string" ? env.GEI_SPEC_HOME.trim() : "";
  const tildeMatch = configured.match(/^~[\\/](.*)$/u);
  const expanded =
    configured === "~"
      ? os.homedir()
      : tildeMatch
        ? path.join(os.homedir(), tildeMatch[1])
        : configured;
  return path.resolve(expanded || path.join(os.homedir(), ".agents", "geispec"));
}

export function getHookStartDir(hookInput, env = process.env) {
  return typeof hookInput.cwd === "string" && hookInput.cwd
    ? hookInput.cwd
    : env.CLAUDE_PROJECT_DIR || process.cwd();
}

export function readHookInput() {
  if (process.stdin.isTTY) return {};

  try {
    const raw = fs.readFileSync(0, "utf8");
    if (!raw.trim()) return {};
    const input = JSON.parse(raw);
    return input && typeof input === "object" ? input : {};
  } catch {
    return {};
  }
}

export function writeSessionStartContext(additionalContext) {
  if (typeof additionalContext !== "string" || !additionalContext.trim()) return;
  process.stdout.write(
    `${JSON.stringify(
      {
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext,
        },
      },
      null,
      2,
    )}\n`,
  );
}

export function normalizeProjectRoot(value) {
  const resolved = path.resolve(value);
  try {
    return fs.realpathSync.native(resolved);
  } catch {
    return resolved;
  }
}

function comparablePath(value) {
  const normalized = path.normalize(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function slugify(value) {
  const slug = value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, "-")
    .replace(/[^\p{Letter}\p{Number}._-]+/gu, "-")
    .replace(/^[._-]+|[._-]+$/gu, "");
  return slug || "project";
}

export function projectIdForRoot(value) {
  const root = normalizeProjectRoot(value);
  const hash = createHash("sha256")
    .update(comparablePath(root))
    .digest("hex")
    .slice(0, 12);
  return `${slugify(path.basename(root))}-${hash}`;
}

function readJsonFile(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function renderTemplate(text, replacements) {
  return Object.entries(replacements).reduce(
    (rendered, [key, value]) => rendered.split(`{{${key}}}`).join(value),
    text,
  );
}

function writeMissingFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    fs.writeFileSync(filePath, content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

function copyMissingTemplateTree(sourceRoot, targetRoot, replacements) {
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`GeiSpec template directory not found: ${sourceRoot}`);
  }

  fs.mkdirSync(targetRoot, { recursive: true });
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = path.join(sourceRoot, entry.name);
    const target = path.join(targetRoot, entry.name);
    if (entry.isDirectory()) {
      copyMissingTemplateTree(source, target, replacements);
      continue;
    }
    if (!entry.isFile()) continue;
    const content = renderTemplate(fs.readFileSync(source, "utf8"), replacements);
    writeMissingFile(target, content);
  }
}

function templateOptions(options = {}) {
  return {
    geiSpecHome: options.geiSpecHome || getGeiSpecHome(options.env),
    templateRoot: options.templateRoot || defaultTemplateRoot,
  };
}

export function ensureProject(startDir, options = {}) {
  const { geiSpecHome, templateRoot } = templateOptions(options);
  const projectRoot = normalizeProjectRoot(startDir);
  const projectId = projectIdForRoot(projectRoot);
  const projectDir = path.join(geiSpecHome, "projects", projectId);
  const projectName = path.basename(projectRoot) || projectId;

  copyMissingTemplateTree(path.join(templateRoot, "project"), projectDir, {
    PROJECT_ID: projectId,
    PROJECT_ID_JSON: JSON.stringify(projectId),
    PROJECT_NAME: projectName,
    PROJECT_NAME_JSON: JSON.stringify(projectName),
    PROJECT_ROOT: projectRoot,
    PROJECT_ROOT_JSON: JSON.stringify(projectRoot),
  });

  const manifest = readJsonFile(path.join(projectDir, "project.json"));
  if (!manifest || manifest.id !== projectId) {
    throw new Error(`Invalid GeiSpec project manifest: ${projectDir}`);
  }

  return {
    projectId,
    projectDir,
    projectRoot,
    specRoot: projectDir,
    manifest,
    geiSpecHome,
  };
}

export function ensureContext(options = {}) {
  const { geiSpecHome, templateRoot } = templateOptions(options);
  const contextRoot = path.join(geiSpecHome, "context");
  copyMissingTemplateTree(path.join(templateRoot, "context"), contextRoot, {});
  return {
    contextRoot,
    memoryPath: path.join(contextRoot, "MEMORY.md"),
    geiSpecHome,
  };
}

function readProjectById(geiSpecHome, projectId) {
  if (
    typeof projectId !== "string" ||
    !projectId ||
    projectId === "." ||
    projectId === ".." ||
    path.basename(projectId) !== projectId
  ) {
    return null;
  }
  const projectDir = path.join(geiSpecHome, "projects", projectId);
  const manifest = readJsonFile(path.join(projectDir, "project.json"));
  if (!manifest || manifest.id !== projectId) return null;
  return {
    projectId,
    projectDir,
    projectRoot: manifest.root || null,
    specRoot: projectDir,
    manifest,
  };
}

function normalizedMembers(manifest) {
  if (!Array.isArray(manifest.members)) return [];
  return manifest.members
    .map((member) =>
      typeof member === "string"
        ? { project: member, role: "member" }
        : member && typeof member.project === "string"
          ? { project: member.project, role: member.role || "member" }
          : null,
    )
    .filter(Boolean);
}

export function findProjectGroups(project, options = {}) {
  const geiSpecHome = options.geiSpecHome || project.geiSpecHome;
  const groupsRoot = path.join(geiSpecHome, "groups");
  if (!fs.existsSync(groupsRoot)) return [];

  const groups = [];
  for (const entry of fs.readdirSync(groupsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const groupDir = path.join(groupsRoot, entry.name);
    const manifest = readJsonFile(path.join(groupDir, "group.json"));
    if (!manifest || typeof manifest.id !== "string") continue;
    const members = normalizedMembers(manifest);
    if (!members.some((member) => member.project === project.projectId)) continue;
    groups.push({
      groupId: manifest.id,
      groupDir,
      specRoot: groupDir,
      manifest,
      members: members.map((member) => ({
        ...member,
        resolved: readProjectById(geiSpecHome, member.project),
      })),
    });
  }
  return groups.sort((left, right) => left.groupId.localeCompare(right.groupId));
}

export function readMeaningfulDocument(filePath, { bootstrap = false } = {}) {
  try {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content || content.includes("<!-- gei:empty -->")) return "";
    if (!bootstrap && content.includes("<!-- gei:uninitialized -->")) return "";
    return content;
  } catch {
    return "";
  }
}

export function formatGroupMembers(group) {
  return group.members
    .map((member) => {
      const resolved = member.resolved;
      if (!resolved) return `- ${member.project} (${member.role}; unresolved)`;
      return `- ${resolved.manifest.name || member.project} (${member.role}): root=${resolved.projectRoot}; spec=${resolved.specRoot}`;
    })
    .join("\n");
}
