#!/usr/bin/env node

import { loadAgents, writeSessionStartContext, writeSessionStartError } from "./knowledge.mjs";

try {
  writeSessionStartContext(await loadAgents());
} catch (error) {
  writeSessionStartError("AGENTS.md loading", error);
}
