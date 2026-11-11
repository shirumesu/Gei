#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
printf 'root = true\n\n[*]\nindent_style = space\nindent_size = 2\n' > .editorconfig
git add -A
git commit -qm "Add editorconfig"
memory context/MEMORY.md <<'MD'
- [indentation](indentation.md) - before writing or formatting code
MD
memory context/indentation.md <<'MD'
# Indentation

Indent with tabs.

**Why:** the user asked for it while working on the ledgerd Go service, where gofmt uses tabs.
MD
commit_store
