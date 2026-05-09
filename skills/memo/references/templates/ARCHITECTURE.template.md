# Architecture

## Metadata

- Project:
- Source of truth:

## System Purpose

Briefly state what the project does as needed to understand the structure. Put cold-start project context, core capabilities, and technology baseline in `spec/OVERVIEW.md`.

## Top-Level Map

```text
project-root/
  path-a/
  path-b/
  path-c/
```

Explain each top-level area's responsibility.

## Runtime Flow

Describe the main request or processing flow.

```text
Input
  -> validation
  -> orchestration
  -> persistence
  -> output
```

## Core Modules

| Module | Responsibility | Depends On | Notes |
|--------|----------------|------------|-------|
| `path/module` | | | |

## Interfaces And Invariants

- Invariant 1
- Invariant 2

## State And Data Movement

Describe the states that matter and how data moves across boundaries.

## External Integrations

| Integration | Purpose | Entry Point | Risk |
|-------------|---------|-------------|------|
| | | | |

## Command And Document Routing

- Start here for new tasks:
- Read this before touching production code:
- Commands that prove the system still works:

## Task Entry Map

| Task type | Start reading | Likely files | Verification | Notes |
|-----------|---------------|--------------|--------------|-------|
| | | | | |

## Impact Map

| If this changes | Also inspect | Reason | Verification |
|-----------------|--------------|--------|--------------|
| | | | |

## Known Risks

- Risk 1
- Risk 2

## Stale Diagram Audit

- Areas checked:
- Mismatches found:
