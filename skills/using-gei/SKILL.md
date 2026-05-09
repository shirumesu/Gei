---
name: using-gei
description: "Use when starting any conversation - this Skill should be invoked before any other Skill. It assists in determining how to locate and load Skills."
---

This is the entry router and lifecycle starter for Gei, a collection of skills such as `design`, `consider`, `see`, `memo`, and `work`.

If there is a real chance the task belongs to one of the skills, stop here first and choose the first downstream skill before you answer, explore, ask clarifying questions, or act.

## Instruction Priority

Gei routing decides **how** to work. The user's instructions still decide **what** to do.

1. User instructions and repo rules come first.
2. If the user explicitly requests a skill, load that skill first unless a higher-priority instruction makes that impossible.
3. If this router conflicts with the selected downstream skill, follow the downstream skill.
4. This router chooses only the first downstream skill.
5. The selected downstream skill owns local workflow decisions, but it MUST obey the lifecycle state started here.

## Core Rule

Route by the user's primary objective, not by the first visible action word.

Actions such as search, inspect, read, compare, check, verify, update, and summarize may be supporting actions. They should not decide the first skill unless they are the user's final deliverable.

Only load one downstream skill at a time. If later context requires another skill, the currently loaded skill decides that handoff through the current lifecycle state.

## Lifecycle State

`using-gei` starts lifecycle state; downstream skills enforce it. Do not ask a downstream skill to remember this file. Use `spec/current-work.md` as the short local state file.

### Current Work Rule

If a task may write files, publish, commit, or maintain project state, it **MUST** have one of these before the first file edit:

1. an existing `spec/current-work.md`
2. a new micro-anchor in `spec/current-work.md`
3. an explicit no-anchor exemption stated to the user

User wording such as "small", "lightweight", "quick", "minor", or "ad hoc" does **not** bypass this rule when files may be changed.

### Must Anchor

Create or overwrite `spec/current-work.md` when any item is true:

- the task changes existing project code, config, docs, skills, tests, or release files
- more than one file may change
- the user describes a goal instead of a mechanical one-line edit
- the task may require tests, build, lint, release, commit, PR, or deployment
- the workspace already has unclear uncommitted changes
- the work may affect future agents' understanding
- the user or AI is about to make a small, lightweight, quick, minor, or ad hoc file change

### Allowed No-Anchor Exemptions

Skip `spec/current-work.md` only when one item is true:

- pure answer, explanation, translation, brainstorming, or summary with no file writes
- pure inspect, read, or search with no file writes
- one mechanical line edit in one temporary or personal file, with no project state impact
- the user explicitly says not to record it, and the task does not touch release, commit, migration, deletion, configuration, or durable project docs

When skipping, state the reason in this shape:

```text
No anchor: [specific exemption].
```

### Micro-Anchor Format

Use this minimum shape. Overwrite stale content at the start of a new anchored task unless the current task is explicitly resuming it.

```md
# Current Work

- Id: `#W-YYYYMMDD-001`
- Intent: <why this file-changing work is happening>
- Started: YYYY-MM-DD
- Expected scope: <files, directories, or "unknown until inspection">
- Durable record needed: unknown | yes | no
- Status: active | paused | closed
```

Do not add `Author` or `Actor`.

### Cleanup

Close or clear `spec/current-work.md` at every phase boundary:

- after a lightweight task finishes and verification is reported
- before or after a release, publish, handoff, or version checkpoint
- after Memo records a durable plan or shipped outcome
- when starting an unrelated anchored task

Prefer hard overwrite for a new task. Do not carry old current-work data forward by default.

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
- Spec files, current-work reconciliation, changelog/checkpoint maintenance, documentation maintenance, or alignment checks -> `memo`
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
  - Release execution is the primary objective. `work` should gather project context first and may invoke `memo` if current-work, changelog, spec, or architecture updates are needed.
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
- If lifecycle state was required, also state whether `spec/current-work.md` was created, reused, or explicitly skipped.
- **Principle of Progressive Disclosure**:
  - If multiple skills are matched, such as: `using-gei` -> `consider` -> `memo` -> `work`, load **only** the skill with the shortest path(In example, it is`consider`).
  - Then, either execute the subsequent skills as directed by the current skill
  - Or wait until the current skill has fully completed before loading the next one; **do not** load all skills at the very beginning.
- If no skill matches, exit this router and continue normally.
