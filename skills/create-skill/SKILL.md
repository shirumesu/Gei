---
name: create-skill
description: Use when creating, improving, reviewing, or evaluating agent Skills. Trigger when the user wants to turn a reusable workflow into a Skill, revise a Skill after feedback or new understanding, audit an existing Skill, or validate Skill quality and trigger behavior.
---

# Create Skill

Create, improve, and review Skills as lightweight, discoverable context.

## Standard

- Encode context the agent would not reliably infer: domain knowledge, product or team opinions, recurring failure modes, and task-specific tool use.
- Do not restate general model capabilities, host-enforced policy, tool schemas, or instructions already authoritative elsewhere.
- Prefer agent judgment over rigid procedure unless a real failure, safety boundary, or external contract requires one.
- Keep the entry file small. Load conditional detail through direct references; use scripts, tests, schemas, or tools for deterministic behavior.
- Treat deletion and consolidation as first-class improvements. More instruction is not inherently more reliable.
- Validate only the claims the Skill makes, at a depth proportionate to their risk.

## Route

Read one primary workflow. Read `references/testing.md` after an edit or when validation is the requested deliverable.

| User goal | Read |
| --- | --- |
| Create a new Skill from an idea, workflow, prior conversation, or source material | `references/create.md` |
| Improve, right-size, or review an existing Skill | `references/improve-review.md` |
| Validate a Skill's structure, trigger behavior, or real task behavior without changing it | `references/testing.md` |

## Minimum Acceptance

Before calling a Skill ready, confirm:

1. A Skill is the right interface for the recurring need.
2. Its description distinguishes when it should and should not load.
3. Every instruction earns its context cost and has one clear authority.
4. Conditional detail is deferred without fragmenting the normal path.
5. Every bundled resource has a discoverable route and one maintenance owner; renamed or removed behavior leaves no stale trigger, link, or duplicate authority.
6. Format validation passes, and any behavioral claim has matching evidence.
