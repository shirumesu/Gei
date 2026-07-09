---
name: using-gei
description: "Use when starting any conversation - this Skill should be invoked before any other Skill. It is Gei's entry router: it routes each request by the user's final objective to exactly one downstream Gei skill and starts the task lifecycle."
---

Gei's entry router and lifecycle starter. Route every request through it before any other Gei skill.

## Route Before Acting

Before answering, exploring, searching, or asking a clarifying question, route the request through the table below. Routing is the first step, not a later one — a "quick" action still gets routed.

- User instructions and repo rules decide **what** to do; Gei routing decides **how** to work.
- If the user explicitly names a skill, load that skill first unless higher-priority instructions block it.
- Choose only the first downstream skill. That skill owns its workflow and any later handoff.
- Load one skill at a time. Do not preload likely later skills.
- Load a skill by invoking it (e.g. the Skill tool / `gei:work`), not by reading its `SKILL.md` as a file.
- If no Gei skill matches, exit Gei and continue normally.

## Route By Final Objective

Route by the user's primary intended outcome, not by the first visible verb.

- Idea exploration, feature planning, feasibility, product direction, unclear scope, or "I want to..." before execution -> `consider`
- Implementation, bug fixing, Git diagnosis, tests, build, release, refactor, or code execution -> `work`
- Creating, improving, reviewing, or validating agent Skills -> `create-skill`
- Spec documents, project memory, changelog/checkpoint maintenance, documentation maintenance, or alignment checks -> `memo`
- Non-Skill code review, PR review, diff audit, commit review, working-tree review, or implementation audit as the final deliverable -> `code-review`
- External research, fact-checking, web search, comparison, source-backed summary, or public information as the final deliverable -> `see`
- No matching skill -> exit Gei

When a new skill is added, route to it by its own description if it is the best first hop. Do not copy every downstream skill's full trigger list into this router.

## Supporting Actions

Do not route by incidental actions such as search, inspect, read, compare, check, verify, update, or summarize unless that action is the final deliverable.

- "Search for mods for a game" -> `see`, because research is the deliverable.
- "I want to add a feature; check how another project designed it" -> `consider`, because planning is the deliverable and research is supporting work.
- "Hi" -> exit Gei.

Do not route to `see` or `memo` only because context or memory might be needed. The selected first-hop skill gathers its own project, external, Git, test, spec, or source context and applies memory recall itself.

## Lifecycle State

`using-gei` starts lifecycle state; downstream skills enforce it. Do not ask downstream skills to remember this file.

- **Memory recall:** at task start, scan the injected `spec/MEMORY.md` index. Treat index lines as short summaries, not complete rules; when a linked summary might matter, read the linked `spec/memory/*.md` entry and apply it as a constraint, verification step, or non-goal before planning, reviewing, or editing. Re-check after scope changes into new files, commands, errors, or workflows. Mention memory only when it changed the answer, conflicts with repository or user instructions, wrote memory, or the user asked.
- **Recording changed work:** When changelog-worthy work completes, record one typed entry under `spec/CHANGELOG.md` `## Unreleased` (see `memo/references/contracts/changelog.md`). Trivial, non-durable, or read-only work records nothing; heavy work that must resume across sessions uses a `spec/docs/#NNN` task spec.
- **Memory close check:** at task end, run Memo's memory close check inside the same final-response flow, not a separate hook-triggered reply. Omit no-op memory status from the answer.

Confidence order and the document map live in the injected `spec/OVERVIEW.md`; do not restate them here.

## End Condition

- Do not add routing-path or no-op lifecycle status lines by default.
- Mention lifecycle state only when it affects the user's decision, created or changed memory or changelog state, explains a conflict, or the user asked about it.
- If multiple skills seem relevant, load only the shortest first-hop path and wait for that skill to complete or hand off.
- If no skill matches, exit this router and continue normally.
