#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
memory context/MEMORY.md <<'MD'
- [js-docs](js-docs.md) - before writing or changing an exported JavaScript function
MD
memory context/js-docs.md <<'MD'
# JavaScript Doc Comments

Every exported JavaScript function gets a JSDoc block with one `@param` per parameter and a `@returns` line.

**Why:** the user said so for all projects; their editor tooling reads the types from JSDoc.
MD
commit_store
