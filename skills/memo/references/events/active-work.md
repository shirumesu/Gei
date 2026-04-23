# Active Work Event

Use this event when the current bounded task changed after its spec-task file was created.

## Trigger

Trigger this event when any of these changed:

- current task goal or scope
- constraint
- assumption that became a confirmed fact
- affected file list
- interface
- verification command or test strategy
- test file path under `spec/test/`

If the change is only a repeatable pitfall, durable rejection, or version-specific hazard, use `memory-entry.md` as the primary event.

## Required Reading

Read:

1. `references/contracts/task-spec.md`
2. The active `spec/docs/#NNN-{work-description}.md`
3. `references/contracts/memory.md` only if the active change also exposed a reusable pitfall
4. `references/contracts/architecture.md` only if structure, routing, commands, or major data flow changed

Do not read unrelated spec docs unless the active file cannot identify the current scope.

## Actions

Update the active combined spec-task file when:

- scope changes
- assumptions become facts
- important files or interfaces change
- spec-managed test files or verification strategy change

Update `MEMORY.md` only when the change exposed a repeatable pitfall, durable rejection, or version-specific hazard.

Do not touch `ARCHITECTURE.md` unless system structure, routing, commands, or major flow actually changed.

Do not write routine progress updates, elapsed time, temporary debugging notes, or full decision history.

## Completion Check

Before finishing:

- The active spec-task file reflects the new scope or confirmed facts.
- The verification plan names exact commands or observable manual checks.
- Any secondary `MEMORY.md` or `ARCHITECTURE.md` update is justified by its own contract.
- No broad doc refresh happened.
