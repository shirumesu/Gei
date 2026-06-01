<p align="center">
  <img width="160" src="assets/icon.png" alt="Gei icon" />
</p>

<h1 align="center">Gei ~ 芸</h1>

<p align="center">
  A full suite of AI Skills for Codex, covering design, documentation, project management, testing, coding, review, release, search, and more.
</p>

<p align="center">
  <span>English</span>
  |
  <a href="README.md">简体中文</a>
</p>

Most existing engineering skills today are too heavy, and being built on the Claude Code ecosystem, they sometimes don't integrate well with Codex.
So I wrote these skills.

## What does it do?

1. Too many skills get loaded all at once in `Codex` instead of on demand: explicit progressive disclosure — load only one skill at a time
2. Skill interdependencies are overly complex: keep it simple — a single skill acts as the routing entry point, distributing tasks to detailed content, giving users strong control
3. A more refined and comprehensive workflow
4. Covers everyday needs — beyond coding, there are skills like `see` for daily search and verification

## Workflow

> All skills have built-in **progressive disclosure** and **routing-based distribution**. The entire pipeline requires almost no manual intervention — skills auto-inline internally.

### Main Flow

/using-gei ──→ /consider ──→ /memo ──→ /work ──→ /memo


**`/using-gei`** — Main router, manages the lifecycle of the entire task

**`/consider`** — Asks follow-up questions and searches for mainstream approaches, helping you converge and expand ideas, clarify boundaries and impact, and discuss pros and cons

**`/memo`** — Full documentation maintenance layer

| Module | Responsibility |
| --- | --- |
| `current-work` | Complete record of a series of consecutive tasks |
| `OVERVIEW & ARCHITECTURE` | Quick context recovery |
| `Docs / Spec-Plan` | Written following a rigorous process, responsible for complex Plan execution |
| `CHANGELOG` | Assists version release maintenance with a fixed release process in one line |

**`/work`** — Complete code workflow

- Starts from `current-work`, covering detailed test-writing guidance (begin work from an expected-to-fail test)
- Code modification guidelines · Review · Sub-agent usage · Release process

**`/memo`** ↩ — Based on the work done, maintains new Spec changes

---

### Standalone Skills

**`/create-skill`** — Detailed skill-writing guide covering tone, standard conventions, and more; also provides skill optimization, quick format review, and testing workflows

**`/see`** — Tiered web search (from quick to rigorous), multi-layer research criteria ensuring sources are official, objective, accurate, and can be independently cross-verified; leverages upstream tools to access crawler-unfriendly sites

---

## Skills

