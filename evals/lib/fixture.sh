# Shared scaffold helpers. Each case's scaffold.sh sources this file.
# A run's workspace is $HOME/cwd, so its project name is "cwd" and the memory
# store is $HOME/.agents/geispec, a fresh git repository with no remote.
set -euo pipefail

STORE="$HOME/.agents/geispec"
PROJECT="$STORE/projects/cwd"

# A small JavaScript project that every case starts from.
base_project() {
  git init -q .
  git config user.name eval
  git config user.email eval@example.invalid
  mkdir -p src data
  cat > package.json <<'JSON'
{
  "name": "tally",
  "version": "1.2.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
JSON
  cat > README.md <<'MD'
# tally

Small text and number helpers.

## Install

```
npm install
```

## Use

```js
import { greet } from "./src/greet.js";
greet("Ada");
```
MD
  cat > src/greet.js <<'JS'
export function greet(name) {
  return `Hello, ${name}!`;
}
JS
  cat > src/math.js <<'JS'
export function sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}
JS
  cat > MODULES.md <<'MD'
# Modules

- greet.js: greeting strings
- math.js: number helpers
MD
  printf '[\n  { "id": 1, "name": "Ada" },\n  { "id": 2, "name": "Grace" },\n  { "id": 3, "name": "Linus" }\n]\n' > data/users.src.json
  cp data/users.src.json data/users.json
  git add -A
  git commit -qm "Initial commit"
  init_store
}

init_store() {
  mkdir -p "$STORE"
  git -C "$STORE" init -q
  git -C "$STORE" config user.name eval
  git -C "$STORE" config user.email eval@example.invalid
}

# memory <relative path> : writes stdin to a file in the store.
memory() {
  mkdir -p "$(dirname "$STORE/$1")"
  cat > "$STORE/$1"
}

commit_store() {
  git -C "$STORE" add -A
  git -C "$STORE" commit -qm "Seed memory" --allow-empty
}
