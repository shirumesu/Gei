#!/usr/bin/env node

import { loadSharedContext, writeSessionStartContext, writeSessionStartError } from "./knowledge.mjs";

try {
  writeSessionStartContext(await loadSharedContext());
} catch (error) {
  writeSessionStartError("shared knowledge loading", error);
}
