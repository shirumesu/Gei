# [Work Title]

## Metadata

- Spec ID: [#NNN]
- Status: Draft | Approved | In Progress | Shipped
- Owner:

## Background

Describe the current situation and why this work exists. Include only facts, constraints, and evidence that affect the task.

## Goal

State the task outcome in one precise paragraph.

## Architecture Summary

State the intended approach in two or three precise paragraphs. Name the affected boundaries, data flow, module responsibilities, and any important decision already made.

## Expected Changes

- Change 1
- Change 2

## Constraints

- Constraint 1
- Constraint 2

## Relevant Files

- `path/to/file`
- `path/to/other-file`

---

# Execution Plan

## Plan Contract

- Execution mode: single-thread agent execution with section checkpoints.
- Checkpoint unit: Section.
- Phase/Task: optional; use only when they reduce ambiguity.
- Approval gates: [User decision or `none`.]

## File Structure Map

- `path/to/file.ts`
  Responsibility: [What this file owns.]
  Interfaces: [Exports, functions, config keys, commands, routes, or `none`.]
  Depends on: [Important local files, assets, libraries, or `none`.]
  Used by: [Callers, routes, UI surfaces, commands, or `none`.]

## Section 1: [Reviewable State]

**Checkpoint:** [Concrete project state that can be inspected before continuing.]

### Implementation Details

#### [Implementation Unit]

Files:
- `path/to/file.ts`

Interfaces:
- `functionName(input): output`
- `CONFIG_KEY`

Implementation note:
```ts
// Add concrete code, a type shape, mapping, branch logic, or focused pseudocode
// only when it prevents ambiguity. If this is pseudocode because an API is
// uncertain, name the uncertainty here.
```

Failure behavior:
- [Specific error, fallback, unsupported state, rollback path, or `none`.]

#### [Another Implementation Unit]

Files:
- `path/to/other-file.ts`

Interfaces:
- `anotherFunction(input): output`

Implementation note:
```ts
// Concrete code, a type shape, or focused pseudocode only when needed.
```

Failure behavior:
- [Specific behavior or `none`.]

### Verification

- `[exact command]`
  Expected: [Behavior-specific result. Do not write only `exit code 0`, `PASS`, or `command succeeds`.]

- Manual: [Exact app path, UI flow, file check, or observable runtime check.]
  Expected: [Observable result.]

### Spec Coverage Check

- [Goal or constraint]: covered by [implementation detail, verification item, approval gate, or out-of-scope note].
- [Risk or gate]: covered by [implementation detail, verification item, approval gate, or out-of-scope note].

## Deferred Work

- [Approval-dependent, optional, or future work item]: [condition required before it becomes executable].
