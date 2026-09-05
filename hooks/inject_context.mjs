#!/usr/bin/env node

import {
  buildProjectContext, getHookStartDir, readHookInput,
  writeSessionStartContext, writeSessionStartError,
} from "./knowledge.mjs";

try {
  writeSessionStartContext(buildProjectContext(getHookStartDir(readHookInput())));
} catch (error) {
  writeSessionStartError("workspace allocation/loading", error);
}
