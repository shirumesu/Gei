---
name: memo
description: Use when initializing, maintaining, or pruning a project's spec system; when a bounded task needs spec tracking; when spec docs, TODO state, architecture context, reusable pitfalls, durable rejections, catch-up notes, archive cleanup, or shipped outcomes must be recorded for future agents.
---

# Memo

Memo owns the durable project memory system under `spec/`.

Its job is to keep future agents productive without forcing a fresh deep read of the whole repo. It does that through stable spec structure, event-driven updates, and strict progressive disclosure.

## Core Rule

Write only what the current event requires.

Do not bulk-rewrite unrelated documents. Do not refresh every file because a task happened. Update the smallest correct surface, with exact ids and links.

Do not invoke Memo for ordinary code edits that do not change durable project knowledge.

## Loading Rule

1. Read this file first.
2. Select exactly one primary event from the event map.
3. Read only the reference file listed for that primary event.
4. Read only the document contract files for documents you will actually create or modify.
5. Do not read other Memo references unless the selected event explicitly requires them.
6. If several events match, choose the highest-impact event and let that event file list any secondary updates.
7. If the event only needs a temporary capture, use the catch-up event instead of reconstructing the whole project.

## Event Map

| Primary event | Use when | Read |
| --- | --- | --- |
| Init | `spec/` is missing, incomplete, or the project has no working spec system | `references/events/init.md` |
| Task start | A new bounded task is accepted and needs a current spec-task file | `references/events/task-start.md` |
| Active work | Current task scope, constraints, affected files, interface, or verification plan changed | `references/events/active-work.md` |
| Memory entry | A repeatable pitfall, durable rejection, or version-specific hazard was discovered | `references/events/memory-entry.md` |
| TODO change | A TODO item was added, moved, reprioritized, resolved, split, or deferred | `references/events/todo-change.md` |
| Architecture change | Structure, routing, commands, module boundaries, data flow, or diagrams changed | `references/events/architecture-change.md` |
| Ship | A task reached handoff, merge, release, shipped state, or another durable checkpoint | `references/events/ship.md` |
| Deferred work | Useful work is intentionally postponed and should remain visible | `references/events/deferred-work.md` |
| Catch-up | Work already happened outside Memo and must be captured into `spec/INBOX.md` before full reconciliation | `references/events/catch-up.md` |
| Archive cleanup | The user asks to archive, or active memory files are noisy with stale history | `references/archive.md` |

## Document Contracts

Read a contract only when the selected event will create or modify that document type.

Pure catch-up capture does not require a document contract. It writes only `spec/INBOX.md`; after capture, reroute to a formal event before reconciling into canonical spec files.

- `spec/ARCHITECTURE.md`: `references/contracts/architecture.md`
- `spec/TODO.md`: `references/contracts/todo.md`
- `spec/MEMORY.md`: `references/contracts/memory.md`
- `spec/CHANGELOG.md`: `references/contracts/changelog.md`
- `spec/docs/#NNN-{work-description}.md`: `references/contracts/task-spec.md`
- Full spec layout, ids, read order, and initialization rules: `references/spec-system.md`
- Broad writing-quality cleanup or large doc rewrite: `references/writing-guide.md`

Templates remain available under `references/templates/`. Use them when creating a new file from scratch; do not read every template for routine edits.

## Spec Layout

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

`spec/archive/` is optional. Create it only when archive cleanup actually moves content out of the active files.

## Naming Rules

Apply these rules unless the repo already follows a different stable scheme:

- Spec docs use zero-padded ids: `#001`, `#002`, `#003`
- Task files use `#NNN-{work-description}.md`, where `work-description` is the task slug
- TODO ids use `#TOD-001`, `#TOD-002`, `#TOD-003`
- Slugs use lowercase hyphen-case
- Inline references reuse the same ids exactly

When the repo already has a numbering pattern, preserve it instead of renaming old files.

## Global Writing Rules

All Memo-managed documents must be written in English.

Write facts, constraints, decisions, file paths, commands, ids, evidence, and durable risks. Do not write diary updates, full chains of thought, vague filler, or invented metrics.

Never invent evidence. If coverage, completion rate, or other metrics are unavailable, write `not measured` or `not instrumented`.

## Self-Review

Before finishing a Memo update:

1. Check that each changed file matches the selected event.
2. Check that ids, links, and filenames are consistent.
3. Check that no section contains vague filler or unresolved placeholders.
4. Check that facts match the repo state or the user-provided evidence.
5. Check that unchanged Memo files truly did not need updates.
6. Check that stale closed history is archived instead of crowding the active memory surface.
