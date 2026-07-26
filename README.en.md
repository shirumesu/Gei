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

**`/memo`** — Explicit maintenance for `spec/`, architecture, project memory, and durable handoff documents

| Module | Responsibility |
| --- | --- |
| `OVERVIEW` | Quickly restores context, describes the project, explains how to run tasks and read `spec/`, and is injected by Hook at session start |
| `ARCHITECTURE & architecture/` | Provides the complete detailed architecture of the whole system when needed, including system operation, modules, change impact scope, related files, and more |
| `Docs / Task Reference` | Preserves goals, decisions, constraints, and high-fidelity references when cross-session recovery or handoff has real value |
| `CHANGELOG` | Receives each verified changelog-worthy outcome under `## Unreleased`, then compacts them into a version at release |
| `MEMORY & memory/` | Stores project conventions, repeated pitfalls, and hidden constraints not obvious from code or ordinary docs; the index can be injected by Hook |

**`/work`** — Evidence-driven code execution

- Chooses the most discriminating verification by risk and coupling; test-first, persistent plans, commit checkpoints, and full suites are conditional tools
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
| `/memo` | When the user or workflow explicitly needs durable project documentation | Maintains architecture, changelog, task references, and project memory |
| `/work` | Any code execution task | Implements a coherent change and gathers risk-proportionate evidence |
| `/code-review` | When reviewing a PR, diff, commit, working tree, or implementation result | Read-only review of code correctness, test quality, maintainability, UX/DX, security, and release risk |
| `/see` | When external research, fact-checking, or source synthesis is the final deliverable | Uses strong sources, tests counterevidence, and reports scope and uncertainty |
| `/create-skill` | When working with Skills | Creates, right-sizes, reviews, and validates Skills against their actual claims |

## Hooks

This Skill provides three SessionStart Hooks: `inject_using_gei` injects the `using-gei` router, `inject_overview` injects project OVERVIEW context when `spec/OVERVIEW.md` exists, and `inject_memory` injects the memory index when `spec/MEMORY.md` exists.
The three hooks stay split to avoid oversized output from a single hook.

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
