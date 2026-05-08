# Task Spec Contract

Use this contract when creating or updating `spec/docs/#NNN-{work-description}.md`.

## Responsibility

The combined spec-task file holds scoped context, chosen direction, and concrete execution plan for one bounded task. It is not a diary.

The file may be long when a future agent needs detailed instructions to execute correctly. Prefer enough detail to remove guesswork over artificial brevity. Long task specs must stay structured, searchable, and executable.

## Naming

Follow the repo's existing stable pattern. Otherwise use zero-padded spec ids, `#NNN-{work-description}.md`, and lowercase hyphen-case slugs.

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
   A milestone checkpoint owned by the main thread. Use it when several phases move the project into a meaningful reviewable state such as "project skeleton is ready for first review" or "main feature set is complete".
2. **Phase**
   One independent worker-sized unit inside a section. It may depend on stated results from earlier phases, but not on hidden context. Write it so one worker can execute from the spec file itself.
3. **Task**
   The smallest indivisible planning unit. A task should be concrete enough to execute directly. Tasks inside one phase may share local context.

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
- Include detailed examples, pseudocode, or small code blocks when they prevent implementation ambiguity.
- For complex work, include impacted files, call paths, interfaces, rollback notes, edge cases, and verification commands.
- Use spec-managed tests under `spec/test/` only when the task needs durable fixtures or verification assets.
- Do not store ordinary progress updates or full decision history here.
- Update status as the task moves from Draft to Approved, In Progress, and Shipped.

## Completion Check

- Goal, constraints, relevant files, and verification are explicit.
- Sections, phases, and tasks are meaningful.
- The smallest coherent change is visible.
- TODO links and evidence are current.
