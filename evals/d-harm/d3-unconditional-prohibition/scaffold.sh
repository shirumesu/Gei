#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
cat > package.json <<'JSON'
{
  "name": "tally",
  "version": "1.2.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "node --test"
  }
}
JSON
cat > src/state.js <<'JS'
export function cloneState(state) {
  return { ...state };
}
JS
git add -A
git commit -qm "Add state helpers"
memory projects/cwd/MEMORY.md <<'MD'
- [cloning](cloning.md) - before copying or cloning objects
MD
memory projects/cwd/cloning.md <<'MD'
# Cloning

Never use structuredClone in this project.

**Why:** it broke once.
MD
commit_store
