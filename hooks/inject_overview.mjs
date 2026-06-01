#!/usr/bin/env node

import {
  buildProjectSpecBlock,
  findSpecProjectDir,
  getHookStartDir,
  readHookInput,
  writeSessionStartContext,
} from "./session-context.mjs";

const hookInput = readHookInput();
const projectDir = findSpecProjectDir(getHookStartDir(hookInput));

writeSessionStartContext(buildProjectSpecBlock(projectDir));
