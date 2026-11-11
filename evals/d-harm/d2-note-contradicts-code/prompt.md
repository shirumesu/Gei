---
max_turns: 30
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Add a `retries` setting with default 3 to the app config, and export it from src/config.js as `retries`.
