# Memory Recall

Use this route when existing project memory may affect the current task.

## Trigger

Run recall when any of these are true:

- A new Gei task starts in a project with injected `spec/MEMORY.md`.
- The task scope changes enough that new files, modules, errors, commands, or workflows are involved.
- The user points at a remembered convention, previous correction, local environment quirk, or repeated failure.
- A final answer, plan, or implementation decision would be worse if an existing memory entry were ignored.

## Process

1. Start from the injected `spec/MEMORY.md` index. If no index exists, state `Memory checked: no MEMORY.md found` only when memory would otherwise matter.
2. Compare each `Read when ...` line against the current task intent, files, commands, errors, environment, and current-work entry.
3. Read only linked entries whose trigger plausibly matches. Do not bulk-read `spec/memory/`.
4. Convert each read entry into a concrete current-task constraint, verification step, or non-goal.
5. If an entry conflicts with repository code, tests, config, or a direct user instruction, verify the higher-authority source and state the conflict.
6. Repeat recall after meaningful scope changes.

## Output Markers

Use one concise marker so hooks and future agents can see that recall happened:

```text
Memory applied: <memory-name> -> <current constraint>
Memory skipped: <memory-name> -> <why it does not apply>
Memory checked: no relevant entries
```

Examples:

```text
Memory applied: config-save-effects -> I will verify the Main-side consumer, not just the save path.
Memory skipped: ship-release-process -> this is not a release/versioning task.
Memory checked: no relevant entries
```

## Do Not

- Treat the index as a to-do list. It is a router.
- Read entries after implementation just to satisfy process.
- Apply a memory blindly when code or user instructions contradict it.
- Save new memory during recall. Use `write.md` for that decision.
