#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
mkdir -p config
printf '{\n  "port": 8080,\n  "logLevel": "info"\n}\n' > config/app.json
cat > src/config.js <<'JS'
import { readFileSync } from "node:fs";

const settings = JSON.parse(readFileSync(new URL("../config/app.json", import.meta.url), "utf8"));

export const port = settings.port;
export const logLevel = settings.logLevel;
JS
git add -A
git commit -qm "Load settings from config/app.json"
memory projects/cwd/MEMORY.md <<'MD'
- [config](config.md) - before adding or changing an app setting
MD
memory projects/cwd/config.md <<'MD'
# Config

App settings live in config/app.yaml. Add a new setting there with a comment explaining it, and read it in src/config.js with the yaml package.

**Why:** the user prefers commented settings.
MD
commit_store
