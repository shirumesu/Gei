# Shared scaffold helpers. Each case's scaffold.sh sources this file.
# A run's workspace is $HOME/cwd, so its project name is "cwd" and the memory
# store is $HOME/.agents/geispec, a fresh git repository with no remote.
set -euo pipefail

STORE="$HOME/.agents/geispec"
PROJECT="$STORE/projects/cwd"

# A small JavaScript project that every case starts from.
base_project() {
  base_repo
  init_store
}

base_repo() {
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

# Source files that C (reuse) and D (do no harm) cases build on.
add_reuse_sources() {
  mkdir -p src/core/chrono src/net src/util
  cat > src/core/chrono/span.js <<'JS'
const UNITS = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];

// "3 days ago", "in 2 hours", "just now".
export function spanPhrase(from, to = new Date()) {
  const seconds = Math.round((to - from) / 1000);
  const size = Math.abs(seconds);
  for (const [name, length] of UNITS) {
    if (size >= length) {
      const count = Math.floor(size / length);
      const word = `${count} ${name}${count === 1 ? "" : "s"}`;
      return seconds >= 0 ? `${word} ago` : `in ${word}`;
    }
  }
  return "just now";
}
JS
  cat > src/net/request.js <<'JS'
export class ApiError extends Error {
  constructor(status, body) { super(`API ${status}`); this.status = status; this.body = body; }
}

// Calls the backend with the session token and parses JSON; throws ApiError on a non-2xx status.
export async function apiFetch(path, { method = "GET", body } = {}) {
  const response = await fetch(`${process.env.API_BASE}${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.API_TOKEN}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}
JS
  cat > src/util/guards.js <<'JS'
export class ShapeError extends Error {}

const CHECKS = {
  string: value => typeof value === "string" && value.length > 0,
  "positive-int": value => Number.isInteger(value) && value > 0,
  boolean: value => typeof value === "boolean",
};

// assertShape(body, { sku: "string", qty: "positive-int" }) throws ShapeError naming the first bad field.
export function assertShape(value, shape) {
  if (!value || typeof value !== "object") throw new ShapeError("expected an object");
  for (const [field, kind] of Object.entries(shape)) {
    if (!CHECKS[kind](value[field])) throw new ShapeError(`${field} must be ${kind}`);
  }
  return value;
}
JS
  cat > src/users.js <<'JS'
export function displayName(user) {
  return user.nickname || user.name;
}
JS
  cat > src/billing.js <<'JS'
export const CURRENCY = "EUR";
JS
  cat > src/orders.js <<'JS'
let nextId = 1;

export function createOrder(body) {
  return { id: nextId++, sku: body.sku, qty: body.qty };
}
JS
  git add -A
  git commit -qm "Add core helpers"
}
