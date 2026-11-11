---
max_turns: 30
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

`createOrder(body)` in src/orders.js trusts its input. Validate it: `sku` must be a non-empty string and `qty` a positive integer; invalid input throws.
