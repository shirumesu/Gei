---
name: work
description: Use when the user wants coding execution such as implementation, bug fixing, tests, builds, refactors, releases, or other code-changing work. Handles all task sizes in a single unified flow — reads spec when present, writes failing tests first, executes in sections, and routes to ship when releasing.
---

# Work

Work is the execution skill for all coding tasks. 

`memo` owns the `spec/` document system. Work reads `spec/` as context but does not write or maintain spec documents directly.
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

## Step 3: Write Tests First (Iron Law)

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

No exceptions. If code appears before the test, delete it and restart from RED.

Before writing tests, read `references/testcraft.md` to design a meaningful test surface — contract recovery, surface map, and red verification. Do not write tests that only confirm current behavior.

Place test files in `spec/tests/` unless the repo already has an established test directory. When a convention exists, follow it.

Run the tests and confirm they **fail for the expected reason** before writing any production code.

## Step 4: Implement

Write the smallest coherent change set that satisfies the current section.

- Do not widen scope because adjacent cleanup looks tempting.
- Do not add `TODO`, `TBD`, placeholder branches, or dead code.
- Do not rewrite durable docs unless the task assigns them.

Run the failing tests after each meaningful unit of code. Once the targeted tests pass, run the broader affected verification: related tests, lint, build, typecheck — based on the real blast radius.

## Step 5: Self-Check

Before closing a section, read your own changes and confirm:

- The change solves the requested problem without drift.
- The implementation is minimal and free of obvious waste.
- No new `TODO`, placeholder logic, or half-implemented paths were left in.
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
2. All new tests and affected existing tests are green.
3. The self-check passed for every section.
4. Memo reconciliation ran when relevant files changed.
5. `spec/current-work.md` is closed, cleared, or handed off.
6. The ship gate ran and passed if this was a release task.
7. The next decision is handed back to the user with clear evidence.

---

## Sub-Agent Usage

Use sub-agents to parallelize research, protect the main context window, or get an independent read. Do not use them for tasks where a direct tool is sufficient.

### When to use a sub-agent

| Situation | Action |
|---|---|
| Broad codebase exploration taking more than 3 queries | Spawn a research sub-agent |
| Multiple independent research or search tasks | Launch them in parallel in one call |
| Large result sets that would flood the main context | Use a sub-agent to isolate the output |
| Independent second opinion on code or a diff | Use a sub-agent (it has no access to your analysis) |
| Long-running background research | Launch with background mode |

### When not to use a sub-agent

- The target is already known: use `Read`, `Grep`, or `Glob` directly.
- The task is simple enough to finish in 1-3 direct tool calls.
- You are already delegating the same research to a sub-agent — do not duplicate it yourself.
- The task is implementation: **never delegate understanding or coding to a sub-agent.** Gather information through a sub-agent, then implement it yourself based on your own synthesis of the findings.

### How to brief a sub-agent

Write the prompt like a briefing for a smart colleague who just walked into the room and has no context from this conversation. Include:

- What you are trying to find or understand, and why it matters for the current task.
- What you already know and what you have already tried.
- What a useful answer looks like.

Vague prompts produce shallow work. Do not write "research X and tell me what to do" — that delegates understanding.

### After receiving sub-agent results

- The sub-agent's output is returned to you, not to the user. Synthesize it yourself before acting or reporting.
- Verify: an agent's summary describes what it intended to do, not necessarily what it did.
- Do not perform the same searches the sub-agent already ran.

### Worker sub-agents

If the user explicitly requests or approves delegating an implementation phase to a worker sub-agent, read `references/worker.md` for the dispatch protocol. Do not use workers by default or without explicit approval.
