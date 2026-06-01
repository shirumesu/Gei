# Overview Contract

Use this contract when creating or updating `spec/OVERVIEW.md`.

## Responsibility

`OVERVIEW.md` is the cold-start entry point for a zero-context AI maintainer. When the SessionStart hook detects it, the file is injected verbatim into session context, so it must stay lean and act as an index rather than a full project manual.

It explains what the project is, why it exists, what its main work surfaces are, which technology baseline matters for maintenance, and which spec files to read next. It should let a future agent choose the next context surface without reading much code.

## Required Content

Keep it focused on:

- project summary
- project purpose
- primary users, actors, or calling systems
- core capabilities or workflows
- important concepts needed before reading architecture
- technology baseline
- document map
- task start route
- authority and staleness notes

`OVERVIEW.md` may mention major frameworks, runtimes, package managers, and essential commands when they help a maintainer orient quickly. Do not turn it into a full dependency list, architecture map, command matrix, task plan, changelog, or risk ledger.

## Template Shape

Use this shape when creating the file:

```md
# Overview

## Metadata

- Project:
- Source of truth:

## Project Summary

## Purpose

## Primary Users Or Actors

## Core Capabilities

## Important Concepts

## Technology Baseline

## Document Map

## How To Start A Task

## Authority And Staleness
```

The full starter template is `references/templates/OVERVIEW.template.md`.

## Write Rules

- Write for a capable AI maintainer with no current project context.
- Treat every line as session-start context cost. Target roughly 600-1000 tokens when practical and keep the file comfortably below 150 lines unless the project genuinely needs more.
- If the file exceeds 250 lines, keep it valid but treat that as a compression warning that should be surfaced to the user during the task or final handoff.
- State facts that explain the project before its structure.
- Point to root `ARCHITECTURE.md` for durable structure, routing, data flow, module boundaries, cross-file impact context, and any architecture fragments it routes to. Do not link directly to architecture fragments unless the project has no root architecture index.
- Describe `current-work.md` as recent task memory and lifecycle evidence for active, paused, debug, release, reconciliation, or file-changing work. Do not make it a generic cold-start context file.
- Link to `CHANGELOG.md` and relevant `spec/docs/` files by role, not by copying their contents.
- Keep `Technology Baseline` to stable maintenance facts: runtime, frameworks, package manager, build/test/typecheck commands, and platform assumptions.
- Do not record long provider lists, full dependency inventories, implementation details, full verification matrices, history, durable risk ledgers, or task diary notes.
- State confidence order when it matters: repository code/config/tests first, `current-work.md` second as recent task memory, durable spec files third because they may lag until promotion.

## Completion Check

- A zero-context AI maintainer can say what the project does.
- A zero-context AI maintainer can choose the next spec file to read.
- The technology baseline is visible without duplicating package manifests.
- Structural details remain in `ARCHITECTURE.md`.
- Current-work is described without duplicating the lifecycle contract.
- Task-specific details remain in `spec/docs/`.
