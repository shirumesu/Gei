---
name: memo
description: Use when initializing, maintaining, or pruning a project's spec system. Or when any spec-doc change, TODO state change, archive cleanup, repeatable pitfall, durable rejection, architecture drift, or shipped outcome must be recorded or reorganized for future agents.
---

# Memo

## Overview

Memo owns the durable project memory system under `spec/` and its optional history surface under `spec/archive/`.

Its job is to keep future agents productive without forcing a fresh deep read of the whole repo. It does that with a small set of high-signal documents, stable identifiers, and event-driven updates.

Use the templates and writing rules in `references/` instead of improvising document structure.

For repo bootstrap, prefer the bundled script:

`python skills/memo/scripts/init-spec.py <project-path> [--force]`

## Core Rule

Write only what the current event requires.

Do not bulk-rewrite unrelated documents. Do not refresh every file because a task happened. Update the smallest correct surface.

## Archive Cleanup

Use an archive cleanup pass when the user asks to archive, when the active memory files became noisy, or when completed history is crowding out current context.

Read `references/archive.md` before doing this work.

Keep archive cleanup doc-first. Do not inspect code unless the user explicitly asked for it or the current documents are too stale to classify an item safely.

The goal is to improve readability and retire stale detail, not to rebuild project understanding from the codebase.

## Minimal Change Rule

Every combined spec-task file must start from the smallest coherent change that can satisfy the goal.

Apply these rules when writing or updating `spec/docs/#NNN-{work-description}.md`:

1. Prefer the smallest viable file set.
2. Prefer modifying existing focused files before introducing new files, modules, or layers.
3. Do not include unrelated refactors in the same task just because the files are nearby.
4. If the full goal is too large for one bounded change, split it into later phases or TODO items instead of widening the current task.
5. Within each phase, tasks should be atomic enough that an agent can execute them without further decomposition.
6. If two work units do not need the same close context, they do not belong in the same phase.

Use larger structural changes only when the smaller change cannot meet the requirement cleanly.

## Planning Hierarchy

Organize each combined spec-task file with three planning levels:

1. **Section**
   A milestone checkpoint owned by the main thread. Use a section when several phases together move the project into a meaningful new state such as "project skeleton is ready for first review" or "main feature set is complete". A section is the right boundary for an intermediate review, mid-task commit, or documentation sync.
2. **Phase**
   One independent worker-sized unit inside a section. A phase may start after an earlier phase finishes, but it must not depend on that earlier phase's hidden or detailed context. Write each phase so one worker can execute it from the spec file itself, using only the stated files, constraints, and expected change.
3. **Task**
   The smallest indivisible planning unit. A task should already be concrete enough to execute directly. Tasks inside one phase may share local context and should follow the `writing-plans` style of exact files, commands, and concrete steps.

Do not use sections as decorative grouping. Each section should correspond to a real state transition in the project. Do not use phases as loose buckets. Each phase should be one bounded unit with clearly stated files, constraints, and expected change.

## Hard Trigger Rule

Invoke `memo` when any trigger below is true. Do not leave this to general judgment.

If one of these events happened, `memo` must run:

1. `spec/` is missing, incomplete, or the project has no current spec system.
2. A new bounded task is accepted and needs its own `spec/docs/#NNN-{work-description}.md`.
3. The current task's goal, scope, constraints, affected files, interfaces, or verification plan changed after the current `#NNN-{work-description}.md` was created.
4. A TODO item was created, reprioritized, moved between sections, resolved, or deferred.
5. A repeatable pitfall was discovered:
   - a command or workflow failed in a way that could happen again
   - a user rejected a direction, wording, or behavior that is general enough to recur beyond one file or one casual exchange
   - a version-specific or tool-specific hazard was confirmed
6. The project structure changed in a way that affects durable context:
   - module boundaries changed
   - routing changed
   - top-level directories changed
   - required commands or entry points changed
   - important data flow changed
7. A task reached a handoff, merge, release, ship, or other checkpoint that should appear in `CHANGELOG.md`.
8. The user asked to archive, or the active memory surface accumulated enough stale history that a cleanup pass is needed.
9. A session ends after changes in items 3 through 8 happened but the matching spec files were not updated yet.

Do not invoke `memo` for ordinary code edits that do not change any durable project knowledge.

## Spec System

Memo maintains this layout:

```text
spec/
  ARCHITECTURE.md
  TODO.md
  MEMORY.md
  CHANGELOG.md
  archive/
    TODO.md
    MEMORY.md
    CHANGELOG.md
  test/
  docs/
    #NNN-{work-description}.md
```

`spec/archive/` is optional. Create it on the first archive cleanup pass that actually moves content out of the active files.

Read `references/spec-system.md` before initializing or restructuring the memory system.

