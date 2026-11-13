# Memory storage and sync

Gei's memory is a table of short entries. The working copy is a SQLite database on each machine; a git clone of a private repository you own carries the entries between machines. Agents read and write through one command, `memo`, and never open the store's files. There is no server and no MCP.

## Layout

```text
~/.agents/gei-state/memo.db              this machine's database: every entry, its strength, its history
~/.agents/geispec/                       git clone of your private memory repository
  projects/<project>/entries.jsonl       snapshot of a project's entries, one line each, sorted by id
  projects/<project>/signals.tsv         snapshot of their strength
  projects/<project>/docs/               long documents, plain Markdown
  context/entries.jsonl, signals.tsv     the shared scope, seen from every project
  context/docs/
  AGENTS.md                              your standing instructions, loaded by Claude Code and Codex themselves
```

The database is the source. The snapshot files are generated from it on every sync, so the same database always produces the same text and the repository's history shows every change to an entry. Do not edit them by hand: the next sync overwrites them.

`AGENTS.md` is the one copy of your instructions: `~/.claude/CLAUDE.md` holds the single line `@~/.agents/geispec/AGENTS.md`, and `~/.codex/AGENTS.md` is a symbolic link to the file (a copy on Windows, refreshed on every sync).

## An entry

| Field | Meaning | Limit |
| --- | --- | --- |
| id | Five lowercase letters or digits, assigned by `memo` | |
| keys | The literal things that will show up again (tool, command, file, error text, service) plus a broad one | 1 to 6, 24 characters each |
| when | The situation in which it applies | 60 characters |
| do | What to do; the text an agent is shown | 300 characters |
| why | The source and reason; shown by `memo show` | 200 characters |
| origin | Said by the user, or judged by the agent | fixed at creation |
| pin | Its `do` opens every session; never weakens, never evicted | 8 per scope, `do` at most 160 characters |

Anything longer than an entry is a Markdown file under `docs/` with one entry pointing at it. What earns an entry and how to write one is in the [memo skill](../skills/memo/SKILL.md).

## Setup

Run once per machine, in a terminal. It needs Node.js 22.13 or newer.

```shell
node <gei>/bin/gei.mjs memo setup <private-repository-url>
```

It shows each change and asks before applying it (`--yes` applies all):

1. Clone the repository into `~/.agents/geispec`, or create a local repository when no URL is given. An existing folder without git is left alone and setup stops; move it aside first.
2. Replace `~/.claude/CLAUDE.md` with the import line. If the store has no `AGENTS.md` yet, the current content moves into it; if both have different content, setup stops so you can merge them.
3. Link `~/.codex/AGENTS.md` to the store's `AGENTS.md`, stopping if it has instructions of its own.
4. Update `~/.claude/settings.json`: allow `Bash(memo *)` so the command runs without a prompt, allow reading the store's `docs/` directories, remove the whole-store Read and Edit rules an earlier version added, and set `autoMemoryEnabled: false` so Claude Code's own memory does not split notes off into a store other agents cannot see.

For Codex in `workspace-write` mode, setup prints the `writable_roots` entries to add to `~/.codex/config.toml` (the store and `~/.agents/gei-state`). It finally checks that the remote answers without a prompt; the hooks use your normal git credentials.

## What a session receives

Memory enters a session only at its start. After that the agent looks things up itself.

| When | What |
| --- | --- |
| Session start | At most 3,500 characters, whatever the number of entries: how to use `memo`, the pinned entries, "look up when" lines for entries that were used before or that you stated, and up to 30 keys chosen to cover the most entries |
| The first prompt, and the first after compaction | Up to three entries whose keys or `when` share two or more words with the prompt. Anything weaker adds nothing |
| A subagent's start | The same session-start text |
| `memo find <word> ...` | Up to three entries, each one line with the reason it ranked, and how many more matched |

