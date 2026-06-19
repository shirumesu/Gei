# Architecture Change Event

Use this event when project structure, routing, commands, module boundaries, data flow, or diagrams changed.

## Trigger

Trigger this event when any of these changed:

- top-level folder or module ownership
- routing or request/data flow
- important command, runtime, dependency, or setup path
- public interface between major parts
- architecture diagram or extension point
- spec read order or workflow routing rules

## Required Reading

Read:

1. `references/contracts/architecture.md`
2. `spec/ARCHITECTURE.md`
3. `references/contracts/changelog.md` only if this architecture change is also being closed as file-changing work
4. The active spec-task file only when it explains the architecture change

## Actions

1. Update only the architecture sections that changed.
2. Keep the routing and command guidance exact.
3. If the task is closing now, ensure `CHANGELOG.md` records the closed file-changing work through `../contracts/changelog.md`.
4. Do not rewrite unrelated diagrams or broad project descriptions.

## Completion Check

Before finishing:

- The changed structure or flow is represented in `ARCHITECTURE.md`.
- Commands and paths are exact.
- The update is narrow and does not duplicate source files.
- Any changelog update is handled through the changelog contract.
