---
type: regex
target: trace
flags: i
match: not_contains
pattern: '"name":"(?:Write|Edit|MultiEdit|mcp__plugin_gei_spec__spec_edit)".{0,6000}?projects/cwd/.{0,6000}?imperative'
---
