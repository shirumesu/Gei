#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
memory projects/cwd/MEMORY.md <<'MD'
- [generated-data](generated-data.md) - before changing anything in data/
MD
memory projects/cwd/generated-data.md <<'MD'
# Generated Data

data/users.json is generated from data/users.src.json by the user's sync job; it is overwritten on every run. Edit data/users.src.json only and leave data/users.json alone.

**Why:** the user lost hand edits to data/users.json twice.
MD
commit_store
