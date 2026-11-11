# Memory storage and sync

Gei's memory is a folder of Markdown files at `~/.agents/geispec`, a git clone of a private repository you own. Agents read and edit it with their own file tools; two Hooks keep it in sync with git. There is no server, MCP, or database. Without a remote the folder is a local git repository; a folder without git also works and is simply never synced.

## Layout

```text
AGENTS.md                      your standing instructions, loaded by Claude Code and Codex themselves
context/MEMORY.md              index of shared memory, injected
context/<topic>.md             one shared topic
projects/<project>/MEMORY.md   index of one project's memory, injected
projects/<project>/<topic>.md  one topic
projects/<project>/MAP.md      reuse pointers, injected whole
```

Everything is plain Markdown without frontmatter. A `MEMORY.md` line is `- [<topic>](<topic>.md) - <when to read it>`; the rule itself is only in the topic file, with its Why and How to apply. A `MAP.md` line is `- <when you need X> → <path>#<symbol>: <one-line contract>`. What belongs in memory and how to write it is in the [memo skill](../skills/memo/SKILL.md).

`AGENTS.md` is the one copy of your instructions: `~/.claude/CLAUDE.md` holds the single line `@~/.agents/geispec/AGENTS.md`, and `~/.codex/AGENTS.md` is a symbolic link to the file (a copy on Windows, refreshed on every sync). Edits from any machine or agent reach the others through git and take effect in their next session.

## Setup

Run once per machine, in a terminal:

```shell
node <gei>/bin/gei.mjs memo setup <private-repository-url>
```

It shows each change and asks before applying it (`--yes` applies all):

1. Clone the repository into `~/.agents/geispec`, or create a local repository when no URL is given. An existing folder without git is left alone and setup stops; move it aside first.
2. Replace `~/.claude/CLAUDE.md` with the import line. If the store has no `AGENTS.md` yet, the current content moves into it; if both have different content, setup stops so you can merge them.
3. Link `~/.codex/AGENTS.md` to the store's `AGENTS.md`, stopping if it has instructions of its own.
4. Add to `~/.claude/settings.json`: `permissions.additionalDirectories` and `Read`/`Edit` allow rules for the store, so every project can use it without prompts, and `autoMemoryEnabled: false`, so Claude Code's own memory does not split notes off into a store other agents cannot see. Move any notes from `~/.claude/projects/*/memory/` first.

For Codex in `workspace-write` mode, setup prints the `[sandbox_workspace_write] writable_roots` entry to add to `~/.codex/config.toml`. It finally checks that the remote answers without a prompt; the hooks use your normal git credentials (`gh auth setup-git` or the system credential helper).

## Sync

- **Session start** commits local changes, pulls with rebase and pushes, then lints and injects.
- **End of each turn** (the Stop Hook, in Claude Code and Codex) does nothing when the store is clean and pushed; otherwise it commits, pulls and pushes.
- Any failure is shown to you. Unpushed commits go out at the next sync. When this machine and the remote changed the same lines, the rebase is aborted, nothing is pushed, and the message names the files: resolve it with `git pull --rebase` in the store.
- A turn that is killed before its Stop Hook runs is published at the next session start on that machine.

Every sync is an ordinary commit, so `git log` in the store shows which machine changed what and when, and `git revert` undoes it.

## What a session receives

Session start injects, in this order and within these budgets:

| Part | Limit |
| --- | --- |
| A short statement of what memory is for and its safety rules, including that the current code and the user's current words win over a note | 10 lines |
| `context/MEMORY.md` | 20 lines |
| The project's `MEMORY.md` | 30 lines |
| The project's `MAP.md`, live pointers only | 40 lines |
| All together | 100 lines and 8,000 characters; 150 characters per line |

Lint runs at the same time: index lines that do not parse, links to missing files, topic files without an index line, lines and files over budget, and dead pointers. A pointer is dead when its file is missing from the current checkout or no longer contains its symbol; dead pointers are left out of the injection. Problems are listed at the end of the injected text and summarized in a message to you.

## Project names

The project name is the main repository root's directory name for Git repositories and linked worktrees, the common Git directory's name for separate metadata or bare repositories, and the directory name otherwise, normalized to lowercase with hyphens. Equal names share memory across machines and clones. When a workspace's own name has no memory, the nearest parent directory below home whose name has some owns it; `~/.agents/gei-state/roots.json` records project roots so that match does not take a same-named project elsewhere.

## Commands

`node <gei>/bin/gei.mjs memo <command>`; nothing is added to PATH. A source checkout also has `npm run memo -- <command>`.

| Command | Effect |
| --- | --- |
| `setup [<url>] [--yes]` | The setup above |
| `sync` | Commit, pull and push now |
| `lint` | Lint every scope, and the current project's pointers against this checkout; exits 1 on problems |
| `trace [<session-id>]` | What a Claude Code session in the current directory was given and which memory files it read, wrote or searched, by step (default: the latest session) |
| `trace --usage` | Reads per memory file across all Claude Code transcripts, least recently read first: the candidates for removal |

`trace` reads Claude Code's transcripts in `~/.claude/projects/`; their format is not a documented interface, and Codex transcripts are not supported yet.

## When memory misleads

Because an index line only says when to read a file, a rule can act only after a read, and reads are in the transcript. To find out whether a note caused a mistake: run `trace` for that session, take the notes it read, copy the store without the suspect note, and rerun the same prompt. `/gei:memo tidy` then edits or removes the note, one commit per run.

See [installation](install.md).
