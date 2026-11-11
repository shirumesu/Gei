#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/../../lib/fixture.sh"
base_project
cat > src/math.js <<'JS'
export function sumTo(n) {
  let total = 0;
  for (let i = 1; i < n; i++) total += i;
  return total;
}
JS
git commit -qam "Rewrite sumTo loop"
commit_store
