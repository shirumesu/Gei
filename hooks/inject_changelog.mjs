#!/usr/bin/env node

import path from "node:path";
import {
  ensureProject,
  getHookStartDir,
  readHookInput,
  readUnreleasedChangelog,
  writeSessionStartContext,
  writeSessionStartError,
} from "./geispec.mjs";

function projectChangelog(project) {
  const changelogPath = path.join(project.specRoot, "CHANGELOG.md");
  const unreleased = readUnreleasedChangelog(changelogPath);
  if (!unreleased) return "";

  return [
    "GeiSpec recent project outcomes",
    "",
    `Project: ${project.manifest.name || project.projectId}`,
    `Project Spec root: ${project.specRoot}`,
    "Only meaningful Unreleased outcomes are injected. Read the full Changelog only when older release or checkpoint history matters.",
    "Architecture remains on demand; use the injected Overview to decide when it is relevant.",
    "",
    `--- project CHANGELOG: ${changelogPath} ---`,
    unreleased,
    "--------------------------------------------",
  ].join("\n");
}

const hookInput = readHookInput();

try {
  const project = ensureProject(getHookStartDir(hookInput));
  writeSessionStartContext(projectChangelog(project));
} catch (error) {
  writeSessionStartError("project changelog initialization", error);
}
