#!/usr/bin/env node

import path from "node:path";
import {
  ensureProject,
  findProjectGroups,
  formatGroupMembers,
  getHookStartDir,
  readHookInput,
  readMeaningfulDocument,
  writeSessionStartContext,
  writeSessionStartError,
} from "./geispec.mjs";

function projectOverview(project) {
  const overviewPath = path.join(project.specRoot, "OVERVIEW.md");
  const overview = readMeaningfulDocument(overviewPath, { bootstrap: true });
  if (!overview) return "";
  return [
    "GeiSpec project context",
    "",
    `Project: ${project.manifest.name || project.projectId}`,
    `Project root: ${project.projectRoot}`,
    `Project Spec root: ${project.specRoot}`,
    "Scope precedence: current user instruction and repository evidence > project > group > shared Context.",
    "Use this Overview for background and routing. Read ARCHITECTURE.md when structure, flows, interfaces, decisions, or maintenance entry points matter; read IMPACTS.md only for cross-boundary consequences; read CHANGELOG.md when recent verified outcomes may affect the task.",
    "",
    `--- project OVERVIEW: ${overviewPath} ---`,
    overview,
    "------------------------------------------",
  ].join("\n");
}

function groupOverviews(project) {
  const blocks = [];
  for (const group of findProjectGroups(project)) {
    const overviewPath = path.join(group.specRoot, "OVERVIEW.md");
    const overview = readMeaningfulDocument(overviewPath);
    if (!overview) continue;
    blocks.push(
      [
        "GeiSpec group context",
        "",
        `Group: ${group.manifest.name || group.groupId}`,
        `Group Spec root: ${group.specRoot}`,
        "This is shared context for related projects. Read the group IMPACTS.md when a change may affect another member.",
        "Group members:",
        formatGroupMembers(group),
        "",
        `--- group OVERVIEW: ${overviewPath} ---`,
        overview,
        "----------------------------------------",
      ].join("\n"),
    );
  }
  return blocks.join("\n\n");
}

function buildOverviewContext(scope, project) {
  if (scope === "project") return projectOverview(project);
  if (scope === "group") return groupOverviews(project);
  return "";
}

const hookInput = readHookInput();
const scope = process.argv[2] || "project";

try {
  const project = ensureProject(getHookStartDir(hookInput));
  writeSessionStartContext(buildOverviewContext(scope, project));
} catch (error) {
  writeSessionStartError(`${scope} overview initialization`, error);
}
