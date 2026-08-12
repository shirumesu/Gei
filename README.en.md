<p align="center">
  <img width="160" src="assets/icon.png" alt="Gei icon" />
</p>

<h1 align="center">Gei ~ 芸</h1>

<p align="center">
  A full suite of AI Skills for Codex, covering requirement clarification, documentation maintenance, project management, testing, coding, review, release, search, and many other scenarios.
</p>

<p align="center">
  <span>English</span>
  |
  <a href="README.md">简体中文</a>
</p>

Many engineering skills today are too heavy, and because they are based on the Claude Code ecosystem, their compatibility with Codex is sometimes incomplete.

So I wrote this skill suite.

## What does it do?

1. Too many skills on `Codex` are read all at once instead of loaded on demand: explicit progressive disclosure, loading only one skill at a time
2. Skill interdependencies are overly complex: keep things simple, with a single skill as the routing entry point that dispatches tasks to detailed content and gives users strong control
3. A more complete and comprehensive workflow
4. Covers daily use beyond code-writing projects, including skills such as `see` for everyday search and verification

## Workflow

> All Skills have built-in **progressive disclosure** and **routing**. The whole chain needs almost no manual intervention; Skills are automatically inlined internally.

### Main Flow

/using-gei ──→ /consider | /memo | /work | /code-review | /see | /create-skill

**`/using-gei`** — Lightweight router that selects a Skill by the final deliverable

**`/consider`** — Designs only when direction, boundaries, or consequential tradeoffs remain unresolved

**`/memo`** — Maintains and reconciles GeiSpec background, architecture, impact routes, changelog, Group context, memory, and durable handoff documents

| Module | Responsibility |
| --- | --- |
| `OVERVIEW` | Restores Project or Group purpose, responsibilities, boundaries, and next-read routes; meaningful content is injected by Hooks |
| `ARCHITECTURE & architecture/` | Preserves stable boundaries, components, critical flows, interfaces, maintenance entry points, and important ADRs; larger projects split by domain only when needed |
| `IMPACTS` | Records only non-obvious downstream effects, cross-boundary contracts, and coupled checks instead of duplicating code or framework facts |
| `CHANGELOG` | Keeps verified outcomes, Unreleased work, and release/checkpoint history in a Keep a Changelog shape without becoming a task plan or commit dump |
| `Change Spec / Task Reference` | Uses one file for ordinary handoff; consequential features may separate proposal, requirements, design, and tasks, then merge current facts back into Architecture/Impacts and archive only when useful |
| `MEMORY & memory/` | Stores conventions, repeated pitfalls, and hidden constraints not obvious from code or background; Project, Group, and Shared Context own separate indexes |
| `Groups` | Give independent working directories shared OVERVIEW, IMPACTS, MEMORY, and member routes without merging their Project-local context |

After a verified change, Memo reconciles current facts by impact: it rewrites stale content instead of merely appending history, and repairs, merges, or deletes drift from evidence. Observable behavior remains owned by repository-native specs, tests, schemas, or product documentation so GeiSpec does not grow into a second implementation encyclopedia.

**`/work`** — Evidence-driven code execution

- Chooses the most discriminating verification by risk and coupling; test-first, persistent plans, commit checkpoints, and full suites are conditional tools
- Finishes with a focused documentation impact scan and reconciles only GeiSpec or native documentation changed by the verified result
- Releases follow repository-native policy and verify the actual artifact or remote state

---

### Standalone Skills

**`/code-review`** — Standalone read-only code review workflow covering correctness, tests, maintainability, UX/DX, and security risks for PRs, diffs, commits, working trees, and implementations

**`/create-skill`** — Creates, right-sizes, reviews, and validates Skills with deletion-first context design and progressive disclosure

**`/see`** — Scales research depth to decision risk and separates facts, inference, disagreement, and unknowns

---

## Skills

