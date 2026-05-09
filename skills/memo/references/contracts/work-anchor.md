# Work Anchor Contract

Use this contract when creating, checking, closing, or clearing `spec/current-work.md`.

## Responsibility

`current-work.md` records the intent of the current or most recent file-changing task. It is a lightweight anchor, not a TODO list, task spec, changelog, or diary.

Memo uses it to avoid guessing task intent from git diff. Work uses it to keep small, lightweight, quick, minor, and ad hoc changes traceable.

## Required Shape

Validate the same minimum shape created by `using-gei` or `work`:

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

## Write Rules

- **MUST** overwrite stale content when starting an unrelated task.
- **MUST** keep `Intent` concrete enough to explain why changed files exist.
- **MUST** keep `Expected scope` concrete enough to compare against changed files.
- **MUST NOT** convert every small task into `TODO.md`.
- **MUST NOT** infer a full plan from git diff when the anchor is missing.
- Use `Durable record needed: unknown` when unsure.

## Close Rules

At phase end, choose exactly one:

- **Closed:** set `Status: closed` when the task is verified and has no durable value.
- **Cleared:** delete file contents or remove the file when no active or recent anchor should remain.
- **Promoted:** update Memo docs through the correct event, then clear or replace the anchor.
- **Paused:** keep `Status: paused` only when work will resume from this exact anchor.

Release, publish, handoff, and deliberate Memo sync are phase boundaries. Do not carry an old active anchor across them.

## Completion Check

- The anchor describes one task only.
- The anchor has no stale unrelated intent.
- The close choice is explicit.
- `spec/` remains excluded from product commits unless the user explicitly opted in.
