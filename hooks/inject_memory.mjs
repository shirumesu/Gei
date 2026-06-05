#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(scriptDir, "..");
const MEMORY_LINE_WARNING = 100;

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

function buildMemoryIndexBlock(projectDir) {
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

const hookInput = readHookInput();
const projectDir = findSpecProjectDir(getHookStartDir(hookInput));

writeSessionStartContext(buildMemoryIndexBlock(projectDir));
