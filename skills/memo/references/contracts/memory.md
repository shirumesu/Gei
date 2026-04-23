# Memory Contract

Use this contract when creating or updating `spec/MEMORY.md`.

## Responsibility

`MEMORY.md` is a do-not-repeat ledger. It records repeatable pitfalls, durable rejected directions, version-specific hazards, and checks that prevent those mistakes from happening again.

Do not keep one-off file-local notes here.

## Record Only

Record an entry only when a fresh agent could plausibly repeat the mistake across multiple tasks, files, or sessions.

Valid entry types:

- Technical
- Workflow
- User Rejection
- Version-Specific

Skip:

- routine progress notes
- ordinary design choices
- one-off file-local instructions
- full decision histories
- personal preference that applies only to one draft

## Entry Shape

```md
### MEM-001: Short pitfall name

- Type: Technical | Workflow | User Rejection | Version-Specific
- Trigger:
- Symptom or error:
- What went wrong:
- How to avoid it next time:
- Safe verification:
- Scope:
- Links:
- Time marker: only when the hazard is version-specific or otherwise time-bound
```

## Write Rules

- Name the trigger, the failure, and the safe pattern.
- Include relevant file path, command, error text, spec id, TODO id, or version when known.
- Keep the entry concise enough to scan.
- When an entry looks too local or stale to keep active, surface it as an archive candidate instead of silently treating it as durable memory.

## Completion Check

- The entry is reusable.
- The scope is explicit.
- The safe verification is actionable.
- No unrelated entries were rewritten.