`find` ranks by fixed rules, each deciding only when the ones before it tie: active before shadow; more of the query's words matched (a word that matches more than max(8, 10% of the entries) is not counted unless every word is like that); a match in a key before one in `when` before one in `do`; more of the uncounted broad words; level; uses; most recently used.

## Strength and forgetting

Nothing here uses the calendar: a project left alone for months loses nothing.

- An agent that acts on an entry cites it as `[m:<id>]`. A citation of an entry delivered earlier in the same session sets its level to 3 and adds one use, once per session.
- An entry takes a loss only when it was delivered, another entry of the same delivery was cited, and it ranked above that one. After `2 + floor(log2(uses + 1))` losses it drops a level, so the more an entry has been used, the slower it sinks.
- A delivery in which nothing was cited changes nothing.
- `memo wrong <id>` sets the level to 0; marking an entry that is already at 0 deletes it. `memo put --replace <id>` is a revision and keeps the level and uses.
- Level only orders results. Entries leave the session-start text and the automatic match only by eviction: past 300 active, unpinned, agent-origin entries in a scope, the weakest becomes a shadow. `find` still returns shadows, and a citation brings one back. Entries you stated are never evicted.

## Sync

Merging is done by `memo`, not by git:

1. The snapshot files in the working tree are put back as committed.
2. Other changes (`docs/`, `AGENTS.md`) are committed, fetched and rebased as ordinary files. When this machine and the remote changed the same lines of one, the rebase is aborted, nothing is pushed, and the message names the files: resolve it with `git pull --rebase` in the store.
3. The snapshots, now the remote's latest, are merged into the database entry by entry: the newer content wins and the other version is kept in the local history; the newer strength wins. A deletion is a state of the entry, so another machine cannot bring it back.
4. The snapshots are exported; when they changed they are committed alone and pushed.
5. When the push fails, that commit is undone (the database keeps everything); when the remote moved, the sync starts again, at most three times.

Session start always syncs. The end of a turn syncs when entries or hand-edited files changed, or when only strength changed and the last sync is more than 30 minutes old. Any failure is shown to you.

## Project names

The project name is the main repository root's directory name for Git repositories and linked worktrees, the common Git directory's name for separate metadata or bare repositories, and the directory name otherwise, normalized to lowercase with hyphens. Equal names share memory across machines and clones. When a workspace's own name has no memory, the nearest parent directory below home whose name has some owns it; `~/.agents/gei-state/roots.json` records project roots so that match does not take a same-named project elsewhere.

## Commands

`memo <command>` in Claude Code, where the plugin's `bin/` is on PATH; `node <gei>/bin/memo <command>` elsewhere. `gei memo <command>` is the same set.

| Command | Effect |
| --- | --- |
| `find <word> [word...]` | Look entries up in this project and the shared scope |
| `keys [word]` | The common keys; with a word, the keys that match it and the keys used beside them |
| `put --keys ... --when ... --do ... [--why ...]` | Save an entry. `--user`: you said it. `--shared`: every project. `--pin`. Refuses likely secrets and over-long fields; when a similar entry exists it prints it and asks for `--replace <id>` or `--new` |
| `del`, `restore`, `pin`, `unpin`, `wrong`, `mv <id> --shared` | Manage one entry by id |
| `show <id>` | Every field, the strength and the revision history |
| `review` | Entries worth a look: never used, at level 0, deleted as wrong, possible duplicates, brought back from shadow, and searches that keep finding nothing |
| `log [--session <id>]` | What a session was given and what it cited |
| `sync` | Sync now |
| `setup [<url>] [--yes]` | The setup above |

## When memory misleads

`memo log --session <id>` shows which entries a session was given and which it cited. `memo show <id>` gives an entry's source and history. Fix the entry with `memo put --replace <id>`, mark it with `memo wrong <id>`, or remove it with `memo del <id>`; `/gei:memo tidy` walks through `memo review` with you.

See [installation](install.md).
