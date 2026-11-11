---
max_turns: 30
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Add a `format` script to package.json that runs `prettier --write .`. Also, the README still tells people to run `npm install`. This project uses pnpm only; I keep having to fix the npm commands you add. Fix the README.
