---
name: memo
description: Use to maintain GeiSpec background, impact routes, memory, Groups, or durable task references.
---

# Memo

Maintain only context that helps a future agent recover the right background, notice non-obvious consequences, or avoid repeating a mistake. Repository evidence and current user decisions remain authoritative.

GeiSpec lives only under `~/.agents/geispec` (or `GEI_SPEC_HOME`). SessionStart Hooks create the fixed Project scaffold for the exact current working directory. Project-local `spec/`, bindings, modes, and a user-facing CLI are not part of the system.

## Scope

Choose the narrowest scope that fully owns the fact:

- **Project**: background, impact routes, and lessons for one working directory.
- **Group**: shared purpose, cross-project impacts, and lessons for related Projects.
- **Shared Context**: only durable behavior that clearly applies across unrelated projects.

When a fact broadens, move it to the wider scope and remove redundant narrower copies. Current user instructions and repository evidence override Project, which overrides Group, which overrides Shared Context.

## Route

Read only the reference that owns the requested outcome:

| Need | Read |
| --- | --- |
| Bootstrap or repair missing fixed files | `references/initialize.md` |
| Update Project or Group background and boundaries | `references/overview.md` |
| Record a non-obvious change consequence or shared contract | `references/impacts.md` |
| Create a Group, change membership, or promote shared context | `references/groups.md` |
| Recall, write, move, merge, or remove memory | `references/memory.md` |
| Preserve an explicit cross-session handoff | `references/task-docs.md` |

Templates under `templates/` are runtime assets used by Hooks and initialization. Do not read every template during ordinary work.

## Writing Boundary

- Do not turn Spec into a framework summary, dependency list, directory encyclopedia, code-comment guide, or duplicate source tree.
- Update the smallest relevant section only after evidence or an accepted decision changes it.
- `OVERVIEW.md` restores purpose, responsibilities, boundaries, and read routes.
- `IMPACTS.md` records only consequences likely to be missed when changing one surface in isolation.
- `MEMORY.md` is a short linked index for durable, non-obvious operational lessons.
- `docs/` is conditional: create a task reference only when cross-session recovery or handoff has real value.

At task close, briefly assess only the current conversation and verified outcome for a memory candidate. Write autonomously when it passes `references/memory.md`; otherwise do nothing and say nothing.
