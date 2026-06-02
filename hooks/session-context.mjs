import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(scriptDir, "..");
export const OVERVIEW_LINE_WARNING = 250;
export const MEMORY_LINE_WARNING = 100;

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

export function findSpecProjectDir(startDir) {
  try {
    if (!startDir) return "";

    let current = path.resolve(startDir);
    while (true) {
      if (fs.existsSync(path.join(current, "spec", "OVERVIEW.md"))) {
        return current;
      }

      const parent = path.dirname(current);
      if (parent === current) return "";
      current = parent;
    }
  } catch {
    return "";
  }
}

export function getHookStartDir(hookInput) {
  return typeof hookInput.cwd === "string" && hookInput.cwd
    ? hookInput.cwd
    : process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function buildProjectSpecFlag(projectDir) {
  const projectHasSpec = Boolean(projectDir);

  return [
    "<gei-project-spec>",
    `project_has_spec: ${projectHasSpec ? "true" : "false"}`,
    ...(projectHasSpec ? [`spec_root: ${path.join(projectDir, "spec")}`] : []),
  ];
}

export function buildProjectSpecBlock(projectDir) {
  try {
    const base = buildProjectSpecFlag(projectDir);
    if (!projectDir) {
      return [
        ...base,
        "",
        "No complete Gei spec is present for the current project because spec/OVERVIEW.md was not found.",
        "</gei-project-spec>",
      ].join("\n");
    }

    const specRoot = path.join(projectDir, "spec");
    const overviewPath = path.join(specRoot, "OVERVIEW.md");
    if (!fs.existsSync(overviewPath)) return "";

    const overview = fs.readFileSync(overviewPath, "utf8").trimEnd();
    const lineCount = overview ? overview.split(/\r?\n/).length : 0;
    const warning =
      lineCount > OVERVIEW_LINE_WARNING
        ? [
            "",
            `Warning: spec/OVERVIEW.md is ${lineCount} lines, above the ${OVERVIEW_LINE_WARNING}-line warning threshold.`,
            "Keep using the full injected overview, but tell the user during the task or final handoff that this project should compress OVERVIEW.md.",
          ]
        : [];

    return [
      ...base,
      "",
      "The current project maintains a spec/ system. The injected spec/OVERVIEW.md content below is this project's cold-start context.",
      "Use it to choose the next context surface. Do not read ARCHITECTURE.md, current-work.md, CHANGELOG.md, or spec/docs/ by default.",
      "Read ARCHITECTURE.md when durable structure, routing, data flow, module boundaries, or cross-file impact context is needed.",
      "Read current-work.md for recent task memory, active/paused file-changing work, release/debug reconciliation, or before file edits as required by the Gei lifecycle.",
      "Treat confidence in this order: repository code/config/tests first, current-work.md as recent task memory second, durable spec files third because they may lag until promotion.",
      ...warning,
      "",
      "--- spec/OVERVIEW.md ---",
      overview,
      "------------------------",
      "</gei-project-spec>",
    ].join("\n");
  } catch {
    return "";
  }
}

export function buildMemoryIndexBlock(projectDir) {
  try {
    const base = buildProjectSpecFlag(projectDir);
    if (!projectDir) {
      return [
        ...base,
        "",
        "No MEMORY.md found for the current project.",
        "</gei-project-spec>",
      ].join("\n");
    }

    const specRoot = path.join(projectDir, "spec");
    const memoryPath = path.join(specRoot, "MEMORY.md");
    if (!fs.existsSync(memoryPath)) {
      return [
        ...base,
        "",
        "No spec/MEMORY.md found for the current project.",
        "</gei-project-spec>",
      ].join("\n");
    }

    const memory = fs.readFileSync(memoryPath, "utf8").trimEnd();
    const lineCount = memory ? memory.split(/\r?\n/).length : 0;
    const warning =
      lineCount > MEMORY_LINE_WARNING
        ? [
            "",
            `Warning: spec/MEMORY.md is ${lineCount} lines, above the ${MEMORY_LINE_WARNING}-line warning threshold.`,
            "Consider whether some entries should be consolidated or removed.",
          ]
        : [];

    return [
      ...base,
      "",
      "The current project maintains a spec/MEMORY.md index. The injected content below lists project-specific operational patterns.",
      "Read the linked memory files under spec/memory/ when working on related tasks.",
      ...warning,
      "",
      "--- spec/MEMORY.md ---",
      memory,
      "----------------------",
      "</gei-project-spec>",
    ].join("\n");
  } catch {
    return "";
  }
}
