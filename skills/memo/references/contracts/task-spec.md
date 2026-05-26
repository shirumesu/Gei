# Task Spec Contract

Use this contract when creating or updating `spec/docs/#NNN-{work-description}.md`.

## Responsibility

The combined spec-task file holds scoped context, chosen direction, and a concrete execution plan for one bounded task. It is not a diary, backlog, changelog, or general-purpose notes ledger.

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

## Background

## Goal

## Architecture Summary

## Expected Changes

## Constraints

## Relevant Files

---

# Execution Plan

## Plan Contract

- Execution mode:
- Checkpoint unit:
- Phase/Task:
- Approval gates:

## File Structure Map

- `path/to/file`
  Responsibility:
  Interfaces:
  Depends on:
  Used by:

## Section 1: [Reviewable state]

**Checkpoint:**

### Implementation Details

#### [Implementation unit]

Files:
- `path/to/file`

Interfaces:
- `symbolOrContract(input): output`

Implementation note:
```text
[Use concrete code, type shape, mapping, branch logic, command, or pseudocode only when it prevents ambiguity.]
```

Failure behavior:
- [Specific error, fallback, unsupported state, rollback path, or `none`.]

### Verification

- `[exact command or manual check]`
  Expected: [behavior-specific result]

### Spec Coverage Check

- [Goal, constraint, gate, or risk]: covered by [implementation, verification, gate, or out-of-scope note].

## Deferred Work

- [Approval-dependent, optional, or future work item]: [condition required before it becomes executable].
```

The full starter template is `references/templates/task-spec.template.md`.

## Planning Hierarchy

`Section` is the only required execution-plan level.

A section is a checkpoint owned by the main thread. Each section must move the current bounded task into a reviewable state that can be inspected before continuing, such as "provider is selectable", "English audio plays in app", or "default migration is approved and applied".

`Phase` and `Task` are optional organization tools. Use them only when they reduce ambiguity inside a section:

- Use a `Phase` when a section has a meaningful internal checkpoint.
- Use a `Task` when a phase or section has several implementation units that are easier to scan separately.
- Do not create `Phase`, `Task`, or `Step` wrappers just to satisfy a template.
- If a phase or task only repeats the section goal, delete it and write the implementation details directly under the section.

## Minimal Change Rule

Every combined spec-task file must start from the smallest coherent change that can satisfy the goal.

Apply these rules:

1. Prefer the smallest viable file set.
2. Prefer modifying existing focused files before introducing new files, modules, or layers.
3. Do not include unrelated refactors in the same task just because files are nearby.
4. If the full goal is too large for one bounded change, split it into separate approved task specs or section checkpoints.
5. Each section must produce a reviewable state. Do not split work below section level unless the split improves clarity.
6. If two work units do not share close context or a checkpoint, they do not belong in the same section.

## Live Plan Standard

A Draft task spec may describe direction, constraints, and open implementation choices. Before a task spec becomes Approved or In Progress, its `Execution Plan` must be implementation-grade: an agent with no context beyond this file should be able to execute each section without redesigning the work.

A live execution plan must include:

- **Plan Contract:** execution mode, checkpoint unit, optional phase/task policy, and approval gates.
- **File Structure Map:** every file that will be created or materially modified, with responsibility, interfaces, dependencies, and consumers.
- **Section Checkpoints:** reviewable project states, not decorative headings.
- **Implementation Details:** enough file-boundary, interface, behavior, and sequencing detail to execute without redesigning the work.
- **Failure Behavior:** exact errors, fallbacks, unsupported states, rollback paths, or `none` where no failure behavior is relevant.
- **Verification:** exact commands or manual checks with behavior-specific expected results.
- **Spec Coverage Check:** each important goal, constraint, gate, or risk is covered by implementation, verification, an approval gate, or an out-of-scope note.
- **Deferred Work:** approval-dependent, optional, or future work that is not part of the current bounded execution sections.

Execution sections must belong to the current bounded task. Do not write deferred, optional, approval-dependent, or future expansion work as ordinary sections unless the current task is explicitly to execute that work. Put that material under `Deferred Work` with the condition required before it becomes executable.

Use code blocks, type shapes, mappings, branch logic, command snippets, or pseudocode when they prevent ambiguity in a complex or high-risk change. They are especially useful for new public interfaces, cross-file contracts, data migrations, generated shapes, third-party API boundaries, security-sensitive behavior, or rollback paths.

Do not require code blocks for routine or locally obvious edits when exact files, interfaces, behavior, failure handling, and verification already make the change executable. If pseudocode is used because an API, generated shape, or runtime behavior is uncertain, name the uncertainty next to the pseudocode.

Verification expected results must say what behavior was proven. Do not write low-signal expectations such as `exit code 0`, `PASS`, or `command succeeds` unless that exact signal is the contract being tested.

## Plan Failure Patterns

Do not leave these patterns in a live plan:

- `TBD`, `TODO`, `later`, `if needed`, `as appropriate`, or other unresolved placeholders.
- `handle edge cases` without naming the edge cases and expected behavior.
- `write tests` without test names, fixtures, assertions, or a specific manual substitute.
- `implement support` without interfaces, input/output behavior, implementation details, and verification.
- `similar to previous`; repeat the required details because sections may be read out of order.
- Optional architecture decisions hidden in execution work, such as `consider creating` or `choose whether to split`.
- Steps that say what to do without enough file-boundary, interface, behavior, command, code-shape, or expected-result detail to do it.
- Generic verification expectations such as `exit code 0` when a behavior-specific result is available.
- Deferred, optional, approval-dependent, or future expansion work written as ordinary execution sections.

## Write Rules

- Replace every bracketed slot before execution.
- Keep the spec context and execution plan aligned; if execution changes the selected direction, constraints, or gates, update the smallest affected part of the spec context.
- Put file-boundary decisions in the `File Structure Map` before writing implementation details.
- Prefer dense implementation details over protocol-heavy checklists.
- Include detailed examples, pseudocode, or small code blocks when they prevent implementation ambiguity; omit them when they merely restate a straightforward local edit.
- For complex work, include impacted files, call paths, interfaces, rollback notes, edge cases, and verification commands.
- Use spec-managed tests under `spec/test/` only when the task needs durable fixtures or verification assets.
- Do not store ordinary progress updates or full decision history here.
- Update status as the task moves from Draft to Approved, In Progress, and Shipped.

## Completion Check

- Goal, constraints, relevant files, interfaces, failure behavior, and verification are explicit.
- The file structure map explains file responsibilities and boundaries.
- Each section has a reviewable checkpoint.
- Phase and task levels are omitted unless they reduce ambiguity.
- Code-changing implementation units include concrete code, type shapes, mappings, branch logic, or pseudocode only where needed to remove implementation ambiguity.
- Verification expectations are behavior-specific.
- Spec coverage checks connect important goals, constraints, gates, and risks to implementation, verification, deferral, or out-of-scope notes.
- Deferred, optional, approval-dependent, and future expansion work is separated from current execution sections.
- The smallest coherent change is visible.
- Live plans contain no plan failure patterns.
- Evidence and status are current.
