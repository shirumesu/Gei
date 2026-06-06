#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

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

function writeBlock(reason) {
  process.stdout.write(
    `${JSON.stringify({ decision: "block", reason }, null, 2)}\n`,
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

const hookInput = readHookInput();

if (hookInput.stop_hook_active) {
  process.exit(0);
}

const projectDir = findSpecProjectDir(getHookStartDir(hookInput));
if (!projectDir) process.exit(0);

const specRoot = path.join(projectDir, "spec");
if (!fs.existsSync(path.join(specRoot, "MEMORY.md"))) process.exit(0);

writeBlock(
  [
    "Before stopping, run the Gei Learn close check for this turn.",
    "",
    "1. Scan the injected spec/MEMORY.md index and read any linked entry whose Read when trigger matches the current task.",
    "2. Decide whether this turn produced a durable memory candidate: user correction, repeated failure, hidden constraint, operational convention, non-obvious gotcha, or explicit remember/forget request.",
    "3. If a candidate should be saved, use the learn Skill write gate and update spec/MEMORY.md plus spec/memory/*.md. If not, do not write memory.",
    "4. Include one marker in the final response: Memory applied:, Memory checked:, Memory skipped:, Learn write:, or Learn checked: no memory write needed.",
  ].join("\n"),
);