## File Responsibilities

- `spec/ARCHITECTURE.md`
  The stable system map: modules, responsibilities, data flow, routing rules, diagrams, integration boundaries, and maintenance notes.
- `spec/TODO.md`
  The live work ledger with Backlog, TODO, In Progress, and Done sections.
- `spec/MEMORY.md`
  A do-not-repeat ledger: repeatable pitfalls, durable rejected directions, version-specific hazards, and the checks that prevent those mistakes from happening again. Do not keep one-off file-local notes here.
- `spec/CHANGELOG.md`
  A ship-oriented recent history that references spec docs and resolved TODO items.
- `spec/archive/`
  Archived history removed from the active memory surface. Keep archived TODO, MEMORY, and CHANGELOG content recoverable here without cluttering the main files.
- `spec/test/`
  The spec-managed test workspace for project tests, verification fixtures, and task-specific checks that belong with the spec system.
- `spec/docs/#NNN-{work-description}.md`
  The combined spec-task record. It holds the scoped context, chosen direction, and concrete execution plan for one bounded task. It is not a diary.

## Numbering And Naming

Apply these rules unless the repo already follows a different stable scheme:

- Spec docs use zero-padded ids: `#001`, `#002`, `#003`
- Task files use `#NNN-{work-description}.md`, where `work` is the task slug
- TODO ids use `#TOD-001`, `#TOD-002`, `#TOD-003`
- Slugs use lowercase hyphen-case
- Inline references reuse the same ids exactly

When the repo already has a numbering pattern, preserve it instead of renaming old files.

## Trigger Matrix

### 1. Init Event

Trigger this when any of these are true:

- `spec/` does not exist
- one of `ARCHITECTURE.md`, `TODO.md`, `MEMORY.md`, `CHANGELOG.md`, `test/`, or `docs/` is missing
- the project has no current `spec/docs/#NNN-{work-description}.md` for the accepted task
- the current repo clearly has no working spec system yet

Actions:

1. Prefer `scripts/init-spec.py <project-path>` to create the `spec/` tree from the bundled templates.
2. If the script reports existing spec-management markers, stop and surface the error unless the user explicitly approves `--force`.
3. Scan the repo, docs, and recent history.
4. Write the first pass of `ARCHITECTURE.md`.
5. Seed `TODO.md` with known backlog items and immediate work.
6. Ensure `spec/test/` exists for project test files.
7. Create or update `spec/docs/#001-{work-description}.md` as the current combined spec-task file.
8. Record routing rules so future agents know which document to read first.

### 2. Task Start Event

Trigger this when any of these are true:

- the user approved a new bounded task
- the agent is about to start planning or execution for a task with no current `#NNN-{work-description}.md`
- the next task was selected from `TODO.md` and is becoming active

Actions:

1. Allocate the next spec id by scanning `spec/docs/#*.md`.
2. Map the smallest coherent set of files, tests, and doc changes that can satisfy the task.
3. Group the work into sections, phases, and tasks:
   - sections for milestone checkpoints
   - phases for independent worker-sized units with clearly stated files, constraints, and expected change
   - tasks for indivisible instructions that can share local phase context
4. Create or update the current combined spec-task file at `spec/docs/#NNN-{work-description}.md`.
5. Link related TODO ids.
6. Reserve or update test files under `spec/test/` when the task needs spec-managed tests.
7. Move active work into `In Progress` only when execution truly begins.
8. Record any existing constraint that the current task must respect.

### 3. Active Work Event

Trigger this when any of these are true:

- the current task scope changed
- a constraint changed
- an assumption became a confirmed fact
- an affected file list changed
- an interface or verification command changed
- a test file path or test strategy under `spec/test/` changed
- a repeatable pitfall, rejection, or hazard was discovered

Write to `MEMORY.md` when:

- a technical mistake is likely to happen again
- a command, file pattern, or workflow caused a repeatable failure
- a user explicitly rejected a reusable direction, wording, or behavior that might be proposed again across similar tasks
- a library, tool, or version introduced a hazard future agents should notice early

Update the combined spec-task file when:

- scope changes
- assumptions become facts
- important files or interfaces change
- spec-managed test files or verification strategy change

Do not write to `MEMORY.md` for ordinary progress updates, routine design choices, one-off file-local instructions, or full chains of thought.

Do not touch `ARCHITECTURE.md` unless system structure, routing, commands, or major flow actually changed.

### 4. TODO State Change Event

Trigger this when any TODO item is:

- added
- reprioritized
- moved between `Backlog`, `TODO`, `In Progress`, and `Done`
- linked to or unlinked from a `#NNN-{work-description}.md`
- split into multiple TODO items
- deferred from the current task

Actions:

