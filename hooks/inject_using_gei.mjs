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

// The using-gei router applies to every Gei session regardless of Project, so
// this hook injects the router body without depending on GeiSpec state.
function stripFrontmatter(text) {
  if (!text.startsWith("---")) return text.trimStart();
  const close = text.indexOf("\n---", 3);
  if (close === -1) return text.trimStart();
  const lineEnd = text.indexOf("\n", close + 1);
  return lineEnd === -1 ? "" : text.slice(lineEnd + 1).trimStart();
}

function buildRouterBlock() {
  try {
    const skillPath = path.join(pluginRoot, "skills", "using-gei", "SKILL.md");
    if (!fs.existsSync(skillPath)) return buildRouterDiagnosticBlock();

    const body = stripFrontmatter(fs.readFileSync(skillPath, "utf8").trimEnd());
    if (!body) return buildRouterDiagnosticBlock();

    return [
      "<gei-router>",
      "Gei is active. Route every request through the using-gei router below before acting, including before clarifying questions, search, or exploration.",
      "",
      "--- skills/using-gei/SKILL.md ---",
      body,
      "---------------------------------",
      "</gei-router>",
    ].join("\n");
  } catch {
    return buildRouterDiagnosticBlock();
  }
}

function buildRouterDiagnosticBlock() {
  return [
    "<gei-router>",
    "Warning: using-gei router could not be loaded.",
    "Expected `skills/using-gei/SKILL.md` under the Gei plugin root. Load the installed `using-gei` skill before acting if the host did not inject it automatically.",
    "</gei-router>",
  ].join("\n");
}

writeSessionStartContext(buildRouterBlock());
