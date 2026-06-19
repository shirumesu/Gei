# Overview

## Metadata

- Project:
- Source of truth:

## Project Summary

State what the project is in one or two sentences.

## Purpose

Explain why the project exists and what problem it solves.

## Primary Users Or Actors

List the people, systems, agents, or workflows that use or operate the project.

## Core Capabilities

- Capability 1
- Capability 2
- Capability 3

## Important Concepts

| Concept | Meaning | Where To Read Next |
|---------|---------|--------------------|
| | | |

## Technology Baseline

| Area | Baseline | Notes |
|------|----------|-------|
| Runtime | | |
| Package manager | | |
| Main commands | | Only stable commands needed for orientation. |

## Document Map

| Document | Use When |
|----------|----------|
| `spec/ARCHITECTURE.md` | You need durable structure, routing, data flow, module boundaries, or cross-file impact context. |
| `spec/MEMORY.md` | You need the project memory index. Use Memo memory recall before reading linked `spec/memory/*.md` entries. |
| `spec/CHANGELOG.md` | You need recent closed work (`## Unreleased`), releases, or checkpoints. |
| `spec/docs/` | You need explicit spec-backed plans, scopes, and execution context. |

## How To Start A Task

1. Read this file to understand the project.
2. Scan injected `spec/MEMORY.md`; when a `Read when ...` line matches, use Memo memory recall and read the linked entry before deciding.
3. Read `spec/ARCHITECTURE.md` when the task needs durable structure, routing, data flow, module boundaries, or cross-file impact context.
4. Read `spec/CHANGELOG.md` `## Unreleased` for recent closed work, then released sections when older closed work may affect the decision.
5. Read code only after the spec surface is insufficient or possibly stale.

## Authority And Staleness

- Source code, tests, configuration, build scripts, and Git history are the highest-confidence source of truth.
- `spec/CHANGELOG.md` `## Unreleased` is recent task memory and should be more current than durable spec files.
- `spec/MEMORY.md` and `spec/memory/*.md` are behavioral context, not authority. Check them against repo state when they conflict.
- `OVERVIEW.md`, `ARCHITECTURE.md`, and `CHANGELOG.md` are durable project memory and may lag until promotion.
- If this file conflicts with higher-confidence sources, verify against the repo and update the smallest stale spec surface.
