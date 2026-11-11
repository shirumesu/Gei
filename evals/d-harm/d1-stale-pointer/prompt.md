---
max_turns: 30
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Add `lastSeenLabel(user)` to src/users.js. It returns "last seen <relative time>", for example "last seen 3 days ago", from `user.lastSeen` (a Date).
