# Architecture Change Event

Use this event when durable system structure changed.

## Trigger

Trigger this event when any of these are true:

- a top-level folder responsibility changed
- a module boundary changed
- a routing rule changed
- a required command changed
- a system flow or state transition changed
- the role of `spec/test/` changed
- a diagram in `ARCHITECTURE.md` became stale

Do not use this event for ordinary implementation details that do not change how future agents should understand the system.

## Required Reading

Read:

1. `references/contracts/architecture.md`
2. `spec/ARCHITECTURE.md`
3. The active spec-task file if the current task caused the change
4. `references/contracts/memory.md` only if the change exposed a repeatable pitfall or hazard

## Actions

1. Update `ARCHITECTURE.md`.
2. Update the active `#NNN-{work-description}.md` if the current task caused the change.
3. Update `MEMORY.md` only if the change exposed a repeatable pitfall or hazard.
4. Audit any ASCII diagrams affected by the change.

## Architecture Focus

Keep `ARCHITECTURE.md` focused on:

- system purpose
- top-level folders and modules
- critical flows
- interfaces and invariants
- command or document routing rules
- known structural risks

When a flow is complex, include ASCII diagrams. Diagrams are part of the contract. If code changes invalidate a diagram, update the diagram in the same maintenance pass.

## Completion Check

Before finishing:

- The changed structure is visible in `ARCHITECTURE.md`.
- A future agent can find the new command, route, boundary, or flow without reading unrelated code.
- Stale diagrams were updated or explicitly marked as checked.
- No changelog update was made unless the change also reached a ship checkpoint.
