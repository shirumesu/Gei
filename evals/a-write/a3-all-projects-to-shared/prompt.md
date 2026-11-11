---
max_turns: 25
timeout_seconds: 360
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

For all my projects from now on: commit messages are in English, imperative mood, with no trailing period. With that in mind, write the commit message for this change (just show it to me, don't commit):

```diff
--- a/src/greet.js
+++ b/src/greet.js
-export function greet(name) {
-  return `Hello, ${name}!`;
+export function greet(name, punctuation = "!") {
+  return `Hello, ${name}${punctuation}`;
 }
```
