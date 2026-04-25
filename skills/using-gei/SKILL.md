---
name: using-gei
description: "Use when starting any conversation - this Skill should be invoked before any other Skill. It assists in determining how to locate and load Skills."
---

This is the entry router for Gei, a collection of skills such as `design`, `consider`, `see`, `memo`, and `work`.

If there is a real chance the task belongs to one of the skills, stop here first and choose the first downstream skill before you answer, explore, ask clarifying questions, or act.

## Instruction Priority

Gei routing decides **how** to work. The user's instructions still decide **what** to do.

1. User instructions and repo rules come first.
2. If the user explicitly requests a skill, load that skill first unless a higher-priority instruction makes that impossible.
3. If this router conflicts with the selected downstream skill, follow the downstream skill.
4. This router chooses only the first downstream skill.
5. The selected downstream skill owns later workflow decisions.

## Core Rule

Route by the user's primary objective, not by the first visible action word.

Actions such as search, inspect, read, compare, check, verify, update, and summarize may be supporting actions. They should not decide the first skill unless they are the user's final deliverable.

Only load one downstream skill at a time. If later context requires another skill, the currently loaded skill decides that handoff.

## First-Hop Routing

### 1. Explicit Skill Request

If the user explicitly names a skill, load that skill first.

Examples:

- `$memo` + "maintain docs" -> `using-gei` -> `memo`
- `$work` + "release a new version" -> `using-gei` -> `work`

Do not second-guess the first hop just because another skill may also be useful later.

### 2. Primary Objective

If no skill is explicitly requested, choose the first downstream skill by the user's main intended outcome.

- Idea exploration, feature planning, feasibility, product direction, unclear scope, or "I want to..." before execution -> `consider`
- Implementation, bug fixing, Git diagnosis, tests, build, release, refactor, or code execution -> `work`
- Durable project memory, spec files, TODO state, documentation maintenance, or alignment checks -> `memo`
- Interface, visual artifact, layout, poster, deck, prototype, or visual direction -> `design`
- External research, fact-checking, web search, comparison, source-backed summary, or public information as the final deliverable -> `see`
- No matching skill -> exit Gei and answer normally, or use the appropriate non-skill if one applies.

When a new skill is added, route to it by its own current description if it is the best first-hop match. Do not expand this router into a complete copy of every downstream skill's trigger list.

### 3. Supporting Actions

Do not choose a skill only because the request mentions a supporting action. Consider what that action is for.

Examples:

- "Search for mods for a game" -> `using-gei` -> `see`
  - Research is the final deliverable.
- "I want to add a feature; check how another project designed it" -> `using-gei` -> `consider`
  - Feature planning is the primary objective. `consider` may invoke research if external examples are needed.
- "Release a new version" -> `using-gei` -> `work`
  - Release execution is the primary objective. `work` should gather project context first and may invoke `memo` if documentation, TODOs, specs, or durable memory need updates.
- "Check whether the current system matches the alignment docs" -> `using-gei` -> `memo`
  - Documentation alignment is the primary objective.
- "Hi" -> exit Gei and answer normally.

### 4. Context Acquisition

Do not route to `see` or `memo` only because context might be needed.

The selected first-hop skill is responsible for gathering the context it needs:

- `work` gathers project, Git, test, build, and release context before acting.
- `consider` gathers project and external context when the design depends on it.
- `design` gathers visual, product, and reference context needed for the artifact.
- `memo` gathers system and document context needed to maintain durable records.
- `see` gathers source context when research is the deliverable.

## Red Flags

These thoughts usually mean the routing step is being skipped:

- "This is simple. I can answer first."
- "I need more context before I choose a skill."
- "The request mentions search, so it must be `see`."
- "The request might touch docs later, so it must start with `memo`."
- "I already know what these skills do."

Stop and route deliberately.

## End Condition

- If a skill matches, state the routing path briefly, such as `using-gei` -> `consider`
- **Principle of Progressive Disclosure**:
  - If multiple skills are matched, such as: `using-gei` -> `consider` -> `memo` -> `work`, load **only** the skill with the shortest path(In example, it is`consider`).
  - Then, either execute the subsequent skills as directed by the current skill
  - Or wait until the current skill has fully completed before loading the next one; **do not** load all skills at the very beginning.
- If no skill matches, exit this router and continue normally.
