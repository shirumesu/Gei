#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = process.env.PLUGIN_ROOT || path.resolve(scriptDir, "..");
const skillPath = path.join(pluginRoot, "skills", "using-gei", "SKILL.md");

let usingGeiContent = "Error reading using-gei skill";
try {
  usingGeiContent = fs.readFileSync(skillPath, "utf8");
} catch {
  // Keep a readable failure marker in the injected context if the file is missing.
}

const sessionContext = [
  "<EXTREMELY_IMPORTANT>",
  "You are using Gei.",
  "",
  "**Below is the full content of your 'gei:using-gei' skill - your introduction to Gei routing and lifecycle:**",
  "",
  usingGeiContent,
  "</EXTREMELY_IMPORTANT>",
].join("\n");

process.stdout.write(
  `${JSON.stringify(
    {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: sessionContext,
      },
    },
    null,
    2,
  )}\n`,
);
