#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
memory projects/cwd/MEMORY.md <<'MD'
- [release](release.md) - before preparing, versioning or tagging a release
MD
memory projects/cwd/release.md <<'MD'
# Release

Releases are cut from the `develop` branch: bump the version in package.json on develop, then tag `vX.Y.Z`.

**Why:** the user said main is deploy-only.
MD
commit_store
