#!/usr/bin/env node

import {
  loadProjectContext, getHookStartDir, readHookInput,
  writeSessionStartContext, writeSessionStartError,
} from "./knowledge.mjs";

try {
  writeSessionStartContext(await loadProjectContext(getHookStartDir(readHookInput())));
} catch (error) {
  writeSessionStartError("workspace allocation/loading", error);
}
