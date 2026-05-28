# Current Work Lifecycle

Read this file only when the task may write files, publish, commit, or maintain project state.

## Rule

Before the first file edit, the task **MUST** have one of these:

1. an existing `spec/current-work.md`
2. a new work-buffer entry appended to `spec/current-work.md`
3. an explicit no-anchor exemption stated to the user

User wording such as "small", "lightweight", "quick", "minor", or "ad hoc" does **not** bypass this rule when files may be changed.

## Must Anchor

Create `spec/current-work.md` or append a new entry when any item is true:

- the task changes existing project code, config, docs, skills, tests, or release files
- more than one file may change
- the user describes a goal instead of a mechanical one-line edit
- the task may require tests, build, lint, release, commit, PR, or deployment
- the workspace already has unclear uncommitted changes
- the work may affect future agents' understanding
- the user or AI is about to make a small, lightweight, quick, minor, or ad hoc file change

Do not overwrite existing unarchived entries. If the new task is related to an existing `active`, `paused`, or `closed` entry, update that entry instead of appending a duplicate. If it is unrelated, append a new entry and leave the old entry in place until reconciliation marks it archived.

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

## Work-Buffer Format

Use this minimum shape when creating the file:

```md
# Current Work

## `#W-YYYYMMDD-001` - <short task label>

- Intent: <why this file-changing work is happening>
- Started: YYYY-MM-DD
- Expected scope: <files, directories, or "unknown until inspection">
- Durable record needed: unknown | yes | no
- Status: active | paused | closed | archived
- Promotion: pending | none | `spec/CHANGELOG.md` | `spec/docs/#NNN-name.md` | `spec/ARCHITECTURE.md` | `spec/INBOX.md`
- Promotion note: <optional short reason when promotion is none or delayed>
```

Do not add `Author` or `Actor`.

Status meanings:

- `active`: work is in progress and must not be overwritten.
- `paused`: work may resume and must not be overwritten.
- `closed`: the task or phase ended, but promotion or no-promotion has not been decided.
- `archived`: promotion was completed or explicitly judged unnecessary; the entry may be removed during later cleanup.

Closing an entry never implies promotion into durable spec documents. Promotion is conditional and must pass the Memo promotion gate. If no durable record is justified, set `Status: archived`, set `Promotion: none`, add a short `Promotion note`, and keep the entry until a later cleanup removes archived entries.

## Cleanup

Update `spec/current-work.md` at every phase boundary:

- after a lightweight task finishes and verification is reported
- before or after a release, publish, handoff, or version checkpoint
- after Memo records a durable plan or shipped outcome
- when starting an unrelated anchored task

Prefer append or targeted entry update for new work. Remove or compact only entries already marked `archived`; never delete `active`, `paused`, or `closed` entries merely because a new unrelated task is starting.
