---
name: work
description: Use when the user wants coding execution such as implementation, bug fixing, tests, builds, refactors, releases, or other code-changing work. Handles all task sizes in a single unified flow — reads spec when present, chooses meaningful verification, executes in sections, and routes to ship when releasing.
---

# Work

Work is the execution skill for all coding tasks. 

`memo` owns the `spec/` document system. Work reads `spec/` as context but does not write or maintain spec documents directly.
`learn` owns project memory recall and write decisions. Work applies relevant memory before planning and leaves durable memory writes to Learn.
`spec/current-work.md` is lifecycle state and recent task memory, not a durable spec document. Work creates it when missing, updates only the matching entry, appends unrelated entries, and closes or pauses entries at phase boundaries.

## Always-On Rules

- Do not guess through unclear instructions, missing interfaces, or missing dependencies. Stop and surface the blocker.
- Before any destructive action — force push, production mutation, irreversible migration, deploy, publish, or delete-heavy command — get explicit human confirmation.
- Do not claim `done`, `fixed`, or `verified` without command evidence in the current conversation.
- If the task requires reading, reconciling, or updating durable `spec/` documents, invoke `memo` before continuing Work.
- Before staging or committing, confirm that `spec/` files are not staged unless the user explicitly approved tracking them.

## Step 0: Recover Context

### Check for spec

If `spec/` exists in the current workspace, read the relevant spec documents before doing anything else. Use `memo` to determine read order. Do not propose a plan that contradicts existing architecture or active tasks.

When context sources disagree, trust repository code/config/tests/Git history first, `spec/current-work.md` second for recent task intent and state, and durable spec files third because they may lag until Memo promotion.

If `spec/MEMORY.md` exists, scan its injected index before feasibility planning. Read linked memory entries only when their `Read when ...` trigger matches the task, then state `Memory applied:`, `Memory skipped:`, or `Memory checked: no relevant entries`.

If `spec/` does not exist, do not create it. Proceed without it.

### Set the current-work anchor

If the task is pure read, search, explanation, or summary with no file writes, skip this step and state: `No anchor: read-only task.`

For all file-changing tasks, check `spec/current-work.md` before the first file edit. The anchor format and full field rules are defined in `memo/references/contracts/work-anchor.md` — read that file when creating or updating an anchor.

Decision rules:

- If the file matches the current task, continue without changes.
- If it contains a related active or paused entry, update that entry.
- If it contains unrelated work, append a new entry; do not touch the existing ones.
- If it is missing, create it following the format in `memo/references/contracts/work-anchor.md`.

Do not skip this step because the task feels small. Do not overwrite active or paused entries from unrelated work.

Re-check the anchor after scope expands, before verification, and before final response or commit.

Re-check memory recall after scope expands into new files, commands, errors, or workflows.

## Step 1: Check Feasibility

Confirm what the task is changing, what it might break, and what a successful result looks like. If the task is underspecified after a small context read, ask one precise question. Do not start coding with an unclear goal.

Identify the blast radius: which files, modules, and behaviors are affected.

## Step 2: Plan Sections

Divide the work into sections before coding. A section is a coherent, committable slice of the task.

**If a spec plan file exists** (e.g. `spec/docs/#NNN-task-name.md` with explicit phases or sections): use those sections directly. Do not invent new ones.

**If no spec plan exists**: divide the work yourself into the smallest sections that each produce a meaningful, testable result. Record sections in `spec/current-work.md`.

Each section ends with:
1. Targeted verification passing
2. A commit (when commits are part of the task)
3. A section checkpoint line added to `spec/current-work.md`

Section checkpoint format:
```
- Section checkpoint: [Section N] [what was done]. Verified with `[command]` on YYYY-MM-DD.
```

## Step 3: Choose Verification

Before implementation, decide the smallest verification surface that can prove the section worked. Prefer command-line verification that exercises real behavior through the most stable public surface available.

**Consider writing a test** when the section changes behavior in ways that could regress silently:
- Bug fixes where the broken behavior can be exercised from a stable test surface
- Security, permissions, or authorization logic changes
- Persistence, serialization, or data migration logic
- Parsing or validation that accepts external input
- Public APIs or CLI behavior contracts
- Configuration or feature-flag behavior where enable/disable paths could break independently
- Integration across IPC, network boundaries, or plugin interfaces where wiring could drift

