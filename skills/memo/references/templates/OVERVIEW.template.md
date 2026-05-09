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
| Frontend | | |
| Backend | | |
| Package manager | | |
| Build command | | |
| Test command | | |
| Typecheck or lint command | | |

## Document Map

| Document | Use When |
|----------|----------|
| `spec/ARCHITECTURE.md` | You need system structure, module boundaries, flows, task entry routes, or impact paths. |
| `spec/current-work.md` | You need the active file-changing task intent and scope. |
| `spec/CHANGELOG.md` | You need recent closed work, releases, or checkpoints. |
| `spec/docs/` | You need explicit spec-backed plans, scopes, and execution context. |

## How To Start A Task

1. Read this file to understand the project.
2. Read `spec/ARCHITECTURE.md` to locate the affected structure and impact path.
3. Read `spec/current-work.md` when active or recent work may overlap the task.
4. Read `spec/CHANGELOG.md` only when recent closed work may affect the decision.
5. Read code only after the spec surface is insufficient or possibly stale.

## Authority And Staleness

- Source code, tests, configuration, build scripts, and Git history are the source of truth.
- Spec files are navigation and project state.
- If this file conflicts with code or `ARCHITECTURE.md`, verify against the repo and update the smallest stale spec surface.
