---
name: work
description: Use when the user wants coding execution such as implementation, bug fixing, tests, builds, refactors, releases, or other code-changing work. Handles all task sizes in a single unified flow — reads spec when present, chooses meaningful verification, uses fast-path or formal sections by risk, and routes to ship when releasing.
---

# Work

Work is the execution skill for all coding tasks. 

`memo` owns the `spec/` document system, including project memory under `spec/MEMORY.md` and `spec/memory/`. Work reads `spec/` as context but does not write or maintain spec documents directly.
Work applies relevant memory before planning and leaves durable memory writes to Memo's memory event.
Durable changed work is recorded in `spec/CHANGELOG.md` `## Unreleased`, not in a separate anchor file. Work may append one typed entry there at close; Memo owns releases, versioning, and compaction. There is no pre-edit `current-work` anchor.

## Always-On Rules

- Do not guess through unclear instructions, missing interfaces, or missing dependencies. Stop and surface the blocker.
- Before any destructive action — force push, production mutation, irreversible migration, deploy, publish, or delete-heavy command — get explicit human confirmation.
- Do not claim `done`, `fixed`, or `verified` without command evidence in the current conversation.
- If the task requires reading or updating durable `spec/` documents, invoke `memo` before continuing Work.
- Before staging or committing, confirm that `spec/` files are not staged unless the user explicitly approved tracking them.

## Step 0: Recover Context

### Check for spec

If `spec/` exists in the current workspace, read the relevant spec documents before doing anything else. Use `memo` to determine read order. Do not propose a plan that contradicts existing architecture or active tasks.

When context sources disagree, trust repository code/config/tests/Git history first, `spec/CHANGELOG.md` `## Unreleased` second for recent task state, and durable spec files third because they may lag until Memo promotion.

If `spec/MEMORY.md` exists, scan its injected index before feasibility planning. Read linked memory entries only when their `Read when ...` trigger matches the task. Apply matching entries internally, and mention memory to the user only when it changes the decision, conflicts with higher-authority context, writes memory, or the user asks.

If `spec/` does not exist, do not create it. Proceed without it.

### Recover memory and plan recording

There is no pre-edit anchor. Start file-changing work directly and record it at the close (Step 7).

Re-check memory recall after scope expands into new files, commands, errors, or workflows.

For heavy work that spans sessions or needs a durable plan, use a `spec/docs/#NNN` task spec through `memo` instead of an ad hoc buffer.

## Step 1: Check Feasibility

Confirm what the task is changing, what it might break, and what a successful result looks like. If the task is underspecified after a small context read, ask one precise question. Do not start coding with an unclear goal.

Identify the blast radius: which files, modules, and behaviors are affected.

## Step 2: Plan The Work

Choose the smallest planning structure that still protects recovery and verification.

**If a spec plan file exists** (e.g. `spec/docs/#NNN-task-name.md` with explicit phases or sections): use those sections directly. Do not invent new ones.

**If no spec plan exists**:

- Use the fast path for a compact, low-risk task that can be completed and verified in one pass. Do not create formal sections or persistent checkpoints just to satisfy process.
- Use formal sections when the task spans multiple coherent changes, touches several modules, introduces user-visible behavior, needs new tests, or has release/commit/handoff risk.
- When formal work spans sessions or needs a durable plan, record sections in a `spec/docs/#NNN` task spec through `memo`; otherwise sections are in-conversation execution structure only.

For formal sections, each section ends with:
1. Targeted verification passing
2. A commit (when commits are part of the task)

## Step 3: Choose Verification

Before implementation, decide the smallest verification surface that can prove the work. Prefer command-line verification that exercises real behavior through the most stable public surface available.

**Write or update a test** when the change introduces or fixes meaningful behavior that could regress silently and the repository has a stable test surface:
- New features or user-visible behavior
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
- Temporary, short-lived, one-off, or operator-only work that can be verified more directly with shell/tool output in the current turn
- Changes where command-line verification is stronger than a new test (build output, CLI smoke test, schema validation, direct file inspection, script validation)

Do not write a test just to satisfy process. If no new test is warranted, use the strongest practical command-line or tool verification once and state the reason briefly when reporting results.

When tests are required, read `references/testcraft.md` before writing them. Design tests around observable behavior and the full behavior chain. For example, a configuration change should prove that the setting can be enabled and disabled, persists through the real config path, and changes the consuming behavior; it should not merely prove that a function, file, schema field, or import exists.

Low-value tests are forbidden as the primary verification for a section: file or folder existence, function-name checks, source-code regex checks, import-presence checks, mock-only assertions, "does not throw" assertions, and tests that only confirm the implementation shape. Use these only as temporary migration checks when no better command-line verification exists, and label that limitation.

When a new behavior test is warranted and can be written before implementation, run it first and confirm it fails for the expected reason. If the best verification can only be run after implementation, state why, then run it as soon as the behavior is reachable. Do not force test-first for documentation, metadata, scaffolding, or changes whose best proof is an existing command.

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

## Step 6: Close the Section Or Fast Path

After targeted and affected verification pass and the self-check is clean:

1. Commit the section (when commits are part of the task).
2. For spec-backed work, record the section outcome in its `spec/docs/#NNN` task spec when it captures a decision, diagnosis, deviation, or recovery fact.
3. Return to Step 3 for the next section.

If scope expanded during the section, re-run Step 1 and 2 before continuing.

## Step 7: Reconcile and Hand Off

When every section or fast-path task is done and verification is green:

- If the work is changelog-worthy (durable behavior, release, rollback, architecture, public-doc, workflow, or future-agent value), append one typed entry under `spec/CHANGELOG.md` `## Unreleased` following `memo/references/contracts/changelog.md`. Trivial, non-durable, or read-only work records nothing.
- If durable routing, architecture, overview, or shipped-outcome information was exposed, invoke `memo` for the triggered event (architecture change, overview, or ship) to update the durable spec surface.
- Run the Memo memory close check from `skills/memo/references/events/memory.md` in the same final-response flow. This is part of completing the task lifecycle, not optional cleanup. If this task exposed a user correction, repeated failure, hidden constraint, operational convention, non-obvious gotcha, or explicit remember/forget request, invoke Memo's memory write gate. Omit no-op memory status from the user-facing final response.

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

1. Every planned formal section is done, or the fast-path work is complete.
2. All required new tests and affected existing tests are green, or the no-new-test decision is justified with passing command-line verification.
3. The self-check passed for every section or fast-path task.
4. Changelog-worthy work has one typed entry under `spec/CHANGELOG.md` `## Unreleased`; non-durable or read-only work correctly records nothing.
5. Durable architecture, overview, or shipped-outcome changes were handed to `memo` for the triggered event.
6. Memory recall/write was checked; user-visible memory status appears only for applied constraints, conflicts, writes, or explicit memory questions.
7. The ship gate ran and passed if this was a release task.
8. The next decision is handed back to the user with clear evidence.
