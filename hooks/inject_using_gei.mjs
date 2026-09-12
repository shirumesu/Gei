#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clipLines, writeSessionStartContext, writeSessionStartError } from "./knowledge.mjs";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";

const pluginRoot = process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  const skillPath = path.join(pluginRoot, "skills", "using-gei", "SKILL.md");
  const text = fs.readFileSync(skillPath, "utf8");
  let body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, "").trim();
  if (!new SpecStore().config().enabled) body = body.replace(/Use the injected project background[\s\S]*$/u, "Spec is disabled by user configuration. Do not read or maintain external knowledge. Other task Skills remain available.");
  if (!body) throw new Error("using-gei has no body");
  const prefix = "<gei-router>\n";
  const suffix = "\n</gei-router>";
  writeSessionStartContext(prefix + clipLines(body, 2048 - Buffer.byteLength(prefix + suffix)) + suffix);
} catch (error) {
  writeSessionStartError("router loading; use the installed using-gei skill", error);
}
