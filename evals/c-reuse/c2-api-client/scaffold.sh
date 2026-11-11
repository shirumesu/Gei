#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
add_reuse_sources
memory projects/cwd/MEMORY.md <<'MD'
MD
memory projects/cwd/MAP.md <<'MD'
- when you call the backend API → src/net/request.js#apiFetch: (path, { method, body }) => parsed JSON; throws ApiError
MD
commit_store