**Skip new tests by default** for:
- Pure documentation, comments, formatting, or metadata changes
- Mechanical refactors already covered by typecheck/build (renames, moves, extract-function)
- Internal implementation changes with no observable behavior difference
- Trivial bug fixes where existing tests or runtime already catch the failure (missing null check, typo)
- Deleting dead code when existing commands prove no live reference remains
- Changes where command-line verification is stronger than a new test (build output, CLI smoke test, schema validation)

Do not write a test just to satisfy process. If no new test is warranted, state the reason and name the command-line checks that will prove the section instead.

When tests are required, read `references/testcraft.md` before writing them. Design tests around observable behavior and the full behavior chain. For example, a configuration change should prove that the setting can be enabled and disabled, persists through the real config path, and changes the consuming behavior; it should not merely prove that a function, file, schema field, or import exists.

Low-value tests are forbidden as the primary verification for a section: file or folder existence, function-name checks, source-code regex checks, import-presence checks, mock-only assertions, "does not throw" assertions, and tests that only confirm the implementation shape. Use these only as temporary migration checks when no better command-line verification exists, and label that limitation.

If no new test is warranted, state the reason and name the command-line checks that will prove the section instead, such as targeted existing tests, lint, typecheck, build, schema validation, CLI smoke checks, or repository-specific validation scripts.

When a new test is warranted and can be written before implementation, run it first and confirm it fails for the expected reason. If the best verification can only be run after implementation, state why, then run it as soon as the behavior is reachable.

## Step 4: Implement

Write the smallest coherent change set that satisfies the current section.

- Do not widen scope because adjacent cleanup looks tempting.
- Do not add placeholder comments, placeholder branches, or dead code.
- Do not rewrite durable docs unless the task assigns them.

Run the targeted verification after each meaningful unit of code. Once it passes, run the broader affected verification: related tests, lint, build, typecheck, or other command-line checks based on the real blast radius.

## Step 5: Self-Check

Before closing a section, read your own changes and confirm:

- The change solves the requested problem without drift.
- The implementation is minimal and free of obvious waste.
- No new placeholder comments, placeholder logic, or half-implemented paths were left in.
- If the change is user-facing or developer-facing, the flow is understandable.

## Step 6: Close the Section

After targeted and affected verification pass and the self-check is clean:

1. Commit the section (when commits are part of the task).
2. Add the section checkpoint to `spec/current-work.md`.
3. Return to Step 3 for the next section.

If scope expanded during the section, re-run Step 1 and 2 before continuing.

## Step 7: Reconcile and Hand Off

When every section is done and all tests are green:

- If relevant files changed, invoke `memo` for anchor reconciliation so `spec/CHANGELOG.md` records the work under `Unreleased`. If the user declined Memo persistence, state the unrecorded note explicitly.
- If durable routing, architecture, shipped outcome, or checkpoint information was exposed, set `Promotion: pending` in `spec/current-work.md` and invoke `memo` for the triggered event.
- Close or clear `spec/current-work.md`.
- Run the Learn close check. If this task exposed a user correction, repeated failure, hidden constraint, operational convention, non-obvious gotcha, or explicit remember/forget request, invoke `learn`; otherwise include `Learn checked: no memory write needed` in the final response.

If the task includes versioning, packaging, deployment, or publication, read `references/ship.md` and run the release gate before calling the task complete.

## Stop Conditions

Stop immediately when:

- The goal is still unclear after minimal context recovery.
- The next change cannot be executed with current interfaces, dependencies, or permissions.
- Verification keeps failing and the root cause is unknown.
- The task expands beyond the original blast radius and needs re-scoping.
- A destructive action is next and the user has not confirmed it.

Do not improvise around these conditions.

## Completion Gate

Do not call the task complete until:

1. Every planned section is done with a checkpoint.
2. All required new tests and affected existing tests are green, or the no-new-test decision is justified with passing command-line verification.
3. The self-check passed for every section.
4. Memo reconciliation ran when relevant files changed.
5. `spec/current-work.md` is closed, cleared, or handed off.
6. Learn recall/write status is explicit through a `Memory ...` or `Learn ...` marker.
7. The ship gate ran and passed if this was a release task.
8. The next decision is handed back to the user with clear evidence.
