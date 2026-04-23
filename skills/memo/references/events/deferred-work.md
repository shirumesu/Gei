# Deferred Work Event

Use this event when useful work is intentionally postponed and should remain visible after the current task ends.

## Trigger

Trigger this event when:

- a useful follow-up is intentionally not included in the current task
- a larger goal is split and later phases need durable tracking
- a known issue is accepted temporarily and must not disappear
- a rejected scope item should remain visible as future work

Do not create deferred work for vague possibilities, speculative ideas, or nice-to-have cleanup without a clear reason.

## Required Reading

Read:

1. `references/contracts/todo.md`
2. `spec/TODO.md`
3. The active spec-task file if the deferred work came from current scope
4. `references/contracts/changelog.md` only if the deferral belongs in a ship checkpoint

## Actions

1. Allocate a new `#TOD-###` id.
2. Place the item in `Backlog` or `TODO` with a priority.
3. Link it from the active spec doc or changelog entry if relevant.
4. State why it is deferred and what would make it active.

## Completion Check

Before finishing:

- The deferred item has a stable id.
- The priority is present if the item is in `TODO`.
- The reason for deferral is explicit.
- The current task scope did not silently expand to include the deferred work.
