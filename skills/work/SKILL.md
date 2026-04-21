---
name: work
description: Use before undertaking any coding tasks, including code modifications, testing, code reviews, version updates, project releases, and other related tasks. It outlines a detailed process.
---

# Work

## Overview

Work owns the core production loop. Its job is to turn an approved spec-task into verified code, then close the loop through review, memo maintenance, and a final ship gate.

**Announce at start:** "I'm using the work skill to execute this spec task."

This skill is for the main thread. Keep orchestration here. Send low-level execution, review, and ship behavior through the reference files in `references/`.

## Entry Gate

Before execution, confirm all of the following:

1. The current repo has an active `spec/docs/#NNN-work.md` for the accepted task.
2. The task has enough context to execute. Read `spec/ARCHITECTURE.md`, `spec/TODO.md`, relevant `spec/MEMORY.md`, the active `spec/docs/#NNN-work.md`, and any relevant files under `spec/test/` first.
3. The work is running in an isolated git worktree or another explicitly approved isolated branch/workspace.
4. The current branch is not `main` or `master` unless the user explicitly approved that risk.

If the repo lacks usable `spec/` context or the task does not yet have a bounded `#NNN-work.md`, stop and start from `kickoff`, then hand off to `memo`.

## Iron Laws

- **No production code without a failing test first.**
- If code appears before the test, delete it and restart from RED.
- Do not leave `TODO`, `TBD`, placeholder branches, or half-implemented logic in production code.
- Do not guess through unclear instructions, missing interfaces, or missing dependencies. Stop and surface the blocker.
- Before any destructive action such as force push, production mutation, irreversible migration, or delete-heavy command, get a second human confirmation.
- Do not claim "done", "fixed", or "verified" without command evidence in the current conversation.

## Execution Ledger

Maintain a live execution list while working.

- Use `In Progress` when a step is actively being worked.
- Use `Verified` only after recording the exact command and the observed output that proved the step.
- If a step changes shape, mark it `Changed` and state why.

Do not close the task from memory or intuition. Close it from evidence.

## Default Loop

Follow this loop unless the active spec-task explicitly requires a different order.

0. **Recover context**
   Read the current project context and the active `spec/docs/#NNN-work.md`. If the repo does not yet have enough bounded context, start from `kickoff`.
1. **Audit the active spec-task**
   Check whether the current spec-task matches the repo structure, module boundaries, constraints, and conventions. If the plan is unclear or stale, stop and repair it before coding.
2. **Write the full test surface first**
   Create the task tests under `spec/test/` for the current section or phase. Run them and confirm they can execute and fail for the expected reason. If the tests pass immediately or fail for the wrong reason, fix the test or the plan first.
3. **Dispatch one worker per phase**
   The main thread stays as the orchestrator. Dispatch one worker subagent per phase. Each worker receives:
   - the active `spec/docs/#NNN-work.md`
   - the exact phase or task to implement
   - the exact files and tests it may touch
   - `skills/work/references/worker.md`
   - `spec/ARCHITECTURE.md` only when the phase touches shared boundaries
4. **Wait while the worker executes**
   While a worker is active, do not start side implementation in the main thread. Wait, monitor for blockers, and prepare the next dispatch only.
5. **Run the phase return gate**
   When a worker returns, review the phase twice in the main thread:
   - spec compliance review: did it follow the active task exactly?
   - code quality review: is the result minimal, coherent, and free of obvious waste?

   If the phase passes both checks, run the required verification and create one atomic commit before dispatching the next phase.
6. **Run the section checkpoint**
   When every phase in the current section is back, dispatch one review agent with `skills/work/references/review.md`.

   That review agent stays single-threaded. It must switch roles internally across Eng, Design, and DX review passes instead of spawning three separate reviewers.
7. **Decide the fix list**
   The main thread decides which findings must be fixed now.
   - Fix immediately: task-related findings, high-blast-radius issues, correctness gaps, or simple material fixes.
   - Defer through `memo`: warnings, low-impact polish, or non-essential follow-ups.

   If the review agent is asked to fix issues, it may only fix the approved list.
8. **Sync durable memory**
   After the approved fixes land and the affected tests pass, call `memo` to update `spec/` and any related TODO state. Then create one atomic commit for the section checkpoint.
9. **Re-open tests for the next section**
   Before the next section starts, re-check whether the current `spec/test/` surface still matches the task. If the section changed assumptions, rewrite or extend the tests first, then continue from step 3.
10. **Enter the ship gate**
    When every section is closed, the tests are green, `memo` is up to date, and the worktree is clean, use `skills/work/references/ship.md` and move into the final release gate.

## Stop Conditions

Stop execution immediately when any of these is true:

- the active spec-task is unclear or contradicts the repo state
- the next phase cannot be executed with the current dependencies
- the worker needs wider context than the plan can justify and targeted file reads do not resolve it
- verification keeps failing and root cause is still unknown
- a destructive action is next and the user has not confirmed it

Do not improvise around these conditions.

## Section Gate

Do not treat a section as complete until all of the following are true:

1. Every phase in the section is returned.
2. The main thread performed both local review passes.
3. The section review agent completed its multi-role audit.
4. Approved fixes landed.
5. The section's targeted and affected tests passed.
6. The section checkpoint commit exists.

## Termination

Treat the task as complete only when all of the following are true:

1. Every planned item is `Done` or `Changed` with a reason.
2. All new tests and all affected existing tests are green.
3. The current branch or worktree is clean apart from intentionally staged release actions.
4. `memo` is up to date.
5. The ship gate ran and returned a clear release status.
6. The main thread has stopped and handed the next decision back to the user.

## Dispatch Prompts

Use short prompts. Pass only the task-local artifacts the agent needs.

### Worker Prompt Template

```text
You are the execution worker for [Section X / Phase Y].

Read:
- skills/work/references/worker.md
- spec/docs/#NNN-work.md
- [exact files and tests for this phase]
- spec/ARCHITECTURE.md only if the phase touches shared boundaries

Default to the plan. Do not widen your repo read unless the assigned task truly requires it.

Task:
- [exact phase goal]
- [exact files to create/modify]
- [exact tests to write first and run]

Return:
- status: done or blocked
- files changed
- tests written before code
- commands run and observed output
- spec drift or blocker notes

Do not commit unless I explicitly ask.
```

### Review Prompt Template

```text
You are the single review agent for [Section X].

Read:
- skills/work/references/review.md
- spec/docs/#NNN-work.md
- spec/ARCHITECTURE.md
- spec/TODO.md
- spec/MEMORY.md
- [changed files]
- [test output or screenshots if relevant]

Mode: Audit

Focus on the approved task only. Stay read-only. Do not fix code yet.

Return:
- findings ordered by severity
- confidence score 1-10 for each finding
- items below 7 marked pending confirmation
- Lake Score
- approved-now vs deferable suggestions
```

### Fix-After-Review Prompt Template

```text
You are the review agent returning in fix mode.

Read:
- skills/work/references/review.md
- [approved finding list]
- [exact files allowed for fixes]
- [affected tests]

Mode: Fix

Fix only the approved items. Re-run the affected verification. Return updated evidence and a new Lake Score.
```

### Ship Prompt Template

```text
You are running the ship gate for this task.

Read:
- skills/work/references/ship.md
- spec/docs/#NNN-work.md
- spec/ARCHITECTURE.md
- [version files if any]

Run the release gate. Do not merge, push, or force push unless I explicitly ask.

Return:
- branch and worktree status
- test evidence
- scan evidence
- spec parity check
- version bump recommendation and updated files or tag
- remaining blockers
- user-facing next choices
```
