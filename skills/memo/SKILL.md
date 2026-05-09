---
name: memo
description: Use when maintaining system spec documents or durable project memory; when a workflow points to Memo; when spec docs, TODO state, architecture context, reusable pitfalls, durable rejections, catch-up notes, archive cleanup, or shipped outcomes must be recorded for future agents.
---

# Memo

Memo owns the durable project memory system under `spec/`.

Its job is to keep future agents productive without forcing a fresh deep read of the whole repo. It does that through stable spec structure, event-driven updates, and strict progressive disclosure.

`spec/` is an AI work manual for the project. A future agent should be able to read the relevant spec surface and understand what the project does, where a task starts, which files and modules may be affected, what boundaries must be preserved, and how to verify the change.

`spec/current-work.md` is different: it is a lightweight lifecycle anchor for the current or most recent file-changing task. It may be created by `using-gei` or `work`, and Memo uses it as intent evidence instead of reconstructing work from git diff alone.

## Version Control Boundary

By default, `spec/` is internal agent and project memory. Do not stage, commit, push, or publish it through the product repository unless the user explicitly opts in. If durable versioning is needed, prefer a separate repository or private backup surface.

## Core Rule

Write only what the current event requires. Do not bulk-rewrite unrelated documents, refresh every file because a task happened, or invoke Memo for ordinary code edits that do not change durable project knowledge. Update the smallest correct surface, with exact ids and links.

Long documents are acceptable when they reduce execution ambiguity for future agents, including weaker models. Length must serve task execution, context recovery, or impact analysis. Do not shorten a plan merely to save tokens if the missing detail would cause an agent to guess, and do not write long documents as diaries.

A long Memo document must remain structured as a working manual: exact goals, boundaries, files, interfaces, impact paths, commands, examples, expected outputs, and verification steps.

## Source Of Truth

The product code, tests, configuration, build scripts, and Git history are the source of truth. Memo documents are navigation, planning, and durable project memory.

If Memo conflicts with repository state, do not silently trust Memo. Verify against the repo, update the smallest affected Memo surface, and record the mismatch only when it is durable and useful for future work.

If `spec/current-work.md` exists, read it before reconstructing a task from changed files. Treat it as intent evidence, not proof that the implementation is correct.

## Retrieval-Friendly Writing

Prefer stable headings, exact paths, symbols, commands, ids, links, and task-entry routes. A future agent should be able to search for a feature, module, route, command, or TODO id and land near the right context.

When recording architecture or task context, include where to start reading, which files may be affected, which interfaces or flows may break, and which documents or directories are derived or stale. Do not use broad prose when a path, symbol, command, or decision id would guide the next agent faster.

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
| Anchor reconciliation | `spec/current-work.md` must be closed, cleared, promoted into Memo docs, or reconciled with existing changes | `references/events/anchor-reconciliation.md` |
| Catch-up | Work already happened outside Memo and must be captured into `spec/INBOX.md` before full reconciliation | `references/events/catch-up.md` |
| Archive cleanup | The user asks to archive, or active memory files are noisy with stale history | `references/archive.md` |

## Document Contracts

Read a contract only when the selected event will create or modify that document type.

Pure catch-up capture does not require a document contract. It writes only `spec/INBOX.md`; after capture, reroute to a formal event before reconciling into canonical spec files.

- `spec/ARCHITECTURE.md`: `references/contracts/architecture.md`
- `spec/OVERVIEW.md`: `references/contracts/overview.md`
- `spec/TODO.md`: `references/contracts/todo.md`
- `spec/MEMORY.md`: `references/contracts/memory.md`
- `spec/CHANGELOG.md`: `references/contracts/changelog.md`
- `spec/docs/#NNN-{work-description}.md`: `references/contracts/task-spec.md`
- `spec/current-work.md`: `references/contracts/work-anchor.md`
- Full spec layout, ids, read order, and initialization rules: `references/spec-system.md`
- Broad writing-quality cleanup or large doc rewrite: `references/writing-guide.md`

Templates remain available under `references/templates/`. Use them when creating a new file from scratch; do not read every template for routine edits.

## Spec Layout

Memo maintains this default layout:

```text
spec/
  OVERVIEW.md
  ARCHITECTURE.md
  TODO.md
  MEMORY.md
  CHANGELOG.md
  current-work.md
  archive/
    TODO.md
    MEMORY.md
    CHANGELOG.md
  test/
  docs/
    #NNN-{work-description}.md
```

`spec/archive/` is optional. Create it only when archive cleanup actually moves content out of the active files.

`current-work.md` is optional and temporary. Create it for anchored work; close, clear, or overwrite it at phase boundaries.

## Naming Rules

Preserve the repo's existing stable scheme. Otherwise use zero-padded spec ids (`#001`), task files named `#NNN-{work-description}.md`, TODO ids (`#TOD-001`), lowercase hyphen-case slugs, and exact id reuse in inline references.

## Global Writing Rules

All Memo-managed documents must be written in English. Write facts, constraints, decisions, file paths, commands, ids, evidence, and durable risks. Do not write diary updates, full chains of thought, vague filler, or invented metrics. If coverage, completion rate, or other metrics are unavailable, write `not measured` or `not instrumented`.

## Self-Review

Before finishing a Memo update:

1. Check that each changed file matches the selected event.
2. Check that ids, links, and filenames are consistent.
3. Check that no section contains vague filler or unresolved placeholders.
4. Check that facts match the repo state or the user-provided evidence.
5. Check that unchanged Memo files truly did not need updates.
6. Check that stale closed history is archived instead of crowding the active memory surface.
