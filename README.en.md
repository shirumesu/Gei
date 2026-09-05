<p align="center"><img width="160" src="assets/icon.png" alt="Gei icon" /></p>

# Gei ~ 芸

English | [简体中文](README.md)

Gei provides small task Skills for Codex and Claude Code, plus project knowledge stored outside the repository. Hooks inject compact background and retrieval routes. Agents read by domain and autonomously preserve conditional decisions, reusable pitfalls, and necessary handoffs. Projects need no new AGENTS.md or Spec directory.

## Skills

| Skill | Final objective |
| --- | --- |
| using-gei | Select the task entry and trigger earned autonomous knowledge updates |
| consider | Discover needs, propose competing designs, and improve them through concrete challenges |
| work | Connect entry points, implementation, and consumers; verify the delivered outcome |
| memo | Maintain external background, domain routes, decisions, lessons, and handoffs |
| code-review | Read-only review of functionality, interaction, presentation, performance, and consistency |
| see | External research, fact-checking, and source synthesis |
| create-skill | Create, simplify, review, and validate Skills |

Ordinary context reads need no Memo load. Clear tasks go straight to execution; ambiguous consequential work uses Consider. Skills and conditional references load on demand. Gei supplies task boundaries and project knowledge conventions.

Consider contributes designs and challenges its own recommendation; Code Review prioritizes actual experience and grounded consistency judgments. Work stays a thin delivery convention whose added value needs real-task evidence; see the [verification scope](docs/verification.md).

## External Project Knowledge

Storage defaults to `~/.agents/geispec`; override with `GEI_SPEC_HOME`. Session start allocates `project.json` and a minimal `INDEX.md`. Other files and directories are created only as useful knowledge is earned:

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

Three independent SessionStart Hooks supply task routing, workspace allocation/project context, and shared conditions. Only the workspace Hook creates missing metadata and a minimal index; repeated startup preserves existing files. Hooks do not depend on execution order. Topic bodies, notes, and history remain on demand; users need not author AGENTS.md.

Complete outputs are capped at 2 KiB for the router, 4 KiB for workspace context, and 1.5 KiB for shared conditions. Project/Shared INDEX bodies allow at most 3/1 KiB, with paths counted against the whole-output budget. Limits measure UTF-8 bytes, preserve complete lines, and identify clipped sources. Splitting Hooks does not authorize injecting the whole knowledge store.

Git subdirectories and linked worktrees share knowledge identity while retaining the active checkout for evidence checks. Nested Git repositories stay separate. Non-Git directories have independent identities; parent workspaces do not absorb children. Roots/aliases match exact paths. Update existing metadata to preserve knowledge when a project moves.

When a legacy store has no INDEX, allocation links its old entry files from a minimal index. Agents follow [migration guidance](skills/memo/references/migrate.md), then remove obsolete files and placeholders from active knowledge. Keep any required migration snapshot outside the active store.

## Installation

Ask an agent to fetch and execute the [installation guide](docs/install.md):

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

Alternatively install and enable Gei through the host's plugin marketplace. Hosts using only the [Skills archive](https://github.com/shirumesu/gei/releases/latest) can invoke Skills but do not receive plugin Hook injection automatically. Installation does not alter AGENTS.md, CLAUDE.md, or unrelated settings.

## Verification And Releases

```shell
node .github/scripts/check_hooks.mjs
python skills/create-skill/scripts/quick_validate.py skills/memo
```

Run these commands from a source checkout. Format validation requires PyYAML. CI runs Hook regressions and all Skill format checks on Windows/Linux. Tests do not prove model compliance or a particular token saving. See the current [verification scope](docs/verification.md).

Public release history lives in [CHANGELOG.md](CHANGELOG.md).

## Acknowledgments

References: [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza).
