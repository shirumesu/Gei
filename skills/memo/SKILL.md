---
name: memo
description: Use when maintaining system spec documents; when a workflow points to Memo; when spec docs, architecture context, current-work reconciliation, catch-up notes, or shipped outcomes must be recorded for future agents.
---

# Memo

Memo owns the project spec system under `spec/`.

Its job is to keep future agents productive without forcing a fresh deep read of the whole repo. It does that through stable spec structure, event-driven updates, and strict progressive disclosure.

`spec/` is an AI work manual for the project. A future agent should be able to read the relevant spec surface and understand what the project does, where a task starts, which files and modules may be affected, what boundaries must be preserved, and how completed changes were recorded.

`spec/current-work.md` is different: it is a bounded current-work buffer for active, paused, closed, and not-yet-archived file-changing tasks. It may be created by `using-gei` or `work`, and Memo uses it as intent evidence instead of reconstructing work from git diff alone. Optimize it for resumability, not audit completeness.

Treat project context by confidence tier:

1. Repository code, tests, configuration, build scripts, and Git history are authoritative.
2. `spec/current-work.md` is recent task memory. It should track active or recently closed work closely enough to explain intent, debugging context, release/checkpoint basis, and future promotion decisions.
3. `spec/OVERVIEW.md`, `spec/ARCHITECTURE.md`, and `spec/CHANGELOG.md` are durable storage. They are updated at phase or promotion boundaries and may lag behind the first two tiers.

## Version Control Boundary

By default, `spec/` is internal agent and project state. Do not stage, commit, push, or publish it through the product repository unless the user explicitly opts in. If durable versioning is needed, prefer a separate repository or private backup surface.

## Core Rule

Write only what the current event requires. Do not bulk-rewrite unrelated documents, refresh every file because a task happened, or invoke Memo for ordinary code edits except required current-work reconciliation. Update the smallest correct surface, with exact ids and links.

Closing a current-work entry never means it must enter durable spec documents. Promote closed work only when it has durable value for future agents, releases, architecture, handoff, or recovery. Otherwise mark the entry archived with `Promotion: none` and keep durable spec files lean.

Long documents are acceptable when they reduce execution ambiguity for future agents, including weaker models. Length must serve task execution, context recovery, or impact analysis. Do not shorten a plan merely to save tokens if the missing detail would cause an agent to guess, and do not write long documents as diaries. Prefer an index plus targeted fragments over one long durable document when that reduces the number of irrelevant lines a future task must read.

A long Memo document must remain structured as a working manual: exact goals, boundaries, files, interfaces, impact paths, examples, expected outputs, and non-obvious verification notes. Do not duplicate command lists that are already authoritative in package manifests or scripts.

## Source Of Truth

The product code, tests, configuration, build scripts, and Git history are the source of truth. Memo documents are navigation, planning, and durable project state.

If Memo conflicts with repository state, do not silently trust Memo. Verify against the repo and update the smallest affected Memo surface.

If `spec/current-work.md` exists, read it before reconstructing a task from changed files. Treat it as intent evidence, not proof that the implementation is correct.

## Retrieval-Friendly Writing

Prefer stable headings, exact paths, symbols, commands, ids, links, and task-entry routes. A future agent should be able to search for a feature, module, route, command, or checkpoint and land near the right context.

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
| Architecture change | Structure, routing, commands, module boundaries, data flow, or diagrams changed | `references/events/architecture-change.md` |
| Ship | A task reached handoff, merge, release, shipped state, or another durable checkpoint | `references/events/ship.md` |
| Anchor reconciliation | `spec/current-work.md` entries must be closed, archived, promoted into Memo docs, or reconciled with existing changes | `references/events/anchor-reconciliation.md` |
| Catch-up | Work already happened outside Memo and must be captured into `spec/INBOX.md` before full reconciliation | `references/events/catch-up.md` |

## Document Contracts

Read a contract only when the selected event will create or modify that document type.

Pure catch-up capture does not require a document contract. It writes only `spec/INBOX.md`; after capture, reroute to a formal event before reconciling into canonical spec files.

- `spec/ARCHITECTURE.md`: `references/contracts/architecture.md`
- `spec/OVERVIEW.md`: `references/contracts/overview.md`
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
  CHANGELOG.md
  current-work.md
  test/
  docs/
    #NNN-{work-description}.md
```

`current-work.md` is optional and temporary-to-medium-term. Create it for anchored work; append entries for unrelated work; close or archive entries at phase boundaries; clean only entries already marked archived.

## Naming Rules

Preserve the repo's existing stable scheme. Otherwise use zero-padded spec ids (`#001`), task files named `#NNN-{work-description}.md`, lowercase hyphen-case slugs, and exact id reuse in inline references.

## Global Writing Rules

All Memo-managed documents must be written in English. Write facts, constraints, decisions, file paths, commands, ids, evidence, and durable risks. Do not write diary updates, full chains of thought, vague filler, or invented metrics. If coverage, completion rate, or other metrics are unavailable, write `not measured` or `not instrumented`.

## Self-Review

Before finishing a Memo update:

1. Check that each changed file matches the selected event.
2. Check that ids, links, and filenames are consistent.
3. Check that no section contains vague filler or unresolved placeholders.
4. Check that facts match the repo state or the user-provided evidence.
5. Check that unchanged Memo files truly did not need updates.
6. Check that stale closed history is archived instead of crowding the active spec surface.