| Skill | When to Use | Purpose |
| --- | --- | --- |
| `/using-gei` | Before any session starts | Main router and task lifecycle maintenance layer |
| `/consider` | When discussing any new idea | Helps converge requirements; provides detailed design proposals when requirements are vague |
| `/memo` | Project-wide documentation maintenance | Maintains the project Spec layer: architecture, current work, changelog, and solution design |
| `/work` | Any coding task | Complete coding, testing, review, version maintenance, and release workflow |
| `/see` | Any external web access | Comprehensive search workflow ensuring information is accurate, reliable, and timely; optimizes results via [Jina](https://jina.ai/); supports Reddit / Twitter / 小红书 and other anti-crawler platforms |
| `/create-skill` | When working with Skills | Create and review Skills, verify optimization opportunities |
| `/design` | Visual tasks like web pages, PPTs, documents | Distilled from [Claude Design System](https://gist.github.com/hqman/f46d5479a5b663c282c94faa8be866de), suitable for interfaces, layouts, prototypes, and presentations *(experimental)* |

## Hooks

This Skill provides a Hooks to inject the `using-gei` full text at the beginning of the session and if the project has a *spec/* flag.
If it is a Codex, the full text of *spec/OVERVIEW.md* will be injected along with it; due to Claude Code's maximum Hooks text limit, it is limited to the full text of `using-gei` and the Flag.

### Common Usage Paths

| Scenario | Path | Notes |
| --- | --- | --- |
| A complete work session | `using-gei` → `consider` → `memo` → `work` → `memo` | Almost no need to manually invoke any commands |
| Idea discussion | `using-gei` → `consider` → `work` | You can explicitly use `consider` for clearer thinking |
| External search | `using-gei` → `consider` (optional) → `see` | `see` requires disambiguating queries and using authoritative data, resulting in more rigorous output |

## AGENTS.md

My personal workflow, synced from my own root-level `~/.codex/AGENTS.md`, provided as a reference and example.
Since this is only a reference example, it is not included in the release package. Please [view it separately](https://github.com/shirumesu/Gei/blob/main/AGENTS.md?plain=1). If needed, you can copy, replace, or enhance your own `AGENTS.md` or `CLAUDE.md`.

## Installation

### Paid Token Installation

Copy this to your Agent:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### Token-Free Manual Installation

> Estimated savings of ~10,000 tokens

#### Codex / Codex CLI

For `Codex` and `Codex CLI`, you can install as a **plugin**.

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git --sparse .agents/plugins
```

Then install and enable `gei` on the Plugins page of the Codex app, or via `/plugins` in Codex CLI.

If your Codex version, marketplace content, or environment currently can't fully support this path, try in this order:

1. Update the marketplace / plugin configuration in `~/.codex/config.toml`;
2. Place the plugin directory directly under `~/.codex/plugins/cache/gei/` so Codex recognizes it as a local plugin first;
3. As a last resort, fall back to manually extracting `Gei-codex-plugin.zip` from the release package.

#### Claude Code Plugin Installation (with Hook)

Requires Node.js to be available. Clone the repo anywhere, then run the built-in install script:

```shell
git clone https://github.com/shirumesu/gei.git ~/.agents/Gei
node ~/.agents/Gei/hooks/install-claude.mjs
```

The script automatically:

- Creates directory junctions from `~/.claude/skills/` to this repo's `skills/`, keeping skills in sync with `git pull`
- Writes the `SessionStart` hook to `~/.claude/settings.json`, injecting Gei's routing context at session start

Restart Claude Code to apply. Afterwards, just `git pull` to update the repo — no need to re-run the script.

#### Non-Plugin / Other Agents

Download `Gei-skills.zip` from [releases](https://github.com/shirumesu/gei/releases/latest) and extract the desired skill directories into your skills directory.
Most agents accept recursive subdirectory search, so your install directory can look like this:
```text
<skills-dir>/
  Gei/
    using-gei/
      SKILL.md
    work/
      SKILL.md
    memo/
      SKILL.md
    see/
      SKILL.md
    consider/
      SKILL.md
    design/
      SKILL.md
```

Even nesting another layer like `Gei/skills/<skill>` works fine.

#### Git Installation

You can also simply `git clone https://github.com/shirumesu/gei.git` and update with `git pull`.

## Known Issues

- `/see` depends on some [upstream tools](#acknowledgments) which are not very stable. Occasionally you may need to manually register and log in. The skill already includes auto-install and setup guidance — your Agent should walk you through installation and login.
	- Since the upstream tools are mostly crawlers and CLI automation tools, account ban risk cannot be guaranteed. If you prefer not to use them, explicitly tell your AI in the task.

## Changelog / New Discoveries

See [CHANGELOG.md](./CHANGELOG.md) for the latest public version changelog.

## Acknowledgments

- Inspiration and references:
	- [superpowers](superpowers)
	- [gstack](https://github.com/garrytan/gstack)
	- [Waza](https://github.com/tw93/waza)
- Upstream tools:
	- X access support: [twitter-cli](https://github.com/public-clis/twitter-cli)
	- 小红书 access support: [xiaohongshu-cli](https://github.com/jackwener/xiaohongshu-cli)
	- Reddit access support: [rdt-cli](https://github.com/public-clis/rdt-cli)
- Donors
	- [Myself](https://github.com/shirumesu) donated a complete human brain, effectively reducing token costs during development
