#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(scriptDir, "..");

function writeSessionStartContext(additionalContext) {
  process.stdout.write(
    `${JSON.stringify(
      {
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext,
        },
      },
      null,
      2,
    )}\n`,
  );
}

const skillPath = path.join(pluginRoot, "skills", "using-gei", "SKILL.md");

let usingGeiContent = "Error reading using-gei skill";
try {
  usingGeiContent = fs.readFileSync(skillPath, "utf8");
} catch {
  // Keep a readable failure marker in the injected context if the file is missing.
}

const sessionContext = [
  "<gei-routing-context>",
  "This session is using Gei.",
  "",
  "The 'gei:using-gei' skill content has been pre-loaded below. When processing user requests, this content defines the routing and lifecycle rules that apply to this session.",
  "",
  "--- gei:using-gei skill ---",
  usingGeiContent,
  "---------------------------",
  "",
  "The using-gei skill is available in context for all turns in this session.",
  "</gei-routing-context>",
].join("\n");

writeSessionStartContext(sessionContext);
