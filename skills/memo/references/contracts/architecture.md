# Architecture Contract

Use this contract when creating or updating `spec/ARCHITECTURE.md`.

## Responsibility

`ARCHITECTURE.md` is the stable system map. It records modules, responsibilities, data flow, routing rules, diagrams, integration boundaries, commands, and maintenance notes.

It must stay useful for context recovery. A future agent should be able to understand the system shape before reading much code.

## Required Content

Keep it focused on:

- system purpose
- top-level folders and modules
- critical flows
- interfaces and invariants
- command or document routing rules
- state and data movement
- external integrations
- known structural risks
- stale diagram audit notes

When a flow is complex, include ASCII diagrams. Diagrams are part of the contract.

## Template Shape

Use this shape when creating the file:

```md
# Architecture

## Metadata

- Project:
- Source of truth:

## System Purpose

## Top-Level Map

## Runtime Flow

## Core Modules

## Interfaces And Invariants

## State And Data Movement

## External Integrations

## Command And Document Routing

## Known Risks

## Stale Diagram Audit
```

The full starter template is `references/templates/ARCHITECTURE.template.md`.

## Write Rules

- Write stable architecture facts, not task diary notes.
- Name exact folders, modules, commands, routes, interfaces, and data boundaries.
- Preserve existing diagrams unless the structure changed.
- If code changes invalidate a diagram, update the diagram in the same maintenance pass.
- Do not record implementation details that are obvious from one local file and unlikely to guide future tasks.

## Completion Check

- A future agent can find where to start reading.
- Important commands and document routes are visible.
- Changed boundaries or flows are reflected.
- Stale diagrams were checked when relevant.
