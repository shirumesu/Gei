---
type: regex
target: trace
match: not_contains
pattern: '"name":"(?:Write|Edit|MultiEdit|mcp__plugin_gei_spec__spec_edit)".{0,2000}?projects/cwd/(?!release\.md|MEMORY\.md)[A-Za-z0-9._-]+\.md'
---
