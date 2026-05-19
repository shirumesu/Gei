#!/usr/bin/env node
/**
 * install-claude.mjs — Gei Claude Code installer
 *
 * Sets up Gei as a Claude Code plugin:
 *  - Skills: creates directory junctions in ~/.claude/skills/
 *            (junctions keep skills in sync with git pull automatically)
 *  - Hooks:  merges the SessionStart hook into ~/.claude/settings.json
 *
 * Usage (run from any directory):
 *   node path/to/gei/install-claude.mjs
 *
 * Safe to run multiple times — existing junctions and duplicate hooks are skipped.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const SKILLS_SOURCE = path.join(PLUGIN_ROOT, 'skills');
const HOOKS_CONFIG = path.join(PLUGIN_ROOT, 'hooks', 'claude-hooks.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function installSkills() {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });

  for (const name of fs.readdirSync(SKILLS_SOURCE)) {
    const src = path.join(SKILLS_SOURCE, name);
    if (!fs.statSync(src).isDirectory()) continue;

    const dst = path.join(SKILLS_DIR, name);

    if (fs.existsSync(dst)) {
      try {
        if (fs.realpathSync(dst) === fs.realpathSync(src)) {
          console.log(`  skill  [ok]      ${name}`);
          continue;
        }
      } catch { /* unresolvable junction — fall through */ }
      console.warn(`  skill  [CONFLICT] ${name} — target exists but differs; skipped`);
      continue;
    }

    try {
      // 'junction' does not require elevated privileges on Windows.
      fs.symlinkSync(src, dst, 'junction');
      console.log(`  skill  [linked]  ${name}`);
    } catch (e) {
      fs.cpSync(src, dst, { recursive: true });
      console.log(`  skill  [copied]  ${name}  (junction failed: ${e.message})`);
    }
  }
}

function hookExists(groups, incoming) {
  const cmd = incoming.hooks?.[0]?.command;
  if (!cmd) return false;
  return groups.some(g => g.hooks?.some(h => h.command === cmd));
}

function installHooks() {
  const hooksDef = readJson(HOOKS_CONFIG);

  let settings = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    settings = readJson(SETTINGS_PATH);
  }
  if (!settings.hooks) settings.hooks = {};

  let dirty = false;

  for (const [event, groups] of Object.entries(hooksDef.hooks)) {
    if (!settings.hooks[event]) settings.hooks[event] = [];

    for (const group of groups) {
      const expanded = JSON.parse(
        JSON.stringify(group).replaceAll(
          '${CLAUDE_PLUGIN_ROOT}',
          PLUGIN_ROOT.replace(/\\/g, '\\\\')
        )
      );

      if (hookExists(settings.hooks[event], expanded)) {
        console.log(`  hook   [ok]      ${event}`);
        continue;
      }

      settings.hooks[event].push(expanded);
      console.log(`  hook   [added]   ${event}`);
      dirty = true;
    }
  }

  if (dirty) {
    writeJson(SETTINGS_PATH, settings);
    console.log(`  settings.json written`);
  }
}

console.log(`Gei — Claude Code installer`);
console.log(`Plugin root: ${PLUGIN_ROOT}\n`);
installSkills();
installHooks();
console.log(`\nDone. Restart Claude Code to apply hook changes.`);
