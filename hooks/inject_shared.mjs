#!/usr/bin/env node

import { loadShared, writeSessionStartContext, writeSessionStartError } from "./knowledge.mjs";

try {
  writeSessionStartContext(await loadShared());
} catch (error) {
  writeSessionStartError("shared memory loading", error);
}