| Skill | When to Use | Purpose |
| --- | --- | --- |
| `/using-gei` | When Gei is active and a request may match a task Skill | Selects one entry by the final deliverable |
| `/consider` | When a high-impact design or direction has material uncertainty | Recovers context, compares real alternatives, and recommends a testable direction |
| `/memo` | When durable background, architecture, impact routes, changelog, Groups, task references, drift repair/compaction, or a passing memory candidate are needed | Maintains and reconciles the Project / Group / Shared Context GeiSpec layers |
| `/work` | Any code execution task | Implements a coherent change and gathers risk-proportionate evidence |
| `/code-review` | When reviewing a PR, diff, commit, working tree, or implementation result | Read-only review of code correctness, test quality, maintainability, UX/DX, security, and release risk |
| `/see` | When external research, fact-checking, or source synthesis is the final deliverable | Uses strong sources, tests counterevidence, and reports scope and uncertainty |
| `/create-skill` | When working with Skills | Creates, right-sizes, reviews, and validates Skills against their actual claims |

## Hooks

This Skill provides seven independent SessionStart Hooks: router, Shared Context MEMORY, Group OVERVIEW, Group MEMORY, Project OVERVIEW, Project CHANGELOG, and Project MEMORY. Splitting gives each layer its own output budget and avoids single-Hook previews or spills in Claude Code and Codex.

Empty layers produce no output. For example, a Group with no meaningful OVERVIEW or MEMORY, or a Project CHANGELOG with no real `Unreleased` entry, stays silent. Project OVERVIEW is the injected structural entry point; `ARCHITECTURE.md`, `IMPACTS.md`, released Changelog history, detailed `memory/*.md`, `docs/`, and sibling Project Specs remain on-demand reads.

## GeiSpec

GeiSpec lives only under `~/.agents/geispec`; set `GEI_SPEC_HOME` to override it. Each exact working directory receives a path-derived Project id. Every Project SessionStart Hook shares one idempotent initializer that fills in missing `OVERVIEW.md`, `ARCHITECTURE.md`, `IMPACTS.md`, `CHANGELOG.md`, `MEMORY.md`, `architecture/`, `docs/`, and `memory/` assets from Memo templates without overwriting existing content, including during parallel startup. Domain views and ADRs are written only when the project earns them, rather than pre-generating an empty architecture encyclopedia.

Project-local `spec/`, bindings, modes, and a GeiSpec CLI are no longer part of the system. The Agent creates Groups, associates Projects, and maintains semantic content by editing the external store under Memo's progressive-disclosure rules.

### Common Usage Paths

| Scenario | Path | Notes |
| --- | --- | --- |
| Clearly scoped code work | `using-gei` → `work` | Implements and verifies directly, records a changelog-worthy outcome, and updates other Spec or memory surfaces only when the change requires it |
| Code review | `using-gei` → `code-review` | Read-only review that does not enter the `work` implementation lifecycle |
| Idea discussion | `using-gei` → `consider` → `work` | You can explicitly use `consider` for clearer thinking |
| External search | `using-gei` → `consider` (optional) → `see` | `see` requires ambiguity clarification and authoritative data, making results more rigorous |

## Installation

### Paid Token Installation

Copy this sentence to your Agent:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### Token-Free Manual Installation

> Estimated savings: about 10,000 tokens

#### Claude Code / Codex / Codex CLI

For `Claude Code`, `Codex`, and `Codex CLI`, you can install it as a **plugin**.

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git
```

Then install and enable `gei` on the Plugins page of the Codex app, or through `/plugins` in Codex CLI.

Claude Code is similar.

#### Non-Plugin / Other Agents

Download `Gei-skills.zip` from the [release](https://github.com/shirumesu/gei/releases/latest), then extract the skill directories you need into your skills directory.

Most Agents can recursively search subdirectories, so your install directory can also look like this:

```text
<skills-dir>/
  Gei/
    using-gei/
      SKILL.md
    memo/
      SKILL.md
    ...
```

Even nesting one more layer as `Gei/skills/<skill>` also works.

#### Git Installation

You can also directly `git clone https://github.com/shirumesu/gei.git` and update later with `git pull`.

## Changelog / New Discoveries

See [CHANGELOG.md](./CHANGELOG.md) for the latest public changelog.

## Acknowledgments

- Inspiration and references:
  - [superpowers](superpowers)
  - [gstack](https://github.com/garrytan/gstack)
  - [Waza](https://github.com/tw93/waza)
- Donors
  - [Myself](https://github.com/shirumesu) donated a complete human brain, effectively reducing token costs during development
