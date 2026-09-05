#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clipLines, writeSessionStartContext, writeSessionStartError } from "./knowledge.mjs";

const pluginRoot = process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  const skillPath = path.join(pluginRoot, "skills", "using-gei", "SKILL.md");
  const text = fs.readFileSync(skillPath, "utf8");
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, "").trim();
  if (!body) throw new Error("using-gei has no body");
  writeSessionStartContext(`<gei-router>\n${clipLines(body, 2048)}\n</gei-router>`);
} catch (error) {
  writeSessionStartError("router loading; use the installed using-gei skill", error);
}
