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

Storage defaults to `~/.agents/geispec`; override with `GEI_SPEC_HOME`. Session start allocates only a minimal `INDEX.md` under the project name, without identity metadata. Other files and directories are created only as useful knowledge is earned:

```text
projects/<project-name>/
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

Three independent SessionStart Hooks supply task routing, workspace allocation/project context, and shared conditions. Only the workspace Hook creates a missing minimal index; repeated startup preserves existing files. Hooks do not depend on execution order. Topic bodies, notes, and history remain on demand; users need not author AGENTS.md.

Complete outputs are capped at 2 KiB for the router, 4 KiB for workspace context, and 1.5 KiB for shared conditions. Project/Shared INDEX bodies allow at most 3/1 KiB, with paths counted against the whole-output budget. Limits measure UTF-8 bytes, preserve complete lines, and identify clipped sources. Splitting Hooks does not authorize injecting the whole knowledge store.

Ordinary Git repositories, subdirectories, and linked worktrees use the main repository directory name. Separate Git metadata and bare repositories use the common Git directory name; nested repositories and non-Git directories resolve their own names. Names are normalized to lowercase and portable characters; see [storage](skills/memo/references/storage.md) for the complete rule. Equal names intentionally share knowledge. Give unrelated projects different names. Moving a checkout requires no configuration; renaming it requires updating the knowledge directory and incoming links.

Local use needs no account. Optionally connect a private GitHub knowledge repository: matching project names and the same repository binding let tools read and save remote knowledge without a separate agent push. Hooks use versioned INDEX caches, briefly check expired entries, and label offline cache use. Preserve platform and branch conditions when sharing observations across machines.

## Spec Tools And Controls

The plugin bundles a local stdio MCP server; no hosted server is needed. `spec_read`, `spec_search`, `spec_edit`, and `spec_status` access either backend. Edits support exact text replacement and multi-file batches with base-revision checks to prevent concurrent overwrites. Markdown and its directory structure remain unchanged. Use the tools for active maintenance instead of directly editing the shared directory or running independent Git synchronization.

```shell
node <gei>/bin/gei.mjs spec status
node <gei>/bin/gei.mjs spec disable
node <gei>/bin/gei.mjs spec enable
node <gei>/bin/gei.mjs spec connect github --repo owner/private-knowledge
node <gei>/bin/gei.mjs spec use local
```

Connect and switch commands preview first; add `--apply` to execute. Add `--create` to create a private repository. Switching to local backs up previous local content. Disabling Spec retains data and other Skills. GitHub mode can read cached documents offline but never creates a writable local fork or upload queue. See [usage](docs/spec.md) for authentication, bindings, complete refresh, and the Skills-only CLI, and [tool design](docs/spec-tools.md) for interface evidence. Installation does not add a global `gei` command.

Before upgrading a path-hash store, [migrate](skills/memo/references/migrate.md) its content into named directories and repair links. Hooks report matching legacy copies for migration, preserving their files rather than silently allocating empty knowledge or choosing one machine's version.

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
node --test tests/spec.test.mjs
python skills/create-skill/scripts/quick_validate.py skills/memo
```

Run these commands from a source checkout with Node.js 22 or newer. Format validation requires PyYAML. CI is configured for Hook, storage/protocol regressions, and all Skill format checks on Windows/Linux/macOS. Tests do not prove model compliance or a particular token saving. See the current [verification scope](docs/verification.md).

Public release history lives in [CHANGELOG.md](CHANGELOG.md).

## Acknowledgments

References: [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza).
