#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
memory projects/cwd/MEMORY.md <<'MD'
- [module-registry](module-registry.md) - before adding, renaming or removing a file in src/
MD
memory projects/cwd/module-registry.md <<'MD'
# Module Registry

Every file in src/ has one line in MODULES.md at the repository root, `- <file>: <purpose>`. Adding, renaming or removing a module updates that line in the same change.

**Why:** the user's release script builds the package exports from MODULES.md; a module missing there is silently left out of the release.

**How to apply:** whenever a change touches the set of files in src/, edit MODULES.md too.
MD
commit_store