1. Update `TODO.md`.
2. Update the active `#NNN-{work-description}.md` when the TODO change affects current scope.
3. Update `CHANGELOG.md` only if the TODO movement reflects shipped or deferred work at a checkpoint.

### 5. Architecture Change Event

Trigger this when any of these are true:

- a top-level folder responsibility changed
- a module boundary changed
- a routing rule changed
- a required command changed
- a system flow or state transition changed
- the role of `spec/test/` changed
- a diagram in `ARCHITECTURE.md` became stale

Actions:

1. Update `ARCHITECTURE.md`.
2. Update the active `#NNN-{work-description}.md` if the current task caused the change.
3. Update `MEMORY.md` only if the change exposed a repeatable pitfall or hazard.

### 6. Ship Event

Trigger this when any of these are true:

- a task was merged
- a task was released
- a task was shipped
- a user-visible checkpoint was reached
- a formal handoff happened and the result should be part of durable history

Actions:

1. Update the combined spec-task file with the final outcome.
2. Update `CHANGELOG.md` with the shipped change.
3. Move resolved TODO items into `Done` with references.
4. Run a stale diagram audit against `ARCHITECTURE.md`.
5. Add metrics when evidence exists.

Never invent metrics. If coverage, completion rate, or other evidence is unavailable, write `not measured` or `not instrumented`.

### 7. Deferred Work Event

Trigger this when useful work is intentionally postponed and should remain visible after the current task ends.

Actions:

1. Allocate a new `#TOD-###` id.
2. Place it in `Backlog` or `TODO` with a priority.
3. Link it from the active spec doc or changelog entry if relevant.

## TODO State Model

Maintain these sections in `spec/TODO.md`:

- `Backlog`
- `TODO`
- `In Progress`
- `Done`

Within `TODO`, use priorities `P0` through `P4`.

State rules:

- `Backlog` holds ideas that are useful but not scheduled.
- `TODO` holds accepted work that is not active yet.
- `In Progress` holds only currently active work.
- `Done` holds completed items with the spec or changelog reference that closed them.
- During archive cleanup, move older closed items out of `Done` and into `spec/archive/TODO.md`.

Do not keep the same item in two sections.

## Architecture Maintenance

`ARCHITECTURE.md` must stay useful for context recovery.

Keep it focused on:

- system purpose
- top-level folders and modules
- critical flows
- interfaces and invariants
- command or document routing rules
- known structural risks

When a flow is complex, include ASCII diagrams. Diagrams are part of the contract. If code changes invalidate a diagram, update the diagram in the same maintenance pass.

## Changelog Standard

`CHANGELOG.md` records shipped outcomes, not raw diary noise.

Each entry should answer:

- what changed
- why it mattered
- which spec doc tracked it
- which TODO ids it resolved or deferred
- what evidence exists

Prefer user-visible or architecture-visible language over commit-diff narration.

Keep the active changelog focused on recent history. During archive cleanup, keep only the latest five version entries in `spec/CHANGELOG.md` and move older ones into `spec/archive/CHANGELOG.md`.

## Writing Style

All memo-managed documents must be written in English.

Read `references/writing-guide.md` before writing or revising:

- `ARCHITECTURE.md`
- `TODO.md`
- `MEMORY.md`
- `CHANGELOG.md`
- `spec/test/`
- any combined spec-task file in `spec/docs/`

## Self-Review

Before finishing a memo update:

1. Check that each changed file matches the triggering event.
2. Check that ids, links, and filenames are consistent.
3. Check that no section contains vague filler or placeholders.
4. Check that the combined spec-task file starts with the smallest coherent change rather than an inflated rewrite.
5. Check that each section marks a real reviewable project state.
6. Check that each phase is independent enough to execute from its stated context rather than hidden knowledge from another phase.
7. Check that each phase contains only tasks that share the same close context.
8. Check that tasks inside each phase follow the same concrete task-writing style used by `writing-plans`.
9. Check that facts match the repo state.
10. Check that unchanged files truly did not need updates.
11. Check that stale closed history is archived instead of cluttering the active memory surface.

## Templates

Use these reference files directly:

- `references/templates/ARCHITECTURE.template.md`
- `references/templates/TODO.template.md`
- `references/templates/MEMORY.template.md`
- `references/templates/CHANGELOG.template.md`
- `references/templates/task-spec.template.md`

## Script

Use `scripts/init-spec.py` to bootstrap a fresh project safely.

Rules:

- Refuse to initialize when the target project already contains `spec/` or other likely plan-management markers.
- Surface the exact conflicting paths in the error.
- Continue only when the user explicitly wants `--force`.
- If `git` is unavailable, skip all git-related work.
- If `.gitignore` exists, append the `spec/` ignore block without overwriting the file.
