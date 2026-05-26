---
name: work
description: Use when the user wants coding execution such as implementation, bug fixing, tests, builds, refactors, reviews, releases, or other code-changing work; route the task into the correct execution flow while keeping only universal guardrails at the entry point.
---

# Work

## Overview

Work is the routing entry point for coding tasks.

It decides whether the task should use the lightweight main-thread flow or the spec-aware heavy execution flow. Do not treat this file as the main execution guide.

`memo` owns the `spec/` document system. Work may use `spec/` as execution context, but it must not duplicate Memo's document contracts, lifecycle events, or maintenance rules.

`using-gei` starts lifecycle state. Work enforces the file-changing checkpoints through `spec/current-work.md`.

## Always-On Rules

- Do not guess through unclear instructions, missing interfaces, or missing dependencies. Stop and surface the blocker.
- Before any destructive action such as force push, production mutation, irreversible migration, deploy, publish, or delete-heavy command, get a second human confirmation.
- Do not claim `done`, `fixed`, or `verified` without command evidence in the current conversation.
- If the user asks to inspect, rely on, update, reconcile, or commit against `spec/` or project documentation state, invoke `memo` before continuing Work.
- If the task changes files, reconcile `spec/current-work.md` through `memo` before closing so `spec/CHANGELOG.md` records the work under `Unreleased`.
- If the task exposes durable routing, command, top-level structure, architecture, shipped-outcome, or checkpoint information, mark `Durable record needed: yes` in `spec/current-work.md` when an anchor exists, then invoke `memo` only for the triggered event. Do not update spec documents from Work-specific rules.
- Before staging or committing, check whether `spec/` files are staged or would be added. Exclude them from product commits unless the user explicitly approved tracking `spec/` in the product repository.

## Current Work Checkpoints

Before the first file edit, Work **MUST** check `spec/current-work.md`:
- If it matches the current task, continue.
- If it describes old or unrelated work, overwrite it.
- If it is missing and the task may write files, create a micro-anchor (shape defined by `using-gei`).

Re-check the anchor after scope expands, before verification, before final response, and before commit / release / handoff.

At final response: close or clear the anchor. If relevant files changed, invoke `memo` for anchor reconciliation first (see Always-On Rules). If the next task is unrelated, overwrite the anchor before starting.

## Routing

Use task weight first, then spec availability.

Route to `references/work.md` only when both of the following are true:

1. The current workspace contains a usable `spec/` directory with an accepted active task or plan.
2. At least one heavy-work condition is true:
   - the user explicitly asked to follow an existing task or plan
   - the user already provided a complete task or plan
   - your immediately previous step already wrote a complete execution plan for this task
   - the task needs multi-phase execution, delegated workers, or a fuller review cycle

If either requirement is false, follow `references/light.md`.

Lightweight tasks may use `references/light.md` even when `spec/` exists. Do not force a small patch, routine docs edit, or simple config change into the heavy flow just because the project has spec documents.

If no usable `spec/` exists, follow `references/light.md`. Do not initialize or create spec documents from Work; `memo` owns that decision when the user asks for durable project state.

If the task shape changes while you are working, stop and run this routing check again instead of drifting across modes.

## Handoff

- `references/light.md` is the default flow for everyday coding tasks that do not begin with a complete spec-task or plan.
- `references/work.md` is the spec-aware heavy flow for bounded tasks that already have the required planning context.
- If the selected mode reaches a release, versioning, packaging, deployment, or publication step, also use `references/ship.md`.

After selecting a route, continue in the selected reference file rather than expanding this file back into an execution guide.
