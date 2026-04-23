# Task Spec Contract

Use this contract when creating or updating `spec/docs/#NNN-{work-description}.md`.

## Responsibility

The combined spec-task file holds scoped context, chosen direction, and concrete execution plan for one bounded task. It is not a diary.

## Naming

- Spec docs use zero-padded ids: `#001`, `#002`, `#003`.
- Task files use `#NNN-{work-description}.md`.
- `work-description` is a lowercase hyphen-case task slug.
- Preserve the repo's existing stable pattern if it already differs.

## Required Shape

Use this structure:

```md
# [Work Title]

## Metadata

- Spec ID: [#NNN]
- Status: Draft | Approved | In Progress | Shipped
- Owner:
- Related TODOs:

## Background

## Goal

## Architecture Summary

## Expected Changes

## Constraints

## Relevant Files

---

# Execution Plan

**Goal:**
**Architecture:**
**Tech Stack:**
**Minimal Change Strategy:**

## Section 1: [Milestone state]

**Checkpoint:**

### Phase 1: [Independent worker-sized unit]

#### Task 1: [Concrete task name]

**Files:**
- Create:
- Modify:
- Test:
- Docs:

- [ ] **Step 1:**
```

The full starter template is `references/templates/task-spec.template.md`.

## Planning Hierarchy

Organize the execution plan with three levels:

1. **Section**
   A milestone checkpoint owned by the main thread. Use a section when several phases together move the project into a meaningful new state such as "project skeleton is ready for first review" or "main feature set is complete". A section is the right boundary for an intermediate review, mid-task commit, or documentation sync.
2. **Phase**
   One independent worker-sized unit inside a section. A phase may start after an earlier phase finishes, but it must not depend on that earlier phase's hidden or detailed context. Write each phase so one worker can execute it from the spec file itself, using only the stated files, constraints, and expected change.
3. **Task**
   The smallest indivisible planning unit. A task should already be concrete enough to execute directly. Tasks inside one phase may share local context and should follow the same concrete task-writing style as the project uses for execution plans.

Do not use sections as decorative grouping. Each section should correspond to a real state transition in the project. Do not use phases as loose buckets.

## Minimal Change Rule

Every combined spec-task file must start from the smallest coherent change that can satisfy the goal.

Apply these rules:

1. Prefer the smallest viable file set.
2. Prefer modifying existing focused files before introducing new files, modules, or layers.
3. Do not include unrelated refactors in the same task just because files are nearby.
4. If the full goal is too large for one bounded change, split it into later phases or TODO items.
5. Within each phase, tasks should be atomic enough that an agent can execute them without further decomposition.
6. If two work units do not need the same close context, they do not belong in the same phase.

## Write Rules

- Replace every bracketed slot before execution.
- A live plan must contain exact files, commands, code or logic descriptions, and expected outputs.
- Use spec-managed tests under `spec/test/` only when the task needs durable fixtures or verification assets.
- Do not store ordinary progress updates or full decision history here.
- Update status as the task moves from Draft to Approved, In Progress, and Shipped.

## Completion Check

- Goal, constraints, relevant files, and verification are explicit.
- Sections, phases, and tasks are meaningful.
- The smallest coherent change is visible.
- TODO links and evidence are current.
