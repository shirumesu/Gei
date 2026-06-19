# Task Start Event

Use this event when a new bounded spec-backed task is accepted and needs a combined spec-task file.

Do not use this event for routine file-changing work. Routine work records a typed entry under `spec/CHANGELOG.md` `## Unreleased` at completion.

## Trigger

Trigger this event when any of these are true:

- the user approved a full design that needs a durable execution plan
- the task is multi-phase or handoff-heavy enough that future agents need a spec-task file
- the user explicitly asks for a spec-backed plan
- an existing accepted plan is becoming the active implementation context

## Required Reading

Read:

1. `references/contracts/task-spec.md`
2. The newest relevant file in `spec/docs/` only when it overlaps the accepted task

## Actions

1. Allocate the next `#NNN` id only when creating a new task spec.
2. Create or update `spec/docs/#NNN-{work-description}.md`.
3. Write the accepted goal, scope, constraints, affected files, verification method, and execution plan.
4. Do not create backlog or general-purpose memory records.

## Completion Check

Before finishing:

- The task spec has a concrete goal, scope, files, and verification method.
- The spec id and filename match.
- No unrelated spec documents were rewritten.
