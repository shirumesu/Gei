---
name: create-skill
description: Use when creating, improving, reviewing, or evaluating agent Skills. Trigger when the user wants to turn a reusable workflow into a Skill, revise a Skill after feedback or new understanding, audit an existing Skill, or validate Skill quality and trigger behavior.
---

# Create Skill

Create, improve, and review Skills as reusable agent workflows, not long prompts.

## Core Rules

- Treat a Skill as a reusable, triggerable, maintainable workflow.
- Keep `SKILL.md` focused on entry routing, principles, core workflow, and essential constraints.
- Move conditional, variant-specific, or lookup-style material into `references/` when it should be loaded only for some tasks. Do not split core instructions only because they are somewhat long.
- Add scripts only for deterministic, repeated, or error-prone checks.
- Define realistic use cases before writing broad instructions.
- Apply review standards while creating the Skill; do not wait until a separate review step to catch prompt pileups, vague triggers, missing examples, or unverified behavior.
- Verify the Skill at a level that matches its risk and complexity.

## Route

Choose one primary route, then read only the referenced file.

| User goal | Read |
| --- | --- |
| Create a new Skill from an idea, workflow, prior conversation, or source material | `references/create.md` |
| Improve an existing Skill, incorporate user feedback or new material, or review a Skill for quality | `references/improve-review.md` |
| Validate a Skill's structure, trigger behavior, or real task behavior | `references/testing.md` |

If the request combines creation and review, start with `references/create.md`; creation must include the relevant review checks before handoff.

## Minimum Acceptance

Before calling a Skill ready, confirm:

1. The Skill has concrete use cases or a clear source workflow.
2. The description explains both what it does and when to use it.
3. The body is not a long prompt or broad advice dump.
4. The file structure follows progressive disclosure.
5. The result has been validated with `scripts/quick_validate.py` and at least one behavior check appropriate to the task.
