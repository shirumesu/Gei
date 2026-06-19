#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(scriptDir, "..");
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

function writeSessionStartContext(additionalContext) {
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

function getHookStartDir(hookInput) {
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
      "Use it to choose the next context surface. Do not read ARCHITECTURE.md, CHANGELOG.md, or spec/docs/ by default.",
      "Read ARCHITECTURE.md when durable structure, routing, data flow, module boundaries, or cross-file impact context is needed.",
      "Read CHANGELOG.md `## Unreleased` for recent closed work, then released sections when older closed work may affect the decision.",
      "Treat confidence in this order: repository code/config/tests first, CHANGELOG.md `## Unreleased` as recent task memory second, durable spec files third because they may lag until promotion.",
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

const hookInput = readHookInput();
const projectDir = findSpecProjectDir(getHookStartDir(hookInput));

writeSessionStartContext(buildProjectSpecBlock(projectDir));
