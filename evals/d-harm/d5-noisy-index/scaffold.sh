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
topics=(docker-compose k8s-ingress grafana-alerts terraform-state ssh-bastion vpn-split postgres-vacuum redis-eviction kafka-retention s3-lifecycle)
areas=(staging prod billing search mobile)
mkdir -p "$PROJECT"
for topic in "${topics[@]}"; do
  for area in "${areas[@]}"; do
    name="$topic-$area"
    printf -- "- [%s](%s.md) - before touching %s for the %s environment\n" "$name" "$name" "$topic" "$area" >> "$PROJECT/MEMORY.md"
    printf "# %s\n\nFor %s, check the %s runbook before changing anything.\n\n**Why:** the user said so after an outage.\n" "$name" "$area" "$topic" > "$PROJECT/$name.md"
  done
done
commit_store
