#!/usr/bin/env node

import path from "node:path";
import {
  ensureContext,
  ensureProject,
  findProjectGroups,
  getHookStartDir,
  readHookInput,
  readMeaningfulDocument,
  writeSessionStartContext,
  writeSessionStartError,
} from "./geispec.mjs";

function memoryBlock(label, scopeRoot, memoryPath, memory) {
  return [
    `GeiSpec ${label} memory index`,
    "",
    `Scope root: ${scopeRoot}`,
    "This is a retrieval index. Read only linked entries whose summaries can change the current task.",
    "At task close, write a durable non-obvious lesson only when it passes Memo's memory gate. Keep no-write decisions silent.",
    "",
    `--- ${label} MEMORY: ${memoryPath} ---`,
    memory,
    "----------------------------------------",
  ].join("\n");
}

function contextMemory() {
  const context = ensureContext();
  const memory = readMeaningfulDocument(context.memoryPath);
  return memory
    ? memoryBlock("shared Context", context.contextRoot, context.memoryPath, memory)
    : "";
}

function projectMemory(project) {
  const memoryPath = path.join(project.specRoot, "MEMORY.md");
  const memory = readMeaningfulDocument(memoryPath);
  return memory
    ? memoryBlock("project", project.specRoot, memoryPath, memory)
    : "";
}

function groupMemories(project) {
  const blocks = [];
  for (const group of findProjectGroups(project)) {
    const memoryPath = path.join(group.specRoot, "MEMORY.md");
    const memory = readMeaningfulDocument(memoryPath);
    if (!memory) continue;
    blocks.push(memoryBlock("group", group.specRoot, memoryPath, memory));
  }
  return blocks.join("\n\n");
}

const hookInput = readHookInput();
const scope = process.argv[2] || "project";

try {
  if (scope === "context") {
    writeSessionStartContext(contextMemory());
  } else {
    const project = ensureProject(getHookStartDir(hookInput));
    writeSessionStartContext(
      scope === "group" ? groupMemories(project) : projectMemory(project),
    );
  }
} catch (error) {
  writeSessionStartError(`${scope} memory initialization`, error);
}
