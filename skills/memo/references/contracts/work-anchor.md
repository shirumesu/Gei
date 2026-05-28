# Current Work Buffer Contract

Use this contract when creating, checking, appending, closing, archiving, or cleaning `spec/current-work.md`.

## Responsibility

`current-work.md` records the intent and reconciliation state of active, paused, closed, and not-yet-archived file-changing tasks. It is a bounded work buffer, not a task spec, changelog, backlog, or diary.

Memo uses it to avoid guessing task intent from git diff. Work uses it to keep small, lightweight, quick, minor, and ad hoc changes traceable.

## Required Shape

Validate the same minimum shape created by `using-gei` or `work`:

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

## Write Rules

- **MUST NOT** overwrite `active`, `paused`, or `closed` entries when starting an unrelated task.
- **MUST** append a new entry for unrelated work unless the file is empty or contains only archived entries being deliberately cleaned.
- **MUST** update the existing entry when the current task is a direct continuation of that entry.
- **MUST** keep `Intent` concrete enough to explain why changed files exist.
- **MUST** keep `Expected scope` concrete enough to compare against changed files.
- **MUST NOT** infer a full plan from git diff when the anchor is missing.
- Use `Durable record needed: unknown` when unsure.
- Keep entries short. If an entry needs a durable plan, promote the plan to a task spec instead of expanding `current-work.md`.

## Close And Archive Rules

At phase end, choose one entry-level transition:

- **Closed:** set `Status: closed` when the task or phase ended but durable promotion has not been decided.
- **Archived without promotion:** set `Status: archived`, `Promotion: none`, and a short `Promotion note` when the task is complete and has no durable spec value.
- **Archived after promotion:** update the correct Memo document, then set `Status: archived` and point `Promotion` at that document.
- **Paused:** keep `Status: paused` only when work will resume from this exact anchor.

Closing an entry never implies durable promotion. Promotion requires the promotion gate in the reconciliation event.

Release, publish, handoff, checkpoint, and deliberate Memo sync are phase boundaries. Do not carry an old active entry across them; close, pause, or archive it explicitly.

Cleanups may remove only entries already marked `archived`. Do not delete `active`, `paused`, or `closed` entries merely because a new task is starting.

## Completion Check

- Each unarchived entry describes one task only.
- The buffer has no stale `active` entry for work that has clearly ended.
- The close choice is explicit.
- Durable work has a spec entry only when it passed the promotion gate.
- Non-durable complete work is marked `Status: archived` with `Promotion: none`.
- `spec/` remains excluded from product commits unless the user explicitly opted in.
