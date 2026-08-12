---
name: using-gei
description: Gei's lightweight entry router. Use when the Gei bundle is active and a request may match one of its task Skills.
---

# Using Gei

Choose a Skill by the user's final objective. Supporting actions such as reading, searching, or checking do not determine the route.

- `consider`: an idea needs design or a consequential decision before implementation
- `work`: code, tests, builds, fixes, refactors, Git diagnosis, or release execution
- `create-skill`: create, improve, review, or validate Skills
- `memo`: maintain or reconcile GeiSpec background, architecture, impacts, changelog, memory, Groups, task references, drift, or compaction
- `code-review`: a read-only audit is the final deliverable
- `see`: external research or source-backed synthesis is the final deliverable

Honor an explicitly named Skill. If no Skill fits, continue normally.

Load the selected Skill and let it own the workflow. Do not preload other Skills merely because they might become useful later.

Before the final response, briefly assess whether the conversation or outcome revealed a durable, non-obvious lesson that could change future work. When a candidate exists, use Memo's memory write gate and update memory autonomously; keep a no-write decision silent. Write to the narrowest complete scope: Project by default, Group when multiple members share the lesson, and Shared Context only when it clearly applies across unrelated projects.
