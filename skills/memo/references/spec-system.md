# Spec System

## Purpose

The `spec/` directory is the durable project state surface for agent work.

Future agents should be able to answer three questions from it before reading much code:

1. What does this project do?
2. What is changing now?
3. What changed recently?

## Version Control Boundary

By default, `spec/` is internal agent and project state, not product source. Do not stage, commit, push, or publish it through the product repository unless the user explicitly opts in. If `spec/` needs recovery history, use a separate repository or private backup surface.

## Folder Contract

```text
spec/
  OVERVIEW.md
  ARCHITECTURE.md
  MEMORY.md
  architecture/
    <domain>.md
  memory/
    <pattern-name>.md
  CHANGELOG.md
  test/
  docs/
    #NNN-{work-description}.md
```

`spec/architecture/` is optional. Create it only when root `ARCHITECTURE.md` has earned a domain split under the architecture contract. The root file remains the index; fragments hold domain details.

`MEMORY.md` is the memory index, injected at session start. Individual memory entries live under `memory/`. Memo owns recall, write, update, deletion, and compaction behavior through the memory event.

`CHANGELOG.md` `## Unreleased` is the task tracker: changelog-worthy work is recorded there at completion, and a release compresses it into a version or checkpoint section. There is no separate current-work file.

`spec/docs/` is optional execution context. Create task specs only for explicit plans, handoffs, or complex spec-backed work.

## Read Order

For a new task in an established project, use this order:

1. `spec/OVERVIEW.md`
2. `spec/MEMORY.md` through Memo memory recall when the task may involve project-specific operational patterns
3. `spec/ARCHITECTURE.md` when durable structure, routing, data flow, module boundaries, or cross-file impact context is needed
4. the relevant `spec/architecture/*.md` fragment only when root `ARCHITECTURE.md` routes the task there
5. the relevant `spec/memory/*.md` entry only when Memo memory recall or the memory index points to it
6. `spec/CHANGELOG.md` `## Unreleased` for recent closed-but-unreleased work, then released sections when older closed work may affect the current decision
7. the newest relevant combined spec-task file in `spec/docs/` only when directly linked or clearly overlapping
8. related test files in `spec/test/` when the task includes verification work

Read code after that only where the docs are insufficient or possibly stale.

Use confidence tiers when documents disagree: code, tests, configuration, build scripts, and Git history outrank Memo documents; `spec/CHANGELOG.md` `## Unreleased` outranks durable spec files for recent task state; durable spec files are long-term memory and may lag until promotion.

## Write Order

When creating the system for the first time:

1. `OVERVIEW.md`
2. `ARCHITECTURE.md`
3. `MEMORY.md`
4. `CHANGELOG.md`
5. `test/`
6. the first combined spec-task file at `spec/docs/#001-{work-description}.md` only when there is an accepted spec-backed task

When updating during normal work, touch only the files required by the current event.

## ID Rules

- Spec ids: `#001`, `#002`, `#003`
- Task files: `#NNN-{work-description}.md`
- Slugs: lowercase hyphen-case

If the project already uses another stable pattern, preserve the old pattern.

## Event Routing

`SKILL.md` owns event selection. Use this file only for spec layout, read order, write order, ids, and routing contracts. Routine updates must still read the selected event file and the contracts for documents being written.

## Routing Rules

Every `OVERVIEW.md` should include a short document map that tells future agents which spec file to read for project context, structure, active work, and closed outcomes.

Every root `ARCHITECTURE.md` should include a short routing section that tells future agents:

- where to start reading
- which directories are authoritative
- which documents are likely stale or derived
- which architecture fragment, if any, owns the relevant domain

## Update Principle

Keep the spec system event-driven.

Bad pattern:

- rewrite every document after every task

Good pattern:

- update `CHANGELOG.md` `## Unreleased` when changelog-worthy file-changing work closes
- update a combined spec-task file when an explicit spec-backed task changes scope
- update architecture only when structure changes
- checkpoint or compress `CHANGELOG.md` when closed history starts to hide current context

## Minimal Change Planning

The combined spec-task file should describe the smallest coherent change that can satisfy the current goal.

Use these rules:

1. Start by mapping the minimum affected files.
2. Prefer focused edits to existing files over broader rewrites.
3. Expand into new files or larger refactors only when the smaller change cannot satisfy the requirement cleanly.
4. If the work is still too large, split it into separate approved task specs or section checkpoints.

## Section-Centered Planning

`Section` is the only required execution-plan level.

A section is a reviewable checkpoint owned by the main thread. It should move the bounded task into a meaningful project state that can be inspected before continuing, such as "minimum language gate is proven", "provider is selectable", or "English frontend audio plays in app".

`Phase` and `Task` are optional structure inside a section. Use them only when they reduce ambiguity:

- Use a `Phase` when one section has a meaningful internal checkpoint.
- Use a `Task` when a phase or section contains several implementation units that become easier to scan when named separately.
- Omit both when the section already carries the work cleanly.
- Delete wrappers that only repeat the section goal instead of adding executable clarity.

Good pattern:

- one section for each reviewable state the project must reach
- implementation details, failure behavior, verification, and coverage checks written directly inside that section
- `Phase` or `Task` levels added only when they clarify a genuinely nested unit of work

Bad pattern:

- one section per tiny edit
- mandatory `Phase` or `Task` wrappers that only restate the section title
- phases that mix unrelated backend, frontend, and docs changes
- optional, approval-dependent, or future work written as ordinary executable sections

## Trigger Source

The complete trigger map lives in `SKILL.md`. Detailed action rules live in `references/events/`.
