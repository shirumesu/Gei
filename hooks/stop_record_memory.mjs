#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const LEARN_MARKERS = [
  "Learn checked:",
  "Learn write:",
  "Memory checked:",
  "Memory applied:",
  "Memory skipped:",
  "No learn:",
];

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

function hasUnreconciledWork(specRoot) {
  const currentWorkPath = path.join(specRoot, "current-work.md");
  if (!fs.existsSync(currentWorkPath)) return false;

  const currentWork = fs.readFileSync(currentWorkPath, "utf8");
  return (
    /- Status: (active|paused|closed)\b/.test(currentWork) ||
    /- Promotion: pending\b/.test(currentWork)
  );
}

function hasLearnMarker(message) {
  return (
    typeof message === "string" &&
    LEARN_MARKERS.some((marker) => message.includes(marker))
  );
}

function hasActiveBackgroundWork(hookInput) {
  const backgroundTasks = Array.isArray(hookInput.background_tasks)
    ? hookInput.background_tasks
    : [];
  const sessionCrons = Array.isArray(hookInput.session_crons)
    ? hookInput.session_crons
    : [];

  return backgroundTasks.length > 0 || sessionCrons.length > 0;
}

const hookInput = readHookInput();

if (hookInput.stop_hook_active || hasActiveBackgroundWork(hookInput)) {
  process.exit(0);
}

const projectDir = findSpecProjectDir(getHookStartDir(hookInput));
if (!projectDir) process.exit(0);

const specRoot = path.join(projectDir, "spec");
if (!fs.existsSync(path.join(specRoot, "MEMORY.md"))) process.exit(0);
if (!hasUnreconciledWork(specRoot)) process.exit(0);
if (hasLearnMarker(hookInput.last_assistant_message)) process.exit(0);

writeBlock(
  [
    "Before stopping, run the Gei Learn close check for this anchored task.",
    "",
    "1. Scan the injected spec/MEMORY.md index and read any linked entry whose Read when trigger matches the current task.",
    "2. Decide whether this turn produced a durable memory candidate: user correction, repeated failure, hidden constraint, operational convention, non-obvious gotcha, or explicit remember/forget request.",
    "3. If a candidate should be saved, use the learn Skill write gate and update spec/MEMORY.md plus spec/memory/*.md. If not, do not write memory.",
    "4. Include one marker in the final response: Memory applied: , Learn write:, or Learn checked: no memory write needed.",
  ].join("\n"),
);
