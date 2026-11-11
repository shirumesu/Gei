<div align="center">

<img src="assets/icon.png" alt="Gei" width="160">

<h3>Gei ~ 芸</h3>

<p><sub>Small Skills for Codex and Claude Code, plus a knowledge store that lives outside the project</sub></p>

<p>
  <a href="https://github.com/shirumesu/Gei/releases"><img alt="Version" src="https://img.shields.io/github/v/release/shirumesu/Gei?label=Version&color=22B388"></a>
  <img alt="Host" src="https://img.shields.io/badge/Host-Codex%20%7C%20Claude%20Code-0F5C46">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/shirumesu/Gei?label=License&color=0F5C46"></a>
</p>

<h4>
  <a href="#installation">Installation</a> &nbsp;｜&nbsp;
  <a href="#components">Components</a> &nbsp;｜&nbsp;
  <a href="https://github.com/shirumesu/Gei/issues">Report an issue</a>
</h4>

English | [简体中文](README.md)

</div>

## Installation

### Buy it with Earth Online gold

Send this to your agent:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### Free install

<details>
<summary><b>Codex</b></summary>

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git
```

Then enable `gei` in Codex's plugin manager. Restart, and it takes effect in a new session.

</details>

<details>
<summary><b>Claude Code</b></summary>

```shell
/plugin marketplace add shirumesu/gei
/plugin install gei@gei-claude
```

</details>

<details>
<summary><b>Other tools that support Skills</b></summary>

Download [Gei-skills.zip](https://github.com/shirumesu/gei/releases/latest/download/Gei-skills.zip) and unzip it into the directory the tool reads Skills from, or clone it and update later with `git pull`:

```shell
git clone https://github.com/shirumesu/gei.git <skills-dir>/Gei
```

This gives you only the Skills, not the Hooks or the `gei memo` command.

</details>

<br>

## Components

### Skills

| Skill | What it does |
| --- | --- |
| consider | Before you start, judge whether it is worth doing, how to do it, and what the choice locks in |
| memo | Keep what the code cannot tell in plain Markdown: your preferences and corrections, recurring practices and pitfalls, and where reusable code already lives. Kept in a git repository and shared across machines and agents |
| diagnose | Get a command that reproduces the problem, find the root cause, then fix it |
| inspect | Review the change against the original request with a subagent in a fresh context. Invoke it manually |
| deslop | Strip the AI-generated look from a product that already has a design language: audit each screen for bold small text, meaningless color, sparkle icons, repeated status, and off-grid spacing; you pick item by item, and only the picks are applied and written back to the design docs |

### Hooks

| When | What it does |
| --- | --- |
| Session start | Syncs the memory store (commit local changes, pull, push), checks format and budgets, and injects a statement of purpose, the shared index, the project index and its reuse pointers |
| End of each turn | Commits, pulls and pushes when the store changed; failures are shown |

### Memory

Memory is a git repository at `~/.agents/geispec`, ideally a clone of your own private repository. Agents read and edit it with their own file tools; nothing is added to the project:

```text
AGENTS.md                      your standing instructions, loaded by Claude Code and Codex themselves
context/MEMORY.md              index of shared memory, injected
context/<topic>.md             one topic
projects/<project>/MEMORY.md   index of the current project's memory, injected
projects/<project>/<topic>.md  one topic
projects/<project>/MAP.md      reuse pointers, injected whole
```

It is all plain Markdown, readable and editable in an editor or on GitHub. An index line is `- [topic](topic.md) - when to read it`; the rule itself lives only in the topic file, with its reason (Why) and use (How to apply). A preference starts in its project and moves to `context/` only when you say it holds everywhere or it shows up in a second project. Each `MAP.md` line is a pointer, `- when you need X → path#symbol: one-line contract`; session start checks that each file and symbol still exists and leaves dead ones out. The injection has a hard budget of 100 lines and 8,000 characters.

There is one `AGENTS.md`: `~/.claude/CLAUDE.md` keeps the single line `@~/.agents/geispec/AGENTS.md`, and `~/.codex/AGENTS.md` links to the same file.

After installing the plugin, run this once per machine in a terminal (it shows each change and asks first):

```shell
node <gei>/bin/gei.mjs memo setup <your-private-repository-url>
```

`gei memo sync`, `lint` and `trace` (what a session was given and which memory files it read) are also there; `/gei:memo tidy` is the manual cleanup. See the [usage guide](docs/spec.md).

<br>

## Acknowledgments and license

- [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza)
- deslop is adapted from [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky; `skills/deslop/` stays under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Released under the [MIT](LICENSE) license. The update history is in [CHANGELOG.md](CHANGELOG.md).
