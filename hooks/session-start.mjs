#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(scriptDir, "..");
const skillPath = path.join(pluginRoot, "skills", "using-gei", "SKILL.md");

let usingGeiContent = "Error reading using-gei skill";
try {
  usingGeiContent = fs.readFileSync(skillPath, "utf8");
} catch {
  // Keep a readable failure marker in the injected context if the file is missing.
}

const sessionContext = [
  "<EXTREMELY_IMPORTANT>",
  "You are using Gei.",
  "",
  "**Below is the full content of your 'gei:using-gei' skill - your introduction to Gei routing and lifecycle:**",
  "",
  usingGeiContent,
  "",
  "_(The full using-gei skill content is already present above, injected at session start. You already have everything you need — there is no need to separately activate or load this skill file. Simply follow the routing and lifecycle instructions it contains.)_",
  "</EXTREMELY_IMPORTANT>",
].join("\n");

const OVERVIEW_LINE_WARNING = 250;

function readHookInput() {
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

function findSpecProjectDir(startDir) {
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

function buildProjectSpecFlag(projectDir) {
  const projectHasSpec = Boolean(projectDir);

  return [
    "<gei-project-spec>",
    `project_has_spec: ${projectHasSpec ? "true" : "false"}`,
    ...(projectHasSpec ? [`spec_root: ${path.join(projectDir, "spec")}`] : []),
  ];
}

function buildProjectSpecBlock(projectDir) {
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

// Claude Code persists/truncates large SessionStart additionalContext, so on Claude
// we inject only a small pointer to spec/OVERVIEW.md instead of inlining its full text.
function buildProjectSpecPointer(projectDir) {
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

    const overview = fs.readFileSync(overviewPath, "utf8");
    const lineCount = overview.trim() ? overview.split(/\r?\n/).length : 0;
    const warning =
      lineCount > OVERVIEW_LINE_WARNING
        ? [
            "",
            `Note: spec/OVERVIEW.md is ${lineCount} lines, above the ${OVERVIEW_LINE_WARNING}-line warning threshold. Tell the user this project should compress OVERVIEW.md.`,
          ]
        : [];

    return [
      ...base,
      "",
      "The current project maintains a spec/ system. The full spec/OVERVIEW.md is intentionally NOT inlined here.",
      `Read spec/OVERVIEW.md now for this project's cold-start context: ${overviewPath}`,
      "After reading it, use it to choose the next context surface. Do not read ARCHITECTURE.md, current-work.md, CHANGELOG.md, or spec/docs/ by default.",
      "Read ARCHITECTURE.md when durable structure, routing, data flow, module boundaries, or cross-file impact context is needed.",
      "Read current-work.md for recent task memory, active/paused file-changing work, release/debug reconciliation, or before file edits as required by the Gei lifecycle.",
      "Treat confidence in this order: repository code/config/tests first, current-work.md as recent task memory second, durable spec files third because they may lag until promotion.",
      ...warning,
      "</gei-project-spec>",
    ].join("\n");
  } catch {
    return "";
  }
}

const hookInput = readHookInput();
const projectDir = findSpecProjectDir(
  typeof hookInput.cwd === "string" && hookInput.cwd
    ? hookInput.cwd
    : process.env.CLAUDE_PROJECT_DIR || process.cwd(),
);
// Claude Code sets CLAUDE_* env vars for hook commands; Codex does not. Detect
// Claude positively and default to Codex, so a miss degrades to full injection
// (the existing Codex behavior) rather than breaking Codex.
const isClaudeCode = Boolean(
  (typeof hookInput.source === "string" && typeof hookInput.model === "string") ||
    process.env.CLAUDECODE ||
    process.env.CLAUDE_CODE_ENTRYPOINT ||
    process.env.CLAUDE_PROJECT_DIR ||
    process.env.CLAUDE_PLUGIN_ROOT,
);

// Codex receives the full OVERVIEW inline; Claude Code only gets a pointer flag
// because it persists/truncates large SessionStart additionalContext.
const projectSpecBlock = isClaudeCode
  ? buildProjectSpecPointer(projectDir)
  : buildProjectSpecBlock(projectDir);
const additionalContext = `${sessionContext}\n\n${projectSpecBlock}`;

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
