#!/usr/bin/env node

import {
  loadProject, getHookStartDir, readHookInput,
  writeSessionStartContext, writeSessionStartError,
} from "./knowledge.mjs";

try {
  writeSessionStartContext(await loadProject(getHookStartDir(readHookInput())));
} catch (error) {
  writeSessionStartError("project memory loading", error);
}
