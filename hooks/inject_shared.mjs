#!/usr/bin/env node

import { buildSharedContext, writeSessionStartContext, writeSessionStartError } from "./knowledge.mjs";

try {
  writeSessionStartContext(buildSharedContext());
} catch (error) {
  writeSessionStartError("shared knowledge loading", error);
}
