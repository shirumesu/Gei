# Work

## Overview

Work owns the spec-aware heavy production loop. Its job is to turn an approved spec-backed task into verified code, then close the loop through review, Memo maintenance, and a final ship gate.

This skill is for the main thread. Keep orchestration here. Send low-level execution, review, and ship behavior through the reference files in `references/`.

`memo` is the authority for `spec/` read order, document contracts, lifecycle events, and write rules. Work consumes the active task context and decides execution mechanics; it does not define a parallel spec system.

## Entry Gate

Before execution, confirm all of the following:

1. The current repo has a usable `spec/` system and an accepted active task, plan, or spec-task.
2. The task has enough context to execute after recovering spec context according to Memo's current standard.
3. The work is running in an isolated git worktree, an isolated branch, or another explicitly approved workspace.
4. The current branch is not `main` or `master` unless the user explicitly approved using it for implementation risk.

If the repo lacks usable `spec/` context or the task is not actually spec-backed heavy work, return to `references/light.md`. Do not initialize, repair, or create spec documents from Work.

## Spec Boundary

Recover spec context by using Memo as the operating standard. Read the Memo entry point when you need to know which spec files to read or which event applies; do not copy Memo's contracts into this file.

During execution, invoke `memo` only when a Memo event is actually triggered, such as active scope drift, TODO movement, architecture changes, reusable pitfalls, deferred work, or a ship checkpoint. Let Memo choose the event and document contracts. Do not directly maintain `spec/` from Work-specific rules.

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
   Recover the active task context through Memo's current standard. If there is no usable accepted spec-backed task, route back to `references/light.md`.
1. **Audit the active spec-task**
   Check whether the active task context matches the repo structure, module boundaries, constraints, and conventions. If the plan is unclear or stale, stop and route the needed document repair through Memo instead of patching spec files directly.
2. **Write the full test surface first**
   Create the task tests where the active task context and repo conventions place them. Use `spec/test/` only when the Memo-backed task context assigns that surface. Run the tests and confirm they can execute and fail for the expected reason. If the tests pass immediately or fail for the wrong reason, fix the test or the plan first.
3. **Implement or delegate by phase**
   The main thread stays as the orchestrator. Implement locally by default. Use worker subagents only when the user explicitly asked for delegation or approved it for this task.

   Each local phase or delegated worker receives only:
   - the active task context recovered through Memo
   - the exact phase or task to implement
   - the exact files and tests it may touch
   - `skills/work/references/worker.md` when a worker is used
4. **Coordinate active workers when used**
   While a worker is active, do not start side implementation in the same files. Monitor for blockers, and prepare the next dispatch only.
5. **Run the phase return gate**
   When a phase completes, review it twice in the main thread:
   - spec compliance review: did it follow the active task exactly?
   - code quality review: is the result minimal, coherent, and free of obvious waste?

   If the phase passes both checks, run the required verification and create one atomic commit before the next phase when commits are part of the task.
6. **Run the section checkpoint**
   When every phase in the current section is back, run a section review. Use one review agent with `skills/work/references/review.md` only when the user explicitly asked for delegation or approved it for this task.

   If a review agent is used, it stays single-threaded and switches roles internally across Eng, Design, and DX review passes instead of spawning three separate reviewers.
7. **Decide the fix list**
   The main thread decides which findings must be fixed now.
   - Fix immediately: task-related findings, high-blast-radius issues, correctness gaps, or simple material fixes.
   - Defer through `memo`: warnings, low-impact polish, or non-essential follow-ups.

   If the review agent is asked to fix issues, it may only fix the approved list.
8. **Sync durable memory**
   After the approved fixes land and the affected tests pass, call `memo` only for the relevant triggered event. Then create one atomic commit for the section checkpoint when commits are part of the task.
9. **Re-open tests for the next section**
   Before the next section starts, re-check whether the current test surface still matches the task. If the section changed assumptions, rewrite or extend the tests first, then continue from step 3.
10. **Enter the ship gate**
    When every section is closed, the tests are green, triggered Memo updates are complete, and the worktree is clean, use `skills/work/references/ship.md` and move into the final release gate.

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

1. Every phase in the section is complete.
2. The main thread performed both local review passes.
3. The section review agent completed its multi-role audit when one was used.
4. Approved fixes landed.
5. The section's targeted and affected tests passed.
6. The section checkpoint commit exists when commits are part of the task.

## Termination

Treat the task as complete only when all of the following are true:

1. Every planned item is `Done` or `Changed` with a reason.
2. All new tests and all affected existing tests are green.
3. The current branch or worktree is clean apart from intentionally staged release actions.
4. Any Memo-triggering event has been handled through `memo`.
5. The ship gate ran and returned a clear release status.
6. The main thread has stopped and handed the next decision back to the user.

## Dispatch Prompts

Use short prompts. Pass only the task-local artifacts the agent needs.

### Worker Prompt Template

```text
You are the execution worker for [Section X / Phase Y].

Read:
- skills/work/references/worker.md
- [active task context recovered through Memo]
- [exact files and tests for this phase]

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
- [active task context recovered through Memo]
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
- [active task context recovered through Memo if this task is spec-backed]
- [version files if any]

Run the release gate. Do not create a new branch for release. Do not merge, tag, push, or force push unless I explicitly ask or the release request already includes that action.

Return:
- branch and worktree status
- test evidence
- scan evidence
- spec parity check
- version bump recommendation and updated files or tag
- remaining blockers
- user-facing next choices
```
