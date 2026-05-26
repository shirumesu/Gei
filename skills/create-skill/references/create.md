# Creating Skills

Use this workflow when building a new Skill or turning an existing conversation, workflow, or source document into a Skill.

## Goal

Produce the smallest Skill that reliably teaches another agent how to handle a repeatable class of tasks.

Do not write a Skill as a longer prompt. A good Skill gives the agent a trigger, a workflow, selective references, reusable tools when helpful, and a way to verify the result.

If the user asks only for an approach, design, or first-pass thinking, stop before file edits. Present the creation approach, identify the next blocking question if one exists, and wait for approval before implementation.

## 1. Confirm It Should Be A Skill

Create a Skill when the work is reusable and likely to recur.

Good candidates:

- The user repeatedly gives the same workflow instructions.
- The task has non-obvious procedural knowledge.
- The task benefits from fixed quality checks or examples.
- The agent often forgets a domain-specific rule, style, boundary, or tool sequence.
- Future agents should discover the workflow automatically from the user's phrasing.

Poor candidates:

- One-off instructions for a single task.
- Project-specific conventions better stored in local project instructions.
- Common knowledge the model already handles well.
- A mechanical rule that should be enforced by a script, linter, schema, or test instead of prose.

If the request is not a good Skill candidate, say so and recommend the simpler artifact.

## 2. Recover Use Cases

Before drafting, define 2-3 concrete use cases. Extract them from the conversation or supplied materials before asking the user.

For each use case, capture:

- **User phrasing:** what the user would actually say.
- **Trigger:** why this Skill should activate.
- **Workflow:** the major steps the agent should follow.
- **Result:** what output or state counts as success.
- **Failure mode:** what tends to go wrong without the Skill.

Do not overload the user with questions. Ask only when the missing answer would change scope, trigger behavior, or acceptance.

## 3. Choose The Skill Shape

Start with the smallest structure that can work.

Use only `SKILL.md` when:

- the instructions are needed in most or all invocations
- the workflow has one coherent path
- no conditional reference material, deterministic helper script, or reusable output asset is needed

Add `references/` when:

- the Skill covers multiple scenarios, domains, frameworks, formats, or options and only one branch is needed for a given request
- a detailed schema, API guide, policy, style guide, example set, or workflow branch is useful only in specific situations
- a conditional process would distract from the root route if loaded every time
- `SKILL.md` is approaching or exceeding roughly 500 lines after compression, and some content is not needed for every invocation

Do not move core principles or required workflow steps into `references/` solely to shorten the root file. If most of a long root file is required every time, compress the wording or consider whether the idea should be split into separate Skills.

Add `scripts/` when:

- a check is deterministic and repeated
- a task is easy for an agent to implement inconsistently
- validation can catch mistakes earlier than prose review

Add `assets/` only when the Skill needs reusable templates, source files, images, or other output resources.

Do not create empty directories or placeholder files to make the Skill look complete.

## 4. Write The Frontmatter

Every Skill needs:

```yaml
---
name: skill-name
description: Use when ...
---
```

Rules:

- Use lowercase kebab-case for `name`.
- Keep `name` short and action-oriented.
- Write `description` in third person.
- Include both what the Skill does and when to use it.
- Use realistic trigger contexts and user phrases.
- Keep the description under 1024 characters.
- Do not put the full workflow into the description.

The description is the trigger surface. It should help the agent decide whether to load the Skill, not replace the Skill body.

## 5. Write `SKILL.md`

Keep the root file as the entry guide.

Include:

- a short overview
- core principles that must always apply
- the main workflow or route map
- pointers to reference files with clear read conditions
- minimum acceptance or verification criteria

Avoid:

- long background explanations
- broad advice that is not tied to behavior
- repeated material already in references
- many near-identical examples
- hidden user-facing content that should stay in conversation
- speculative future branches

Use imperative, operational language. Explain why a rule matters when that helps future agents generalize, but do not pad obvious points.

## 6. Apply Review Standards While Drafting

Before considering the draft complete, inspect it as if reviewing someone else's Skill.

Check:

- Does it solve a recurring task rather than a one-off request?
- Would the description trigger for the real use cases?
- Would it stay quiet for adjacent tasks that need something else?
- Does the body teach a workflow instead of stacking prompt instructions?
- Are conditional branches, lookup material, and variant-specific details moved into `references/` instead of always loading?
- Are core rules kept in `SKILL.md` even when they take space?
- Are scripts limited to deterministic work?
- Are examples concrete enough to guide behavior?
- Does it state how success will be verified?
- Is each requirement tied to a real failure, risk, or user preference?

If any answer is weak, fix the draft before moving to validation.

## 7. Validate

Run the deterministic validator:

```bash
python scripts/quick_validate.py <path-to-skill>
```

Then perform at least one behavior check from `references/testing.md`.

For simple personal Skills, one or two realistic prompts may be enough. For discipline-enforcing, high-impact, or frequently used Skills, test with fresh agents and compare behavior with and without the Skill.

## 8. Handoff

When presenting the Skill, report:

- where the files were created or changed
- what use cases it covers
- what validation was run
- any remaining uncertainty or recommended next test

Do not call the Skill ready if formatting passed but behavior was not checked.
