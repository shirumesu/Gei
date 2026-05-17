<p align="center">
  <img width="160" src="assets/icon.png" alt="Gei icon" />
</p>

<h1 align="center">Gei ~ 芸</h1>

<p align="center">
  A full suite of AI Skill for Codex, covering a variety of scenarios including design, document maintenance, project management, testing, coding, review, publishing, search, and more.
</p>

<p align="center">
  <span>English</span>.
  <a href="README.md">Simplified Chinese</a>.
</p

Many of the current project skills are too heavy and based on the Claude Code ecosystem which is sometimes not Codex-compatible.
So I wrote this skill

## What does it do?

1. too many skills, read all at once on `Codex` instead of loaded on demand: explicit segmented disclosure, load one skill at a time.
2. too much complexity in skill dependencies: keep it simple, use a single skill as a routing entry point, and stream to details based on tasks, so that users have more control.
3. better workflow, to solve the problem of overloading some skills.
4. more comprehensive, in addition to writing code, there are also `see` and other skills for daily search and verification.

## Skills

| skill | when to use | what to do | skill ## Skills
| ----- | ------- | ---- | `/using-gege' | `/using-ge' `/using-ge
| `/using-gei` | Use before any session starts | Total Routing and Task Life Maintenance Layer |
| `/consider` | for discussing any new ideas | he will help you shrink your requirements, especially if they are vague and give you a detailed design |
| `/memo` | Project-wide documentation | Maintains the spec layer of the project, documenting the project architecture, current work, change logs, and schemas | `/work` | Maintains the spec layer of the project, documenting the project architecture, current work, change logs, and schemas
| `/work` | Any code task | The complete process of coding, testing, reviewing, versioning, and releasing. | `/work` | Any code tasks
| `/see` | Any external web access | Provides a comprehensive search process to ensure that information is accurate, reliable, and current. Search results are optimized through [Jina](https://jina.ai/). It also supports access to *reddit* / *twitter* / *reddit*, which is a wind-control platform.
| `/design` | Experimental: visual tasks such as web page, PPT, document design | Extracted from [Claude Design System prompt](https://gist.github.com/hqman/f46d5479a5b663c282c94faa8be866de), more suitable for Visual products such as interfaces, layouts, prototypes, presentations, etc. |

### Commonly used paths

| Scenarios | Skill Paths | Notes |
| ----- | ------- | ---- |
| complete one-time work | `using-gei` → `consider` → `memo` → `work` → `memo` | hardly any active commands |
| Ideas for discussion | `using-gei` → `consider` → `work` | Could show that using `consider` would be clearer |
| external search | `using-gei` → `consider` (optional)` → `see` | see requires ambiguity to be clarified, uses authoritative, mainstream data, and requires some stress-testing to provide more rigorous search results |

## AGENTS.md

A personal workflow that will synchronize the root level `~/.codex/AGENTS.md` that I use myself for reference and examples.

## Installation

### Pay for Token Installation

Copy this to your Agent:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### Token-free manual installation

> Expected to save about 10000 Token

#### Codex / Codex CLI

For `Codex` and `Codex CLI`, you can install them as **plugin**.

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git --sparse .agents/plugins
``

After that, install and enable `gei` on the Plugins page of the Codex app, or `/plugins` in the Codex CLI.

At this stage, if your Codex version, marketplace content, or environment doesn't allow you to follow this path in its entirety, you can try them in that order:

1. Update the marketplace / plugin configuration in `~/.codex/config.toml`. 2;
2. put the plugins directory directly under `~/.codex/plugins/cache/gei/`, so that Codex recognizes the local plugins first. 3. finally, go back to the release package;
3. Finally, return the `Gei-codex-plugin.zip` in the release package and extract it manually.

#### Codex Non-Plugin / Claude Code / Other Agent

Download `Gei-skills.zip` at [release](https://github.com/shirumesu/gei/releases/latest) and extract the required skills directories into your skills directory.
Most Agents accept subdirectories for recursive searching, so your installation directory can also look like this.
``text
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
``

Or even a layer of `Gei/skills/<skill>` would work.

#### git installation (Claude Code / other agents)

Or you could just `git clone https://github.com/shirumesu/gei.git` and update it with `git pull` instead?

#### AGENTS.md

As this is just a reference example, it will not be included in the release package, so please [see it separately](https://github.com/shirumesu/Gei/blob/main/AGENTS.md?plain=1), and copy and replace or enhance your own `AGENTS.md` or ` CLAUDE.md

## Known issues

- `/See` relies on some [upstream tools] (# thanks), they are not very stable, occasionally you need to register and log in manually, the skill has been written to automatically install and guide, your Agent should guide you to complete the installation and log in.
- Since upstream tools are mostly crawlers, cli automation, etc., the risk of blocking is not guaranteed, so if you don't want to use them, please explicitly mention it to the AI in the task.

## Update Log / New Discoveries

The latest public version of the log is available at [CHANGELOG.md](. /CHANGELOG.md).

## Thanks to

- Inspiration and references:
- [superpowers](superpowers)
- [gstack](https://github.com/garrytan/gstack)
- [waza](https://github.com/tw93/waza)
- Upstream Tools:
- X Access Support: [twitter-cli](https://github.com/public-clis/twitter-cli)
- Xiaohongshu Visit Support: [xiaohongshu-cli](https://github.com/jackwener/xiaohongshu-cli)
- Reddit Visit Support: [rdt-cli](https://github.com/public-clis/rdt-cli)
- Donors.
- [myself](https://github.com/shirumesu) Donated a complete human brain, effectively reducing token costs during development.
