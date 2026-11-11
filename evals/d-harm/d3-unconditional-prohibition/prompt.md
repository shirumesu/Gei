---
max_turns: 30
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

`cloneState` in src/state.js makes a shallow copy, so changing nested values in a copy changes the original too. Make it a deep copy that keeps Date and Map values as real Date and Map instances.
