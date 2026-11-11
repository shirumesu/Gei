#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
add_reuse_sources
mkdir -p src/time
sed 's/spanPhrase/relativeLabel/' src/core/chrono/span.js > src/time/relative.js
git rm -q -r src/core
git add -A
git commit -qm "Move relative time to src/time"
memory projects/cwd/MEMORY.md <<'MD'
MD
memory projects/cwd/MAP.md <<'MD'
- when you need a relative time phrase like "3 days ago" → src/core/chrono/span.js#spanPhrase: (from: Date, to = new Date()) => string
MD
commit_store
