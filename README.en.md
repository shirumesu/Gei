<p align="center"><img width="160" src="assets/icon.png" alt="Gei icon" /></p>

# Gei ~ 芸

English | [简体中文](README.md)

Gei provides small task Skills for Codex and Claude Code, plus project knowledge stored outside the repository. Hooks inject compact background and retrieval routes. Agents read by domain and autonomously preserve conditional decisions, reusable pitfalls, and necessary handoffs. Projects need no new AGENTS.md or Spec directory.

## Skills

| Skill | Final objective |
| --- | --- |
| using-gei | Select the task entry and trigger earned autonomous knowledge updates |
| consider | Clarify requirements, investigate consequential unknowns, compare conditional tradeoffs |
| work | Implement clear tasks with proportionate verification |
| memo | Maintain external background, domain routes, decisions, lessons, and handoffs |
| code-review | Read-only review of implementation and verification evidence |
| see | External research, fact-checking, and source synthesis |
| create-skill | Create, simplify, review, and validate Skills |

Ordinary context reads need no Memo load. Clear tasks go straight to execution; ambiguous consequential work uses Consider. Skills and conditional references load on demand. Gei supplies task boundaries and project knowledge conventions.

## External Project Knowledge

Storage defaults to `~/.agents/geispec`; override with `GEI_SPEC_HOME`. Create the following only as content earns a place, never as an empty startup scaffold:

```text
projects/<project-id>/
  project.json
  INDEX.md
  topics/<domain>/
    README.md
    notes/<decision-or-pitfall>.md
  tasks/<task>.md
context/
  INDEX.md
  notes/<cross-project-lesson>.md
```

- **INDEX**: short background, confirmed working agreements, and business-term routes to domains; the startup entry point.
- **Topic**: domain terms, ownership, consequential constraints, and routes to code, tests, native docs, and relevant notes.
- **Note**: conclusion/status, applicability, actual tradeoffs or verified cause, reconsideration conditions, and evidence. One owner per fact; other locations keep retrieval cues only.
- **Task**: accepted work requiring cross-session recovery; remove active routes when complete.
- **Context**: only lessons whose conditions apply across unrelated projects. Project scope remains the default.

Read INDEX → matching domain → relevant notes or code. Search by business concepts, symptoms, and evaluation criteria. Expand only for concrete dependencies; search project evidence when knowledge is absent. Split a large domain by responsibility rather than keeping a corpus-wide inventory.

When old A/B reasoning informs C/D, check whether priorities and constraints still hold and explain material differences. Distinguish user confirmation, agent inference, accepted unimplemented targets, and verified implementation.

## Autonomous Maintenance

When work establishes reliable background, an accepted consequential decision, a verified reusable pitfall, stale knowledge/routes, or necessary handoff, the agent writes the external update within the task without asking separately whether to remember it. Host filesystem permissions still apply.

Routine changes require neither a note nor an internal Changelog or whole-store audit. Link existing authorities and add only knowledge that changes understanding or decisions. See [Memo](skills/memo/SKILL.md).

## Hooks And Reading Budgets

Two independent SessionStart Hooks inject task routing and project knowledge. Knowledge discovery reads only metadata and Project/Shared INDEX files and supplies autonomous maintenance instructions; topic bodies, notes, history, and sibling projects remain on demand. Users need not author AGENTS.md; existing user/repository instructions still govern.

Project INDEX bodies are capped at 3 KiB, Shared INDEX bodies at 1 KiB, total knowledge context at 7 KiB, and router bodies at 2 KiB. Limits measure UTF-8 bytes, preserve complete lines, and identify clipped source indexes for relevant reads and compaction. They are output caps, not token measurements or guarantees about host UI rendering.

Git subdirectories and linked worktrees share knowledge identity while retaining the active checkout for evidence checks. Nested Git repositories stay separate. Non-Git projects use directory identity; existing root/aliases metadata can associate their subdirectories. Update existing metadata to preserve knowledge when a project moves.

The old five-file collection remains a migration source. When INDEX is missing, Hooks report legacy locations without injecting their bodies. Agents follow [migration guidance](skills/memo/references/migrate.md); unreviewed knowledge must not be discarded.

## Installation

Ask an agent to fetch and execute the [installation guide](docs/install.md):

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

Alternatively install and enable Gei through the host's plugin marketplace. Hosts using only the [Skills archive](https://github.com/shirumesu/gei/releases/latest) can invoke Skills but do not receive plugin Hook injection automatically. Installation does not alter AGENTS.md, CLAUDE.md, or unrelated settings.

## Verification And Releases

```shell
node --test tests/knowledge.test.mjs
python skills/create-skill/scripts/quick_validate.py skills/memo
```

Run these commands from a source checkout. Format validation requires PyYAML. CI runs Hook regressions and all Skill format checks on Windows/Linux. Tests do not prove model compliance or a particular token saving. See [Memo behavioral checks](docs/memo-behavior.md) for evaluation cases.

Public release history lives in [CHANGELOG.md](CHANGELOG.md).

## Acknowledgments

References: [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza).
