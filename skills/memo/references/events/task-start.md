# Task Start Event

Use this event when a new bounded task becomes accepted work and needs a combined spec-task file.

## Trigger

Trigger this event when any of these are true:

- The user approved a new bounded task.
- The agent is about to start planning or execution for a task with no current `#NNN-{work-description}.md`.
- The next task was selected from `TODO.md` and is becoming active.

Do not use this event for vague idea exploration. Use the project's planning flow first, then create the spec-task file after the task is bounded.

## Required Reading

Read only what is needed:

1. `references/contracts/task-spec.md`
2. `references/contracts/todo.md` if TODO ids need to be created, linked, or moved.
3. Existing `spec/TODO.md` and the newest relevant file in `spec/docs/`.
4. Code or project docs only where the existing spec files are insufficient.

## Actions

1. Allocate the next spec id by scanning `spec/docs/#*.md`.
2. Map the smallest coherent set of files, tests, and doc changes that can satisfy the task.
3. Create or update `spec/docs/#NNN-{work-description}.md`.
4. Group work into sections, phases, and tasks:
   - sections mark reviewable milestone states
   - phases are independent worker-sized units with stated files, constraints, and expected change
   - tasks are indivisible instructions that can share local phase context
5. Link related TODO ids.
6. Reserve or update files under `spec/test/` only when the task needs spec-managed tests.
7. Move active work into `In Progress` only when execution truly begins.
8. Record current constraints that the task must respect.

## Minimal Change Rule

Every combined spec-task file must start from the smallest coherent change that can satisfy the goal.

Apply these rules:

1. Prefer the smallest viable file set.
2. Prefer modifying existing focused files before introducing new files, modules, or layers.
3. Do not include unrelated refactors in the same task just because files are nearby.
4. If the full goal is too large for one bounded change, split it into later phases or TODO items.
5. Within each phase, tasks should be atomic enough that an agent can execute them without further decomposition.
6. If two work units do not need the same close context, they do not belong in the same phase.

Use larger structural changes only when the smaller change cannot meet the requirement cleanly.

## Completion Check

Before finishing:

- The spec id and filename are consistent.
- The task has a clear goal, constraints, relevant files, and verification path.
- TODO links are present when TODO items exist.
- No unrelated document was rewritten.
