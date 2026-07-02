# Memory Recall

Use this route when existing project memory may affect the current task.

## Trigger

Run recall when any of these are true:

- A new Gei task starts in a project with injected `spec/MEMORY.md`.
- The task scope changes enough that new files, modules, errors, commands, or workflows are involved.
- The user points at a remembered convention, previous correction, local environment quirk, or repeated failure.
- A final answer, plan, or implementation decision would be worse if an existing memory entry were ignored.

## Process

1. Start from the injected `spec/MEMORY.md` index. If no index exists, continue silently unless memory would otherwise matter to the answer.
2. Compare each linked summary line against the current task intent, files, commands, errors, and environment. The summary is a hint, not the full rule.
3. Read only linked entries whose summary plausibly matters. Do not bulk-read `spec/memory/`.
4. Convert each read entry into a concrete current-task constraint, verification step, or non-goal.
5. If an entry conflicts with repository code, tests, config, or a direct user instruction, verify the higher-authority source and state the conflict.
6. Repeat recall after meaningful scope changes.

## User Visibility

Memory recall is usually internal. Mention it to the user only when a recalled entry changed the answer, created a constraint worth surfacing, conflicts with higher-authority context, or the user asked about memory state.

Do not output no-op statuses for "no index", "no relevant entries", or "not applicable" in ordinary responses.

Examples worth mentioning:

```text
I applied the config-save-effects memory, so I verified the Main-side consumer instead of only the save path.
I ignored the ship-release-process memory because this task is not a release or versioning task.
```

## Do Not

- Treat the index as a to-do list or complete instruction set. It is a router to fuller memory entries.
- Read entries after implementation just to satisfy process.
- Apply a memory blindly when code or user instructions contradict it.
- Save new memory during recall. Use `write.md` for that decision.
