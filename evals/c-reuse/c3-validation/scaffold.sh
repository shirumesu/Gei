#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
add_reuse_sources
memory projects/cwd/MEMORY.md <<'MD'
MD
memory projects/cwd/MAP.md <<'MD'
- when you validate a request body → src/util/guards.js#assertShape: (value, shape) => value; kinds string|positive-int|boolean; throws ShapeError
MD
commit_store
