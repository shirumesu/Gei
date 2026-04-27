# Spec System

## Purpose

The `spec/` directory is the durable memory surface for the project.

Future agents should be able to answer three questions from it before reading much code:

1. What does this project do?
2. What is changing now?
3. What hard-won knowledge must not be rediscovered?

## Version Control Boundary

By default, `spec/` is internal agent and project memory, not product source. Do not stage, commit, push, or publish it through the product repository unless the user explicitly opts in.

If `spec/` needs recovery history, use a separate Git repository inside `spec/` or an external local/private backup remote. Keep the product repository and the spec repository as separate version-control surfaces.

## Folder Contract

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

`spec/archive/` is optional. Create it only when an archive cleanup pass actually moves content out of the active files.

## Read Order

For a new task in an established project, use this order:

1. `spec/ARCHITECTURE.md`
2. `spec/TODO.md`
3. the newest relevant combined spec-task file in `spec/docs/`
4. related test files in `spec/test/` when the task includes verification work
5. related `MEMORY.md` entries
6. the latest related `CHANGELOG.md` entries

Read code after that only where the docs are insufficient or possibly stale.

For an archive cleanup pass, read in this order:

1. `spec/TODO.md`
2. `spec/CHANGELOG.md`
3. `spec/MEMORY.md`
4. existing files in `spec/archive/`
5. the current spec-task file only if it is needed to classify a borderline entry

During archive cleanup, do not read code unless the user asked for it or the docs are too stale to classify an entry safely.

## Write Order

When creating the system for the first time:

1. `ARCHITECTURE.md`
2. `TODO.md`
3. `MEMORY.md`
4. `CHANGELOG.md`
5. `test/`
6. the first combined spec-task file at `spec/docs/#001-{work-description}.md`

When updating during normal work, touch only the files required by the current event.

When updating during archive cleanup, create `spec/archive/` only if content is actually moved there.

## ID Rules

- Spec ids: `#001`, `#002`, `#003`
- Task files: `#NNN-{work-description}.md`
- TODO ids: `#TOD-001`, `#TOD-002`, `#TOD-003`
- Slugs: lowercase hyphen-case

If the project already uses another stable pattern, preserve the old pattern.

## Event Routing

`SKILL.md` owns event selection. Use this file for full spec layout, read order, write order, ids, and routing contracts.

Do not use this file as a substitute for the per-event instructions under `references/events/`. Routine updates should read the selected event file and only the contracts for documents being written.

## Routing Rules

Every `ARCHITECTURE.md` should include a short routing section that tells future agents:

- where to start reading
- which commands matter
- which directories are authoritative
- which documents are likely stale or derived

## Update Principle

Keep the memory system event-driven.

Bad pattern:

- rewrite every document after every task

Good pattern:

- update the combined spec-task file when scope changes
- update memory when a pitfall, rejection, or version-specific hazard becomes reusable
- update the changelog when a task ships
- update architecture only when structure changes
- run an archive cleanup when closed history starts to hide current context

For detailed archive procedure, read `references/archive.md`.

## Minimal Change Planning

The combined spec-task file should describe the smallest coherent change that can satisfy the current goal.

Use these rules:

1. Start by mapping the minimum affected files.
2. Prefer focused edits to existing files over broader rewrites.
3. Expand into new files or larger refactors only when the smaller change cannot satisfy the requirement cleanly.
4. If the work is still too large, split it into later phases or TODO items.

## Section Phase Task Hierarchy

Structure each combined spec-task file with three levels:

1. **Section**
   Use for a milestone checkpoint owned by the main thread. A section should mean the project can be reviewed at a meaningful intermediate state such as "skeleton complete" or "main feature set complete".
2. **Phase**
   Use for one independent worker-sized unit within that section. A phase may depend on the declared results of earlier phases, but it should not depend on their hidden context. Everything needed to execute the phase should be available from the spec file itself.
3. **Task**
   Use for the smallest indivisible instruction. Tasks inside one phase may share local context and should follow the same concrete task structure as `writing-plans`.

Good pattern:

- one section for "project skeleton ready for first review"
- one phase for "initialize project"
- one phase for "create placeholder files and complete the visible skeleton"
- one task per indivisible instruction inside that phase, written with exact files and exact steps

Bad pattern:

- one section per tiny edit
- one phase that mixes unrelated backend, frontend, and docs changes
- one phase that only works if the worker already remembers detailed reasoning from another phase
- one task that still says "and then handle the rest"

## Trigger Source

The complete trigger map lives in `SKILL.md`. The detailed action rules live in one file per event:

- `references/events/init.md`
- `references/events/task-start.md`
- `references/events/active-work.md`
- `references/events/memory-entry.md`
- `references/events/todo-change.md`
- `references/events/architecture-change.md`
- `references/events/ship.md`
- `references/events/deferred-work.md`
- `references/events/catch-up.md`
- `references/archive.md`
