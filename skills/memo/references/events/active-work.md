# Active Work Event

Use this event when the current bounded spec-backed task changed after its spec-task file was created.

## Trigger

Trigger this event when any of these changed:

- current task goal or scope
- constraint
- assumption that became a confirmed fact
- affected file list
- interface
- verification command or test strategy
- test file path under `spec/test/`

For ordinary file-changing tasks that are not spec-backed, use `anchor-reconciliation.md` at close instead of creating a task spec.

## Required Reading

Read:

1. `references/contracts/task-spec.md`
2. The active `spec/docs/#NNN-{work-description}.md`
3. `references/contracts/architecture.md` only if structure, routing, entry points, boundaries, or major data flow changed

Do not read unrelated spec docs unless the active file cannot identify the current scope.

## Actions

Update the active combined spec-task file when:

- scope changes
- assumptions become facts
- important files or interfaces change
- spec-managed test files or verification strategy change

Do not touch `ARCHITECTURE.md` unless system structure, routing, entry points, boundaries, or major flow actually changed.

Do not write routine progress updates, elapsed time, temporary debugging notes, or full decision history.

## Completion Check

Before finishing:

- The active spec-task file reflects the new scope or confirmed facts.
- The verification plan names exact commands or observable manual checks.
- Any secondary `ARCHITECTURE.md` update is justified by its own contract.
- No broad doc refresh happened.
