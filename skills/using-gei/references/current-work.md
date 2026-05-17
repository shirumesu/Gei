# Current Work Lifecycle

Read this file only when the task may write files, publish, commit, or maintain project state.

## Rule

Before the first file edit, the task **MUST** have one of these:

1. an existing `spec/current-work.md`
2. a new micro-anchor in `spec/current-work.md`
3. an explicit no-anchor exemption stated to the user

User wording such as "small", "lightweight", "quick", "minor", or "ad hoc" does **not** bypass this rule when files may be changed.

## Must Anchor

Create or overwrite `spec/current-work.md` when any item is true:

- the task changes existing project code, config, docs, skills, tests, or release files
- more than one file may change
- the user describes a goal instead of a mechanical one-line edit
- the task may require tests, build, lint, release, commit, PR, or deployment
- the workspace already has unclear uncommitted changes
- the work may affect future agents' understanding
- the user or AI is about to make a small, lightweight, quick, minor, or ad hoc file change

## Allowed No-Anchor Exemptions

Skip `spec/current-work.md` only when one item is true:

- pure answer, explanation, translation, brainstorming, or summary with no file writes
- pure inspect, read, or search with no file writes
- one mechanical line edit in one temporary or personal file, with no project state impact
- the user explicitly says not to record it, and the task does not touch release, commit, migration, deletion, configuration, or durable project docs

When skipping, state the reason in this shape:

```text
No anchor: [specific exemption].
```

## Micro-Anchor Format

Use this minimum shape. Overwrite stale content at the start of a new anchored task unless the current task is explicitly resuming it.

```md
# Current Work

- Id: `#W-YYYYMMDD-001`
- Intent: <why this file-changing work is happening>
- Started: YYYY-MM-DD
- Expected scope: <files, directories, or "unknown until inspection">
- Durable record needed: unknown | yes | no
- Status: active | paused | closed
```

Do not add `Author` or `Actor`.

## Cleanup

Close or clear `spec/current-work.md` at every phase boundary:

- after a lightweight task finishes and verification is reported
- before or after a release, publish, handoff, or version checkpoint
- after Memo records a durable plan or shipped outcome
- when starting an unrelated anchored task

Prefer hard overwrite for a new task. Do not carry old current-work data forward by default.
