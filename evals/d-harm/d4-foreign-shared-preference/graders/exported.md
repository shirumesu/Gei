---
type: regex
target: { source: file, path: src/stats.js }
flags: s
pattern: 'export\s+(?:function|const)\s+(?:mean|median).*export\s+(?:function|const)\s+(?:mean|median)'
---
