# Overview Contract

Use this contract when creating or updating `spec/OVERVIEW.md`.

## Responsibility

`OVERVIEW.md` is the cold-start entry point for a zero-context AI maintainer. It explains what the project is, why it exists, what its main work surfaces are, which technology baseline matters for maintenance, and which spec files to read next.

It should let a future agent build enough project context to choose the next document without reading much code.

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

`OVERVIEW.md` may mention major frameworks, runtimes, package managers, and verification commands when they help a maintainer orient quickly. Do not turn it into a full dependency list, architecture map, task plan, changelog, or risk ledger.

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
- Keep the file short enough to read before `ARCHITECTURE.md`.
- State facts that explain the project before its structure.
- Link to `ARCHITECTURE.md` for modules, flows, interfaces, and impact paths.
- Link to `current-work.md`, `CHANGELOG.md`, and relevant `spec/docs/` files by role, not by copying their contents.
- Keep `Technology Baseline` to stable maintenance facts: runtime, frameworks, package manager, build/test/typecheck commands, and platform assumptions.
- Do not record long provider lists, full dependency inventories, implementation details, or task diary notes.

## Completion Check

- A zero-context AI maintainer can say what the project does.
- A zero-context AI maintainer can choose the next spec file to read.
- The technology baseline is visible without duplicating package manifests.
- Structural details remain in `ARCHITECTURE.md`.
- Task-specific details remain in `spec/docs/`.
