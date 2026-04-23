# Ship Event

Use this event when a task reaches a durable checkpoint.

## Trigger

Trigger this event when any of these are true:

- a task was merged
- a task was released
- a task was shipped
- a user-visible checkpoint was reached
- a formal handoff happened and the result should be part of durable history

## Required Reading

Read:

1. `references/contracts/task-spec.md`
2. `references/contracts/changelog.md`
3. `references/contracts/todo.md`
4. The active spec-task file
5. `spec/TODO.md`
6. `spec/CHANGELOG.md`
7. `references/contracts/architecture.md` and `spec/ARCHITECTURE.md` only for the stale diagram audit or when architecture changed

## Actions

1. Update the combined spec-task file with the final outcome.
2. Update `CHANGELOG.md` with the shipped change.
3. Move resolved TODO items into `Done` with references.
4. Run a stale diagram audit against `ARCHITECTURE.md`.
5. Add metrics only when evidence exists.

Never invent metrics. If coverage, completion rate, or other evidence is unavailable, write `not measured` or `not instrumented`.

## Changelog Standard

`CHANGELOG.md` records shipped outcomes, not raw diary noise.

Each entry should answer:

- what changed
- why it mattered
- which spec doc tracked it
- which TODO ids it resolved or deferred
- what evidence exists

Prefer user-visible or architecture-visible language over commit-diff narration.

Keep the active changelog focused on recent history. During archive cleanup, keep only the latest five version entries in `spec/CHANGELOG.md` and move older ones into `spec/archive/CHANGELOG.md`.

## Completion Check

Before finishing:

- The active task spec records final outcome and evidence.
- `CHANGELOG.md` has a checkpoint entry with spec and TODO references.
- Resolved TODOs moved to `Done`.
- Deferred work has TODO references.
- Architecture diagrams were checked when relevant.
