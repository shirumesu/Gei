---
name: using-gei
description: "Use when starting any conversation - this Skill should be invoked before any other Skill. It assists in determining how to locate and load Skills."
---

Gei's entry router and lifecycle starter. Use it before any other Gei skill when a request may belong to `consider`, `see`, `memo`, `work`, `code-review`, or `create-skill`.

## Core Contract

- Route before answering, exploring, asking clarifying questions, or acting.
- User instructions and repo rules decide **what** to do; Gei routing decides **how** to work.
- If the user explicitly names a skill, load that skill first unless higher-priority instructions block it.
- Choose only the first downstream skill. The selected skill owns its workflow and any later handoff.
- Load one downstream skill at a time. Do not preload likely later skills.
- If no Gei skill matches, exit Gei and continue normally.

## Route By Final Objective

Route by the user's primary intended outcome, not by the first visible verb.

- Idea exploration, feature planning, feasibility, product direction, unclear scope, or "I want to..." before execution -> `consider`
- Implementation, bug fixing, Git diagnosis, tests, build, release, refactor, or code execution -> `work`
- Creating, improving, reviewing, or validating agent Skills -> `create-skill`
- Spec files, project memory, current-work reconciliation, changelog/checkpoint maintenance, documentation maintenance, or alignment checks -> `memo`
- Non-Skill code review, PR review, diff audit, commit review, working-tree review, or implementation audit as the final deliverable -> `code-review`
- External research, fact-checking, web search, comparison, source-backed summary, or public information as the final deliverable -> `see`
- No matching skill -> exit Gei

When a new skill is added, route to it by its own description if it is the best first hop. Do not copy every downstream skill's full trigger list into this router.

## Supporting Actions

Do not route by incidental actions such as search, inspect, read, compare, check, verify, update, or summarize unless that action is the final deliverable.

Examples:

- "Search for mods for a game" -> `see`, because research is the deliverable.
- "I want to add a feature; check how another project designed it" -> `consider`, because feature planning is the deliverable and research is supporting work.
- "Hi" -> exit Gei.

Do not route to `see` or `memo` only because context may be needed. The selected first-hop skill gathers its own project, external, Git, test, build, spec, or source context.

Do not route to `memo` only because memory recall may be relevant. Memory recall is lifecycle context unless the user's final objective is spec or memory maintenance.

## Lifecycle State

`using-gei` starts lifecycle state; downstream skills enforce it. Do not ask downstream skills to remember this file.

For file-changing work:

1. Use `spec/current-work.md` as the short local state file for active and recent work.
2. Before the first file edit, read `references/current-work.md` and satisfy that contract.
3. At phase boundaries, close, pause, or archive the relevant current-work entry.
4. Invoke `memo` when current-work reconciliation or durable spec promotion is required.

For read-only tasks, no current-work anchor is needed.

For memory recall:

1. At task start, scan the injected `spec/MEMORY.md` index when it exists.
2. If a `Read when ...` line matches the current task, read the linked `spec/memory/*.md` entry before planning, reviewing, or editing.
3. State the result with `Memory applied:`, `Memory skipped:`, or `Memory checked:` so the constraint is visible.
4. Repeat the check when scope changes enough to involve new files, commands, errors, or workflows.

Memory writing is handled by `memo`, not by `using-gei` or host Stop hooks.

At task end, run Memo's memory close check before the final response. This is part of the task lifecycle, not optional cleanup after the work seems finished. Keep the check in the same final response flow so the user's answer is not split by an extra hook-triggered continuation.

When project context sources disagree, trust repository code/config/tests/Git history first, `spec/current-work.md` second, and durable spec files such as `OVERVIEW.md`, `ARCHITECTURE.md`, `MEMORY.md`, and `CHANGELOG.md` third.

## End Condition

- State the routing path briefly, for example: `using-gei` -> `consider`.
- If lifecycle state was required, state whether `spec/current-work.md` was created, reused, or explicitly skipped.
- Include the Memo memory close-check marker required by `skills/memo/references/events/memory.md`.
- If multiple skills seem relevant, load only the shortest first-hop path and wait for that skill to complete or hand off.
- If no skill matches, exit this router and continue normally.
