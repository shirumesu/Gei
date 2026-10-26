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
| memo | Record and maintain the project's background, decisions, and handoffs |
| diagnose | Get a command that reproduces the problem, find the root cause, then fix it |
| inspect | Review the change against the original request with a subagent in a fresh context. Invoke it manually |

### Hooks

| When | What it does |
| --- | --- |
| Session start | Inject the current project's knowledge index and cross-project experience, without loading the document bodies. Show the result of the last background maintenance |
| Sending a message, the end of a reply, and the end of a session | Record the session and queue it for background maintenance |

Background maintenance uses the current tool's headless mode (`claude -p` or `codex exec`) to write what is worth keeping from the session into the knowledge store, without interrupting the session. Turn it off with `spec background off`.

### MCP

| Tool | What it does |
| --- | --- |
| `spec_read` | Read knowledge documents |
| `spec_search` | Search the knowledge store |
| `spec_edit` | Create or edit a knowledge document |
| `spec_check` | Check for broken links, unlinked topic notes, duplicate content, and stale sources |
| `spec_status` | Show where the knowledge store is and its status |

Knowledge is stored in `~/.agents/geispec` by default (override with `GEI_SPEC_HOME`), in directories named by project. You do not add any files to the project:

```text
projects/<project>/
  INDEX.md
  topics/<domain>/README.md
  topics/<domain>/notes/<note>.md
  tasks/INDEX.md
  tasks/<task>.md
context/
  INDEX.md
  notes/<lesson>.md
```

`spec_edit` rewrites that project's `INDEX.md` in the same save: one line per topic README, then at most five recent tasks. Every task is listed in `tasks/INDEX.md`, which is not injected. A heading and agreements outside the generated block can still be written by hand.

You can also store it in your own private GitHub repository. Tell the agent which repo to bind.

See the [usage guide](docs/spec.md).

<br>

## Acknowledgments and license

- [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza)
- Background maintenance references the Claude Code / Codex plugins from mem0 and OpenViking

Released under the [MIT](LICENSE) license. The update history is in [CHANGELOG.md](CHANGELOG.md).
