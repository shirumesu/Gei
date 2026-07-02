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

function buildProjectSpecBlock(projectDir) {
  try {
    if (!projectDir) {
      return "";
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
      "Gei project overview context",
      "",
      "This project maintains a Gei spec/ system. The spec/OVERVIEW.md content below is its cold-start context: read it first to recover the project's purpose and document map, then use it to choose which spec surface to read next.",
      "Do not read spec/ARCHITECTURE.md, spec/CHANGELOG.md, or spec/docs/ by default. Open them only on demand:",
      "- Read spec/ARCHITECTURE.md when you need durable structure, routing, data flow, module boundaries, or cross-file impact.",
      "- Read spec/CHANGELOG.md `## Unreleased` for recent closed work, then released sections when older closed work may affect the decision.",
      "Trust sources in this order: repository code/config/tests first; spec/CHANGELOG.md `## Unreleased` (recent task memory) second; durable spec files (OVERVIEW, ARCHITECTURE, released CHANGELOG) third, since they may lag until Memo promotion.",
      ...warning,
      "",
      "--- spec/OVERVIEW.md ---",
      overview,
      "------------------------",
    ].join("\n");
  } catch {
    return "";
  }
}

const hookInput = readHookInput();
const projectDir = findSpecProjectDir(getHookStartDir(hookInput));

writeSessionStartContext(buildProjectSpecBlock(projectDir));
