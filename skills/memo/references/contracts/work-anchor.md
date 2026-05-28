# Current Work Buffer Contract

Use this contract when Memo is reading, validating, closing, archiving, or promoting entries in `spec/current-work.md`.

## Responsibility

`current-work.md` records the intent and reconciliation state of active, paused, closed, and not-yet-archived file-changing tasks. It is a bounded work buffer, not a task spec, changelog, backlog, or diary.

Memo uses it to avoid guessing task intent from git diff. Work uses it to keep tasks traceable across sessions.

## Format Authority

The canonical anchor format and lifecycle rules live in `using-gei/references/current-work.md`. Read that file when you need the entry shape, field definitions, or exemption rules. Do not redefine the format here.

## Write Rules

Do not overwrite an `active` or `paused` entry when starting an unrelated task. Append a new entry instead and leave the old one in place until reconciliation marks it archived.

Update the existing entry when the current task is a direct continuation of that entry.

Keep `Intent` concrete enough to explain why the changed files exist. Keep `Expected scope` concrete enough to compare against the actual changed files.

Do not infer a full plan from git diff when the anchor is missing — surface the gap instead.

Use `Durable record needed: unknown` when unsure at task start.

## Close and Archive Rules

At every phase boundary, choose one of these transitions for each entry:

- **Closed:** work or phase ended, but whether to promote has not been decided.
- **Archived without promotion:** complete, no durable spec value. Set `Status: archived`, `Promotion: none`, add a short `Promotion note`.
- **Archived after promotion:** update the target Memo document first, then set `Status: archived` and point `Promotion` at that document.
- **Paused:** work will resume from this exact anchor.

Closing an entry does not imply promotion. Promotion requires the promotion gate in the reconciliation event.

Release, publish, handoff, and deliberate Memo sync are phase boundaries. Do not carry an old active entry across them without explicitly closing, pausing, or archiving it.

Cleanups may remove only entries already marked `archived`. Do not delete `active`, `paused`, or `closed` entries because a new task is starting.

## Completion Check

Before finishing a Memo update that touches `spec/current-work.md`:

- Each unarchived entry describes one task only.
- No stale `active` entry exists for work that has clearly ended.
- The close or archive choice is explicit.
- Durable work has a spec entry only when it passed the promotion gate.
- Non-durable complete work is marked `Status: archived` with `Promotion: none`.
- `spec/` remains excluded from product commits unless the user explicitly opted in.
