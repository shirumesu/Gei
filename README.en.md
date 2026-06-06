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

/using-gei ──→ /learn(recall memory) ──→ /consider | /memo | /work | /code-review | /see


**`/using-gei`** — Top-level router that manages the lifecycle of the entire task

**`/learn`** — Project memory layer, responsible for recalling, applying, writing, updating, and compacting `spec/MEMORY.md` and `spec/memory/`

**`/consider`** — Asks follow-up questions and searches for mainstream approaches to help you converge and expand ideas, clarify boundaries and impact, and discuss pros and cons

**`/memo`** — Complete documentation maintenance layer, responsible for maintaining the entire `spec/` documentation system

| Module | Responsibility |
| --- | --- |
| `current-work` | Complete record of a series of continuous tasks |
| `OVERVIEW` | Quickly restores context, describes the project, explains how to run tasks and read `spec/`, and is injected by Hook at session start |
| `ARCHITECTURE & architecture/` | Provides the complete detailed architecture of the whole system when needed, including system operation, modules, change impact scope, related files, and more |
| `Docs / Spec-Plan` | Written through a rigorous process and responsible for complex Plan execution |
| `CHANGELOG` | Assists release maintenance with a fixed release process and one-sentence release flow |
| `MEMORY & memory/` | Complete memory layer for repeatable patterns and repeated pitfalls; the index is injected by Hook at session start, and the close check is handled by Learn/Work before the final response |

**`/work`** — Complete code workflow

- Starts from `current-work`, chooses tests, builds, lint, script checks, or release gates by behavior risk, and begins from an expected-to-fail test when new tests are needed
- Code modification maintenance rules · test verification · release process

**`/memo`** ↩ — Maintains new Spec changes based on Work output

**`/learn`** ↩ — Runs the memory recall/write close check before task end and keeps it in the same final response

---

### Standalone Skills

**`/code-review`** — Standalone read-only code review workflow covering correctness, tests, maintainability, UX/DX, and security risks for PRs, diffs, commits, working trees, and implementations

**`/create-skill`** — Detailed Skill-writing guidance covering tone, standard conventions, and many other aspects; also provides Skill optimization, quick format review, and testing workflows

**`/see`** — Tiered web search from quick to rigorous, with multi-layer research criteria to ensure sources are official, objective, accurate, cross-verifiable, and independently verified; can use Jina to help read known crawler-unfriendly URLs

---

## Skills

| Skill | When to Use | Purpose |
| --- | --- | --- |
| `/using-gei` | Before any session starts | Top-level router and task lifecycle maintenance layer |
| `/learn` | When project memory needs to be read, written, updated, cleaned up, or when the user asks to remember or forget something | Manages the `spec/MEMORY.md` index and `spec/memory/` entries, and applies memory at task start and task end |
| `/consider` | When discussing any new idea | Helps converge requirements; provides detailed design proposals when requirements are vague |
| `/memo` | Project-wide documentation maintenance | Maintains the project Spec layer: architecture, current work, changelog, and plan design |
| `/work` | Any code execution task | Complete coding, testing, version maintenance, and release workflow |
| `/code-review` | When reviewing a PR, diff, commit, working tree, or implementation result | Read-only review of code correctness, test quality, maintainability, UX/DX, security, and release risk |
| `/see` | Any external network access | Complete search workflow ensuring information is accurate, reliable, and timely; can use [Jina](https://jina.ai/) to help read known URLs |
| `/create-skill` | When working with Skills | Creates and reviews Skills, and verifies optimization opportunities |

## Hooks

This Skill provides two SessionStart Hooks: `inject_overview` injects the `project_has_spec: true|false` flag and project OVERVIEW context, and `inject_memory` injects the `spec/MEMORY.md` memory index.
`project_has_spec` is based only on whether *spec/OVERVIEW.md* exists. OVERVIEW and MEMORY stay split to avoid oversized output from a single hook.

### Common Usage Paths

| Scenario | Path | Notes |
| --- | --- | --- |
| Complete work session | `using-gei` → `learn` recall memory → `consider` / `work` → `memo` → `learn` close check | Almost no need to call any command manually |
| Code review | `using-gei` → `code-review` | Read-only review that does not enter the `work` implementation lifecycle |
| Idea discussion | `using-gei` → `consider` → `work` | You can explicitly use `consider` for clearer thinking |
| External search | `using-gei` → `consider` (optional) → `see` | `see` requires ambiguity clarification and authoritative data, making results more rigorous |

## AGENTS.md

My personal workflow is synced from my own root-level `~/.codex/AGENTS.md` and provided as a reference and example.

Because it is only a reference example, it is not included in release packages. Please [view it separately](https://github.com/shirumesu/Gei/blob/main/AGENTS.md?plain=1); if needed, you can copy, replace, or enhance your own `AGENTS.md` or `CLAUDE.md`.

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
    learn/
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
