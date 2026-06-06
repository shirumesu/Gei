<p align="center">
  <img width="160" src="assets/icon.png" alt="Gei icon" />
</p>

<h1 align="center">Gei ~ 芸</h1>

<p align="center">
  A full suite of AI Skills for Codex, covering requirement clarification, documentation, project management, testing, coding, review, release, search, and more.
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

/using-gei ──→ /learn(recall memory) ──→ /consider | /memo | /work | /code-review | /see


**`/using-gei`** — Main router, manages the lifecycle of the entire task

**`/learn`** — Project memory layer for recalling, applying, writing, updating, and compacting `spec/MEMORY.md` plus `spec/memory/`

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
- Code modification guidelines · test verification · release process

**`/memo`** ↩ — Based on the work done, maintains new Spec changes

**`/learn`** ↩ — The Stop hook asks for a memory recall/write check before anchored tasks end

---

### Standalone Skills

**`/code-review`** — Standalone read-only code review workflow for PRs, diffs, commits, working trees, and implementations, covering correctness, tests, maintainability, UX/DX, and security risk

**`/create-skill`** — Detailed skill-writing guide covering tone, standard conventions, and more; also provides skill optimization, quick format review, and testing workflows

**`/see`** — Tiered web search (from quick to rigorous), multi-layer research criteria ensuring sources are official, objective, accurate, and can be independently cross-verified; can use Jina as a helper reader for known crawler-unfriendly URLs

---

## Skills

| Skill | When to Use | Purpose |
| --- | --- | --- |
| `/using-gei` | Before any session starts | Main router and task lifecycle maintenance layer |
| `/learn` | When recalling, writing, updating, deleting, compacting, or auditing project memory | Manages the `spec/MEMORY.md` index and `spec/memory/` entries at task start and task end |
| `/consider` | When discussing any new idea | Helps converge requirements; provides detailed design proposals when requirements are vague |
| `/memo` | Project-wide documentation maintenance | Maintains the project Spec layer: architecture, current work, changelog, and solution design |
| `/work` | Any code execution task | Complete coding, testing, version maintenance, and release workflow |
| `/code-review` | When reviewing a PR, diff, commit, working tree, or implementation result | Read-only review for correctness, test quality, maintainability, UX/DX, security, and release risk |
| `/see` | Any external web access | Comprehensive search workflow ensuring information is accurate, reliable, and timely; can use [Jina](https://jina.ai/) as a helper reader for known URLs |
| `/create-skill` | When working with Skills | Create and review Skills, verify optimization opportunities |

## Hooks

This Skill provides three hooks: `inject_overview` injects the `project_has_spec: true|false` flag and project OVERVIEW context, `inject_memory` injects the `spec/MEMORY.md` index, and `stop_record_memory` asks for a Learn memory check before anchored tasks stop.
`project_has_spec` is true only when *spec/OVERVIEW.md* exists. OVERVIEW and MEMORY stay split to avoid oversized single-hook output.

### Common Usage Paths

| Scenario | Path | Notes |
| --- | --- | --- |
| A complete work session | `using-gei` → `learn` recall → `consider` / `work` → `memo` → `learn` close check | Almost no need to manually invoke any commands |
| Code review | `using-gei` → `code-review` | Read-only review; does not enter Work's implementation lifecycle |
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

Requires Node.js to be available. Clone the repo anywhere, then manually create skill links and configure hooks:

```shell
git clone https://github.com/shirumesu/gei.git ~/.agents/Gei
```

**Create skill links:**

Windows (PowerShell):
```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\using-gei" -Target "$HOME\.agents\Gei\skills\using-gei"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\learn" -Target "$HOME\.agents\Gei\skills\learn"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\work" -Target "$HOME\.agents\Gei\skills\work"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\code-review" -Target "$HOME\.agents\Gei\skills\code-review"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\memo" -Target "$HOME\.agents\Gei\skills\memo"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\see" -Target "$HOME\.agents\Gei\skills\see"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\consider" -Target "$HOME\.agents\Gei\skills\consider"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\create-skill" -Target "$HOME\.agents\Gei\skills\create-skill"
```

Unix (Bash/Zsh):
```shell
ln -s ~/.agents/Gei/skills/using-gei ~/.claude/skills/using-gei
ln -s ~/.agents/Gei/skills/learn ~/.claude/skills/learn
ln -s ~/.agents/Gei/skills/work ~/.claude/skills/work
ln -s ~/.agents/Gei/skills/code-review ~/.claude/skills/code-review
ln -s ~/.agents/Gei/skills/memo ~/.claude/skills/memo
ln -s ~/.agents/Gei/skills/see ~/.claude/skills/see
ln -s ~/.agents/Gei/skills/consider ~/.claude/skills/consider
ln -s ~/.agents/Gei/skills/create-skill ~/.claude/skills/create-skill
```

**Configure SessionStart / Stop hooks:**

Edit `~/.claude/settings.json` and add the following (if `hooks` field already exists, merge it):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node \"~/.agents/Gei/hooks/inject_overview.mjs\"",
            "statusMessage": "Loading Gei project overview",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node \"~/.agents/Gei/hooks/inject_memory.mjs\"",
            "statusMessage": "Loading Gei memory index",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"~/.agents/Gei/hooks/stop_record_memory.mjs\"",
            "statusMessage": "Checking Gei learn memory gate",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

On Windows, replace `~` with your actual home directory path and use double backslashes or forward slashes.

Restart Claude Code to apply. Afterwards, just `git pull` to update the repo.

#### Non-Plugin / Other Agents

Download `Gei-skills.zip` from [releases](https://github.com/shirumesu/gei/releases/latest) and extract the desired skill directories into your skills directory.
Most agents accept recursive subdirectory search, so your install directory can look like this:
```text
<skills-dir>/
  Gei/
    using-gei/
      SKILL.md
    learn/
      SKILL.md
    work/
      SKILL.md
    code-review/
      SKILL.md
    memo/
      SKILL.md
    see/
      SKILL.md
    consider/
      SKILL.md
    create-skill/
      SKILL.md
```

Even nesting another layer like `Gei/skills/<skill>` works fine.

#### Git Installation

You can also simply `git clone https://github.com/shirumesu/gei.git` and update with `git pull`.

## Changelog / New Discoveries

See [CHANGELOG.md](./CHANGELOG.md) for the latest public version changelog.

## Acknowledgments

- Inspiration and references:
	- [superpowers](superpowers)
	- [gstack](https://github.com/garrytan/gstack)
	- [Waza](https://github.com/tw93/waza)
- Donors
	- [Myself](https://github.com/shirumesu) donated a complete human brain, effectively reducing token costs during development
