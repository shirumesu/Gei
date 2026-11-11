---
type: regex
weight: 2
target: { source: file, path: src/stats.js }
flags: m
match: not_contains
pattern: '^\t'
---
