# Architecture Contract

Use this contract when creating or updating `spec/ARCHITECTURE.md`.

## Responsibility

`ARCHITECTURE.md` is the stable system structure map and maintenance routing manual. It records modules, responsibilities, data flow, routing rules, diagrams, integration boundaries, commands, task-entry routes, and likely impact paths.

A future agent should be able to understand what the project does, where to start for a class of change, which files to inspect, which downstream areas may be affected, and what must be verified before reading much code.

Use `spec/OVERVIEW.md` for cold-start project context, project purpose, core capabilities, document map, and technology baseline. Keep `ARCHITECTURE.md` focused on how the system is organized and how changes move through it.

## Required Content

Keep it focused on:

- system purpose
- top-level folders and modules
- critical flows
- interfaces and invariants
- command or document routing rules
- state and data movement
- external integrations
- task-entry routes by feature or change type
- impact paths between modules, files, commands, and tests
- known structural risks
- stale diagram audit notes

When a flow is complex, include ASCII diagrams. Diagrams are part of the contract.

Architecture content may be long when the project is large. Do not force brevity at the cost of file routes, impact analysis, or task boundaries. Keep long sections scannable with stable headings, tables, diagrams, and exact paths.

Do not use `ARCHITECTURE.md` for long project introductions, full capability inventories, full dependency lists, or task history. If that context is needed before understanding the structure, keep the concise entry point in `OVERVIEW.md`.

## Template Shape

Use this shape when creating the file:

```md
# Architecture

## Metadata

- Project:
- Source of truth:

## System Purpose

Briefly state the purpose only as needed to understand the structure. Put cold-start project context in `spec/OVERVIEW.md`.

## Top-Level Map

## Runtime Flow

## Core Modules

## Interfaces And Invariants

## State And Data Movement

## External Integrations

## Command And Document Routing

## Task Entry Map

## Impact Map

## Known Risks

## Stale Diagram Audit
```

The full starter template is `references/templates/ARCHITECTURE.template.md`.

## Write Rules

- Write stable architecture facts, not task diary notes.
- Name exact folders, modules, commands, routes, interfaces, and data boundaries.
- For common task types, state the first files to read, the related tests or commands, and the likely downstream impact.
- Record cross-module impact paths when changing one file or feature can affect another part of the system.
- Preserve existing diagrams unless the structure changed.
- If code changes invalidate a diagram, update the diagram in the same maintenance pass.
- Do not record implementation details that are obvious from one local file and unlikely to guide future tasks, but do record local details when they define a boundary, invariant, entry point, or impact path.

## Completion Check

- A future agent can find where to start reading.
- A future agent can route common feature, bug, release, and verification tasks to the right files.
- Important cross-file impact paths are visible.
- Important commands and document routes are visible.
- Changed boundaries or flows are reflected.
- Stale diagrams were checked when relevant.
