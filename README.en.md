<div align="center">

<img src="assets/icon.png" alt="Gei" width="160">

<h3>Gei ~ 芸</h3>

<p><sub>Small Skills for Codex and Claude Code, plus a knowledge store that lives outside the project</sub></p>

<p>
  <a href="https://github.com/shirumesu/Gei/releases"><img alt="Version" src="https://img.shields.io/github/v/release/shirumesu/Gei?label=Version&color=22B388"></a>
  <img alt="Host" src="https://img.shields.io/badge/Host-Codex%20%7C%20Claude%20Code-0F5C46">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/shirumesu/Gei?label=License&color=0F5C46"></a>
  <img alt="MCP" src="https://img.shields.io/badge/MCP-stdio-FF6B81">
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

This gives you only the Skills, not the Hooks or MCP.

</details>

<br>

## Components

### Skills

| Skill | What it does |
| --- | --- |
| consider | Before you start, judge whether it is worth doing, how to do it, and what the choice locks in |
| memo | Keep what the code cannot tell in plain Markdown, one file per memory: your preferences, recurring practices, pitfalls. Shared across machines and agents |
| diagnose | Get a command that reproduces the problem, find the root cause, then fix it |
| inspect | Review the change against the original request with a subagent in a fresh context. Invoke it manually |

### Hooks

| When | What it does |
| --- | --- |
| Session start | Three Hooks inject `AGENTS.md`, the shared memory, and the current project's memory. Empty ones inject nothing |

### MCP

| Tool | What it does |
| --- | --- |
| `spec_read` | Read memory |
| `spec_search` | Search memory |
| `spec_edit` | Edit, create, or delete memory files |

Memory is stored in `~/.agents/geispec` by default (override with `GEI_SPEC_HOME`). You do not add any files to the project:

```text
AGENTS.md                      your standing instructions, injected; agents change it only when you ask
context/MEMORY.md              index of shared memories, injected
context/<name>.md              one memory
projects/<project>/MEMORY.md   index of the current project's memories, injected
projects/<project>/<name>.md   one memory
```

It is all plain Markdown with no types or metadata, readable and editable on GitHub. `MEMORY.md` holds only index lines, `- [name](name.md) - when it applies; why`; every memory, however short, is its own file, so the injection stays small and the agent reads a memory when it needs it. Memory keeps only static facts with evidence behind them, never tasks or progress. Each injected file is capped near 9,500 characters; beyond that it is cut at a line and the agent is told to shorten it. `spec show projects/<project>/MEMORY.md` prints what a session actually receives.

You can also store it in your own private GitHub repository. Tell the agent which repo to bind.

See the [usage guide](docs/spec.md).

<br>

## Acknowledgments and license

- [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza)

Released under the [MIT](LICENSE) license. The update history is in [CHANGELOG.md](CHANGELOG.md).
