# TODO Change Event

Use this event when the live work ledger changes.

## Trigger

Trigger this event when any TODO item is:

- added
- reprioritized
- moved between `Backlog`, `TODO`, `In Progress`, and `Done`
- linked to or unlinked from a `#NNN-{work-description}.md`
- split into multiple TODO items
- deferred from the current task
- resolved

## Required Reading

Read:

1. `references/contracts/todo.md`
2. `spec/TODO.md`
3. The active spec-task file only when the TODO change affects current scope
4. `references/contracts/changelog.md` only when the TODO movement reflects shipped or deferred work at a checkpoint

## Actions

1. Allocate a new `#TOD-###` id only for a new item.
2. Update `TODO.md`.
3. Update the active `#NNN-{work-description}.md` when the TODO change affects current scope.
4. Update `CHANGELOG.md` only if the TODO movement reflects shipped or deferred work at a checkpoint.
5. Keep each TODO item in exactly one state section.

## State Rules

- `Backlog` holds ideas that are useful but not scheduled.
- `TODO` holds accepted work that is not active yet.
- `In Progress` holds only currently active work.
- `Done` holds completed items with the spec or changelog reference that closed them.
- During archive cleanup, move older closed items out of `Done` and into `spec/archive/TODO.md`.

Within `TODO`, use priorities `P0` through `P4`.

Do not keep the same item in two sections.

## Completion Check

Before finishing:

- TODO ids are unique and ordered by the repo's existing pattern.
- Each moved item has the right state.
- Done items include close-out references.
- The active spec-task and changelog were updated only when the event required them.
