# Memory

Each scope's `MEMORY.md` is a short retrieval index. Detailed entries live in its sibling `memory/` directory. Read only linked summaries that can change the current task.

## Write Gate

Write only when skipping the lesson would let a future agent repeat a mistake, miss a hidden constraint, or rediscover a non-obvious operational rule. Useful candidates include a user correction, repeated failure, environment or timing trap, packaging constraint, durable preference, or proven workflow boundary.

Do not store facts obvious from code or Overview, general advice, routine task status, logs, transcripts, copied external content, secrets, or instructions that weaken safety and verification.

## Destination

- Project by default.
- Group when the lesson applies to multiple member Projects.
- Shared Context only when it clearly applies across unrelated projects.
- IMPACTS instead when the core fact is a downstream consequence of changing a surface.
- A task document instead when the content is an accepted handoff or recovery plan.

Move or merge an existing entry before creating a duplicate. Use `templates/memory-entry.md`, preserve its fixed headings, remove `gei:empty` from the selected index, and add one concise linked summary line. When the last entry is removed, restore the empty marker so the Hook stops injecting that scope.

Report a meaningful write, move, merge, or deletion. Keep a no-write decision silent unless the user asked about it.
