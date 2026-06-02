#!/usr/bin/env node

import {
  buildMemoryIndexBlock,
  findSpecProjectDir,
  getHookStartDir,
  readHookInput,
  writeSessionStartContext,
} from "./session-context.mjs";

const hookInput = readHookInput();
const projectDir = findSpecProjectDir(getHookStartDir(hookInput));

writeSessionStartContext(buildMemoryIndexBlock(projectDir));
