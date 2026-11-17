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

This gives you only the Skills, not the Hooks, the memo tools or the `memo` command, so there is no memory.

</details>

<br>

## Components

### Skills

| Skill | What it does |
| --- | --- |
| consider | Before you start, judge whether it is worth doing, how to do it, and what the choice locks in |
| memo | Keep what the code cannot tell as a table of short entries: your preferences and corrections, and pitfalls that will recur. Stored in a local database and synced across machines and agents through a git repository; agents look entries up and save them with the plugin's memo tools, and you see every call and its result |
| diagnose | Get a command that reproduces the problem, find the root cause, then fix it |
| inspect | Review the change against the original request with a subagent in a fresh context. Invoke it manually |
| deslop | Strip the AI-generated look from a product that already has a design language: audit each screen for bold small text, meaningless color, sparkle icons, repeated status, and off-grid spacing; you pick item by item, and only the picks are applied and written back to the design docs |

### memo tools

The plugin brings a local MCP server; agents read and write memory through it, and each call and its result shows in the conversation:

| Tool | What it does |
| --- | --- |
| `brief` | Called once before the first task of a session: pinned entries, the situations worth a lookup, the common keys, at most 3,500 characters |
| `find` | Before each task, a lookup by a few words; at most three entries |
| `keys`, `show` | The keys; one entry with every field and its revision history |
| `put`, `wrong`, `del` | Save or revise an entry (a similar one is refused until the agent chooses to replace it or add a new one); mark one wrong; delete one |

### Hooks

The Hooks put no entries into the context. They only do this:

| When | What it does |
| --- | --- |
| Session start | Syncs the memory store and puts in two lines of basic use |
| After `brief` or `find` | Records which entries the agent was shown |
| End of each turn (subagents too) | Counts which entries the reply cited and updates their strength; syncs when something changed, and shows any failure |

### Memory

Memory is a table of short entries. Each has 1 to 6 keys, the situation it applies to (`when`), what to do (`do`, at most 300 characters) and its source (`why`). The working copy is a SQLite file on this machine, `~/.agents/gei-state/memo.db`; `~/.agents/geispec` is a git repository, ideally a clone of your own private one, that carries the entries to your other machines. Nothing is added to the project:

```text
~/.agents/geispec/
  AGENTS.md                           your standing instructions, loaded by Claude Code and Codex themselves
  projects/<project>/entries.jsonl    snapshot of one project's entries, one line each
  projects/<project>/signals.tsv      snapshot of their strength
  projects/<project>/docs/            long documents that do not fit in an entry
  context/                            the shared scope, same layout
```

Agents read and write only through the memo tools, never the store's files. Entries arrive only when the agent calls `brief` or `find`, each with a ceiling on what it returns, so the context they take does not grow with the number of entries.

Strength does not use the calendar. An agent that acts on an entry cites it as `[m:<id>]` and the entry rises to the top level; an entry that ranked above a cited one in the same lookup and was not used takes a loss, and after enough losses drops a level, more slowly the more it has been used. Past the capacity the weakest entry becomes a shadow: still found by a lookup, and restored when it is used. Entries you stated and pinned entries are never evicted.

On sync, `memo` merges two machines' entries one by one (the later change to an entry wins), so there is no conflict for you to resolve; `docs/` and `AGENTS.md` are ordinary files and go through git as usual.

There is one `AGENTS.md`: `~/.claude/CLAUDE.md` keeps the single line `@~/.agents/geispec/AGENTS.md`, and `~/.codex/AGENTS.md` links to the same file.

After installing the plugin, run this once per machine in a terminal (it needs Node.js 22.13 or newer, shows each change and asks first):

```shell
node <gei>/bin/gei.mjs memo setup <your-private-repository-url>
```

The `memo` command in a terminal has every tool plus `memo pin`, `memo restore`, `memo review` (entries never used, possible duplicates, searches that keep finding nothing), `memo log` (what a session was given and cited) and `memo sync`; `/gei:memo tidy` is the manual cleanup. See the [usage guide](docs/spec.md).

<br>

## Acknowledgments and license

- [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza)
- deslop is adapted from [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky; `skills/deslop/` stays under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Released under the [MIT](LICENSE) license. The update history is in [CHANGELOG.md](CHANGELOG.md).
