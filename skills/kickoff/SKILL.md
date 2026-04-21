---
name: kickoff
description: Use when starting any creative work. Design creativity and coding related tasks such as new project start, modification, feature addition. This skill helps to explore the needs of the user.
---

# Kickoff

## Overview

Kickoff owns the front of the loop: recover context, clarify intent, research the field, shrink scope, and produce a user-approved direction for `memo` to formalize.

**REQUIRED NEXT STEP:** Hand off to `memo` after the user approves the direction.

**Announce at start:** "I'm using the kickoff skill to shape the task before memo."

## Core Boundary

Kickoff is not an execution skill.

Stop after these conditions are true:

1. The problem is scoped to one bounded system.
2. The user has approved the design direction.
3. Deferred work is clearly identified.
4. `memo` has enough information to create or update `spec/`, including `spec/test/` and the current `spec/docs/#NNN-work.md`.

Do not write code, implementation tasks, execution checklists, or spec files inside Kickoff.

## Working Order

```text
Inspect project state
  -> recover durable context from spec/
  -> initialize spec/ with memo if missing
  -> check scope boundary
  -> clarify one blocking gap at a time
  -> research 5-10 comparable products or projects
  -> synthesize Layer 1 / Layer 2 / Layer 3
  -> present 2-3 approaches with tradeoffs
  -> cut scope aggressively
  -> get user approval
  -> hand off to memo
```

## Project-First Context Recovery

Start from the current repo, not from assumptions.

1. Inspect top-level files, active docs, and recent commits if they exist.
2. Treat `spec/` as the primary context channel when it exists.
3. Read code only far enough to validate claims or locate constraints.
4. If the repo is empty, say that clearly and design the minimum viable structure around the stated goal.

## Init Or Continue

Before design work, decide which branch applies:

- If `spec/` is missing, incomplete, or obviously stale, call `memo` to initialize or repair it first.
- If `spec/` exists, read at least:
  - `spec/ARCHITECTURE.md`
  - `spec/TODO.md`
  - relevant sections of `spec/MEMORY.md`
  - the latest relevant entries in `spec/CHANGELOG.md`
  - any related file in `spec/docs/`
  - any relevant test file in `spec/test/`

Prefer recovering context from those files over re-reading large parts of the codebase.

## Scope Gate

Kickoff handles one bounded problem at a time.

If the request mixes multiple independent systems, stop and decompose it before continuing. Examples:

- app architecture plus billing platform plus analytics warehouse
- new product definition plus migration plan plus org process redesign

Each bounded problem gets its own combined spec-task file and its own later execution plan inside that file.

## Clarification Rules

Use a one-question rhythm only when a missing answer blocks a defensible design decision.

Focus on:

- user goal
- constraints
- success criteria
- operating environment
- hard non-goals

Do not ask broad brainstorming questions when concrete tradeoffs are already visible from context.

## Research Standard

Research is mandatory when comparable products, stacks, or current practices matter.

1. Inspect 5-10 comparable products or projects.
2. Prefer primary sources:
   - official product docs
   - source repositories
   - engineering writeups
   - technical architecture notes
3. Separate observation from inference.
4. Use fresh sources when the ecosystem may have changed.

Write the synthesis in three layers:

- **Layer 1: Conventional pattern**
  What the stable, common solution usually looks like.
- **Layer 2: Current trend**
  What modern teams are adopting now, and why.
- **Layer 3: First-principles opportunity**
  Whether this project has a strong reason to break convention for its own users.

Layer 3 is the only place where a novel direction is justified. Do not invent novelty for its own sake.

## Option Framing

Present 2-3 approaches.

For each approach, state:

- what it optimizes for
- what it makes harder
- what it defers
- whether it matches the current repo reality

Recommend one approach and name the main reason.

## Ruthless YAGNI

Apply two rules together:

- **Boil the lake in analysis.** Research broadly enough to see the real decision space.
- **Stay narrow in scope.** Ship only what the current task needs.

Anything useful but non-essential becomes a TODO item. Do not hide future work inside vague prose.

## Approval Gate

Before handoff, present the design direction and get explicit approval from the user.

If the user rejects or revises the direction, refine the direction instead of leaking into plan work.

## Self-Review

Before handing off:

1. Check that the direction describes one bounded problem.
2. Check that research covers Layer 1, Layer 2, and Layer 3.
3. Check that the chosen direction and deferred work do not contradict each other.
4. Check that `memo` has enough detail to create or update `spec/`, `spec/test/`, and `spec/docs/#NNN-work.md`.
5. Check that the user approved the direction.

## Handoff

After the approved direction is clear, hand off to `memo`.

If the project is new, `memo` should initialize `spec/`, create `spec/test/`, and create `spec/docs/#001-work.md`.

If the project already has `spec/`, `memo` should update the existing system, keep `spec/test/` aligned, and create or update the current `spec/docs/#NNN-work.md`.

Do not skip directly from a rough idea to execution.
