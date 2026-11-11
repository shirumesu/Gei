#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
add_reuse_sources
memory projects/cwd/MEMORY.md <<'MD'
MD
memory projects/cwd/MAP.md <<'MD'
- when you need a relative time phrase like "3 days ago" → src/core/chrono/span.js#spanPhrase: (from: Date, to = new Date()) => string
MD
commit_store
