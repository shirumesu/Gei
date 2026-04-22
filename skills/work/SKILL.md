---
name: work
description: Use before any coding tasks. It routes the task into the correct execution flow and keeps only universal guardrails at the entry point.
---

# Work

## Overview

Work is the routing entry point for coding tasks.

It decides whether the task should use the lightweight main-thread flow or the spec-driven execution flow. Do not treat this file as the main execution guide.

## Always-On Rules

- Do not guess through unclear instructions, missing interfaces, or missing dependencies. Stop and surface the blocker.
- Before any destructive action such as force push, production mutation, irreversible migration, deploy, publish, or delete-heavy command, get a second human confirmation.
- Do not claim `done`, `fixed`, or `verified` without command evidence in the current conversation.
- If the task changes durable routing, commands, top-level structure, or exposes a repeatable pitfall, invoke `memo` before closing the task.

## Routing

Route to `references/work.md` only when both of the following are true:

1. The current workspace contains a usable `spec/` directory.
2. At least one planning condition is true:
   - the user explicitly asked to follow an existing task or plan
   - the user already provided a complete task or plan
   - your immediately previous step already wrote a complete execution plan for this task

If either requirement is false, follow `references/light.md`.

If the task shape changes while you are working, stop and run this routing check again instead of drifting across modes.

## Handoff

- `references/light.md` is the default flow for everyday coding tasks that do not begin with a complete spec-task or plan.
- `references/work.md` is the spec-driven flow for bounded tasks that already have the required planning context.
- If the selected mode reaches a release, versioning, packaging, deployment, or publication step, also use `references/ship.md`.

After selecting a route, continue in the selected reference file rather than expanding this file back into an execution guide.
