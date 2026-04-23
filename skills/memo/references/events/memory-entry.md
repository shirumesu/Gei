# Memory Entry Event

Use this event when new durable project memory must prevent future agents from repeating a mistake.

## Trigger

Trigger this event when any of these are true:

- A technical mistake is likely to happen again.
- A command, file pattern, or workflow caused a repeatable failure.
- A user rejected a direction, wording, or behavior that might be proposed again across similar tasks.
- A library, tool, or version introduced a hazard future agents should notice early.

Do not use this event for ordinary progress updates, routine design choices, one-off file-local instructions, or full decision histories.

## Required Reading

Read:

1. `references/contracts/memory.md`
2. `spec/MEMORY.md`
3. The active spec-task file only if the memory entry needs a task reference.

Do not read architecture, changelog, TODO, or unrelated docs unless the memory entry cannot be classified without them.

## Actions

1. Decide whether the entry is reusable across multiple tasks, files, or sessions.
2. If it is too local or temporary, do not write to `MEMORY.md`; record it in the active task spec if it affects current execution.
3. Add or update one concise `MEMORY.md` entry.
4. Name the trigger, failure mode, safe pattern, scope, and verification.
5. Link the relevant file path, command, error text, spec id, or TODO id when known.

## Durable Rejection Rule

Record a user rejection only when it is general enough to guide future work.

Good fit:

- The user rejects a recurring workflow, wording pattern, implementation style, or tool choice across similar work.

Bad fit:

- The user dislikes one sentence in one draft.
- The user changes their mind for a single task.
- The rejection only matters to one local patch.

## Completion Check

Before finishing:

- The entry is reusable, not a diary note.
- The safe pattern is specific enough to follow.
- The entry names its scope.
- No unrelated memory entries were rewritten.
