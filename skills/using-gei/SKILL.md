---
name: using-gei
description: "Use when starting any conversation that may involve the Gei bundle. This is the router for the Gei skill series."
---

This is the entry router for Gei.

If there is a real chance the task belongs to one of the Gei skills, stop here first and decide the route before you answer, explore, or act.

## Instruction Priority

Gei routing helps decide **how** to work, but the user's instructions still decide **what** to do.

1. User instructions and repo rules come first.
2. This router decides which Gei skill applies.
3. The selected downstream skill defines the workflow after handoff.

If the user explicitly asks for `design`, `consider`, `memo`, or `work`, still check this router first, then route to the requested skill unless a higher-priority instruction makes that impossible.

## The Rule

Check `using-gei` before:

- replying
- asking clarifying questions
- exploring the repo
- reading large parts of the codebase
- running implementation commands

If none of the Gei skills applies, answer normally.  
If one does apply, route to it immediately.

## Decision Guide

| Skill | Route here when | Do not route here for | Typical follow-on |
| --- | --- | --- | --- |
| `design` | The deliverable is a visual artifact or design decision: web page, UI, prototype, PPT, document design, layout system, motion study, visual exploration | General coding, task scoping, or engineering memory maintenance | `work` if the approved design later needs implementation; `memo` if the design changes durable engineering context |
| `consider` | The task is creative, ambiguous, early-stage, or still needs the right user need, constraints, scope, or tradeoff framing | Straightforward execution with a clear target; routine spec maintenance | Usually hands off to `memo`, then to `work` or `design` |
| `memo` | The task is about maintaining the project's durable engineering memory: spec/task docs, architecture notes, TODO state, changelog, repeatable pitfalls, or the repo's planning memory surface | Generic document editing, copywriting, slide content, blog posts, or ordinary prose docs that are not part of engineering project memory | Often runs after `consider`; may also run after `work` or `design` to sync durable context |
| `work` | The task is primarily coding or engineering execution: feature work, bug fixes, refactors, tests, debugging, review, versioning, release work | Requirement discovery, design exploration, or engineering-memory maintenance as the main task | May invoke `memo` before close if durable project memory changed |

## Skill Boundaries

### `design`

Use `design` when the user is asking for design output.

Typical asks:

- "Design a landing page."
- "Make three dashboard directions."
- "Redesign this PPT."
- "Help me design a document or report layout."
- "Explore a UI style system."

Do not use `design` just because the final output might contain code. If the main question is still about visual direction, start with `design`.

### `consider`

Use `consider` when the conversation needs better problem framing before execution.

Typical asks:

- "I have an idea. Help me figure out what I should build."
- "Help me think through the right requirements."
- "Compare approaches and cut scope."
- "I want this feature, but I am not sure what the real user need is."

`consider` is the front of the loop for creative or ambiguous work. Its job is to help recover context, find the real ask, research the space when needed, and narrow the direction until a downstream skill becomes defensible.

### `memo`

Use `memo` when the task is about the project's durable engineering documentation layer.

This is the important boundary:

`memo` is **not** for all document work. It is for the documentation that keeps an engineering project operable for future agents and future sessions.

Route to `memo` for work such as:

- maintaining task/spec records
- updating architecture notes
- syncing TODO state
- recording shipped outcomes
- recording repeatable pitfalls or workflow hazards
- initializing or repairing the project's planning-memory surface

Do not route to `memo` for:

- ordinary article or prose editing
- slide writing
- marketing copy
- general note taking
- visual document design

If the user says "update the project docs," check the spirit of the task. If they mean durable engineering memory and task/spec maintenance, route to `memo`. If they mean ordinary content editing, do not.

### `work`

Use `work` for almost any coding task.

Typical asks:

- "Fix this bug."
- "Implement this feature."
- "Refactor this module."
- "Add tests."
- "Review this change."
- "Prepare the release."

If the task is already clear and execution is the main job, `work` is the right route.

If the task is not yet well scoped, do not force execution first. Route to `consider`, then continue to `memo` or `work` as needed.

## Common Routing Patterns

- New feature idea with unclear scope: `consider` -> `memo` -> `work`
- New visual direction with unclear requirements: `consider` -> `design`
- Established design task such as a webpage, PPT, or document layout: `design`
- Update engineering task/spec memory after a decision: `memo`
- Bug fix, refactor, tests, or code review: `work`
- Coding task that also changes durable project memory: `work`, then `memo` before close

## Red Flags

These thoughts usually mean the routing step is being skipped:

- "This is simple. I can answer first."
- "I need more context before I choose a skill."
- "I already know what these skills do."

Stop and route deliberately instead.

## End Condition

Once the correct downstream skill is clear, hand off and stop using this file.

