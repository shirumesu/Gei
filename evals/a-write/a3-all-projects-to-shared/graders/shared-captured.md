---
type: regex
weight: 2
target: trace
flags: i
pattern: '"name":"(?:Write|Edit|MultiEdit|mcp__plugin_gei_spec__spec_edit)".{0,6000}?context/(?!MEMORY\.md).{0,6000}?imperative'
---
