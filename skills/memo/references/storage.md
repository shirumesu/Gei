# Storage, Sync, Tools And Commands

## Where Things Live

```
~/.agents/gei-state/memo.db              this machine's SQLite database; the working copy of every entry
~/.agents/geispec/                       git clone of the user's private memory repository
  projects/<project>/entries.jsonl       snapshot of a project's entries (content), one line per entry, sorted by id
  projects/<project>/signals.tsv         snapshot of their strength (level, uses, losses, shadow, ...)
  projects/<project>/docs/               long documents, written with file tools
  context/entries.jsonl, signals.tsv     the shared scope, seen from every project
  context/docs/
  AGENTS.md                              the user's standing instructions; Gei does not inject it
```

The database is the source; the snapshots are generated from it and exist only to carry entries between machines. Never edit them: every sync puts them back as committed and then regenerates them. `memo` needs Node 22.13 or later (`node:sqlite`).

An entry has an id (five lowercase letters or digits), a scope, 1 to 6 keys, `when`, `do`, an optional `why` and `group`, an origin (user or agent, fixed at creation), a pin flag, and a state: active, deleted (kept so it can be restored and so another machine cannot bring it back), or shadow (evicted, still found by `find`). Strength is four integers: level 0 to 3 (user entries start at 2, agent entries at 1), uses (sessions that cited it), losses, and the time of the last change.

`~/.claude/CLAUDE.md` is the single line `@~/.agents/geispec/AGENTS.md`, and `~/.codex/AGENTS.md` is a symbolic link to it (a copy on Windows, refreshed by every sync).

## Sync

Merging is done by `memo`, not git. Each sync:

1. Puts the snapshot files in the working tree back as committed.
2. Commits other changes (`docs/`, `AGENTS.md`), fetches and rebases. When this machine and the remote changed the same lines of a hand-edited file, the rebase is aborted, nothing is pushed, and the message names the files; resolve by hand in the store (`git pull --rebase`).
3. Merges the snapshots (now the remote's latest) into the database: per entry, the newer `updated_at` wins the content and the other version goes into the local history; the newer strength wins the strength; entries the snapshot lacks are local and stay.
4. Exports the snapshots; when they changed, commits them alone and pushes.
5. When the push fails, undoes the snapshot commit (the database keeps everything); when the remote moved, starts again from step 2, at most three times.

No unpushed commit ever contains snapshot files, so a rebase never conflicts on them.

## Hooks

The hooks never hand the agent an entry or a tool manual; entries reach it only as results of the memo tools, which the user sees, and how to use each tool is in its description.

- **SessionStart** syncs, records the session's project, and injects two lines: what memory is, call `brief` first and `find` before each task, never touch the store's files.
- **PostToolUse** on `brief` and `find` records which entries the result showed (the lines that start with `[m:<id>]`, in order), so citations can count. The MCP server cannot do this itself: it outlives `/clear`, which starts a new session id, and a tool call carries no session id.
- **Stop** and **SubagentStop** count `[m:<id>]` citations in the final message and update strength, then sync when entries or hand-edited files changed, or when only strength changed and the last sync is more than 30 minutes old.

## Strength

A citation counts when the entry was shown earlier in the same session (by `brief` or `find`), once per session per entry: level becomes 3, uses goes up by one, losses reset, a shadow becomes active again. In the same `find` result, each entry ranked above a cited one takes one loss per session (pinned entries and `brief` lines never do); at `2 + floor(log2(uses + 1))` losses it drops a level. A delivery with no citation changes nothing. Past 300 active, unpinned agent entries in a scope, the weakest becomes a shadow: never-used ones oldest first, then lowest level, fewest uses, least recently used.

## Project Names

The project name is the main repository root's directory name for Git repositories and linked worktrees, the common Git directory's name for separate metadata or bare repositories, and the directory name otherwise. It is normalized with Unicode NFKC, lowercase, whitespace to hyphens, other characters outside letters, numbers, dot, underscore, and hyphen to hyphens, and trimmed. Equal names share memory across machines and clones. When the name has no entries and no directory under `projects/`, the nearest parent directory below home whose name has one owns the workspace; `~/.agents/gei-state/roots.json` keeps that from matching a same-named project elsewhere.

## Tools And Commands

The memo MCP server (`skills/memo/scripts/mcp.mjs`, declared in `.mcp.json` and the Codex manifest) has the agent's everyday tools: `brief`, `find`, `keys`, `show`, `put`, `wrong`, `del`. A refusal (a similar entry, a likely secret, a bad id) comes back as an error result with the reason. In Claude Code they are `mcp__plugin_gei_memo__<tool>`.

The shell command has all of them and the maintenance ones: `memo <command>` in Claude Code (the plugin's `bin/` is on PATH); `node "<gei>/bin/memo" <command>` elsewhere; `gei memo <command>` is the same set.

- `brief`: pinned entries, "look up when" lines for entries that were used before or that the user stated, and the common keys, at most 3,500 characters.
- `find <word> [word...]`: up to three entries from this project and the shared scope, each `[m:id] do (reason)`, and how many more matched. ASCII words match on word boundaries, CJK by containment; words are split on spaces and commas. Ranking, rule by rule: active before shadow; more query words matched (a word that matches more than max(8, 10% of entries) does not count unless every word does); key before when before do; more of the uncounted broad words; level; uses; most recently used; id.
- `keys [word]`: the common keys with entry counts; with a word, the keys that match it and the keys used beside them, which opens a broad key into the specific ones.
- `put`, with `--replace <id>`, `--new`, `--pin`, `--user`, `--shared`, `--group`, `--why`: see the skill. Refuses likely secrets, over-long fields, more than six keys, and (without `--replace` or `--new`) a `do` close to an active entry in the same scope that shares a key.
- `del`, `restore`, `pin`, `unpin`, `wrong`, `mv <id> --shared`, `show <id>`.
- `review`: the maintenance lists for `/gei:memo tidy`.
- `log [--session <id>]`: what a session was shown (`start` for `brief`, `find`; `prime` in sessions before the tools) and what it cited or lost.
- `sync`: what the hooks do, on demand.
- `setup [<repository-url>] [--yes]`: clone the repository (or create a local one), point `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` at the store's `AGENTS.md`, and update `~/.claude/settings.json`: allow `mcp__plugin_gei_memo__*`, `Bash(memo *)` and `Read(~/.agents/geispec/**/docs/**)`, remove the older whole-store Read and Edit rules and additional directory, and set `autoMemoryEnabled: false`. Each change is shown and confirmed. Codex in `workspace-write` mode needs the store and `~/.agents/gei-state` under `[sandbox_workspace_write] writable_roots`.

Never ask for a token in chat. If the remote rejects a push, explain the credential setup (`gh auth setup-git` or the system credential helper).
