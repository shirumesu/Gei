# Storage, Sync And Commands

## The Store

Memory lives in `~/.agents/geispec`, a git clone of the user's private memory repository. Without a remote it is a local git repository; a directory without git also works and is simply not synced. Local state (`roots.json`, see below) lives in `~/.agents/gei-state`. Nothing goes in the source repository.

Claude Code needs the store allowed from every project: `gei memo setup` adds `permissions.additionalDirectories` and `Read`/`Edit` allow rules for it to `~/.claude/settings.json`. Codex in `workspace-write` mode needs the store under `[sandbox_workspace_write] writable_roots` in `~/.codex/config.toml`.

`AGENTS.md` in the store is the user's standing instructions. `~/.claude/CLAUDE.md` is the single line `@~/.agents/geispec/AGENTS.md`, and `~/.codex/AGENTS.md` is a symbolic link to it (a copy on Windows, refreshed by every sync). Gei does not inject it.

## Hooks

- **SessionStart** commits local changes, pulls with rebase and pushes; then lints and injects the header, `context/MEMORY.md`, the project's `MEMORY.md` and its live `MAP.md` pointers, followed by any problems. A sync failure is shown to the user and the session works from the local copy.
- **Stop**, at the end of every turn, does nothing when the store is clean and pushed. Otherwise it commits, pulls and pushes, and shows any failure; unpushed commits go out at the next sync.
- When local and remote changed the same lines, the rebase is aborted, nothing is pushed, and the message names the files. Resolve it by hand in the store (`git pull --rebase`).

## Project Names

The project name is the main repository root's directory name for Git repositories and linked worktrees, the common Git directory's name for separate metadata or bare repositories, and the directory name otherwise. It is normalized with Unicode NFKC, lowercase, whitespace to hyphens, other characters outside letters, numbers, dot, underscore, and hyphen to hyphens, and trimmed. Equal names share memory across machines and clones. When the name has no directory under `projects/`, the nearest parent directory below home whose name has one owns the workspace. Session start records project roots in `~/.agents/gei-state/roots.json` so that parent match does not take a same-named project elsewhere.

`MAP.md` pointers are checked against the current checkout, so a worktree on another branch sees the pointers that hold there.

## Commands

Run `node <gei>/bin/gei.mjs memo <command>`; do not assume a global `gei` executable. Skills-only installs have no hooks or commands; sync the store with git by hand there.

- `setup [<repository-url>] [--yes]`: clone the repository (or create a local one), point `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` at the store's `AGENTS.md`, and add the settings above, including `autoMemoryEnabled: false`. Each change is shown and confirmed; it stops instead of overwriting instructions or a non-git directory.
- `sync`: what the hooks do, on demand.
- `lint`: index format, links and orphans, budgets, and the current project's pointers.
- `trace [<session>]`: what a Claude Code session in this directory was given and which memory files it read, written or searched, by step. `trace --usage` counts reads per file across all transcripts, least recently read first. It reads Claude Code transcripts only; their format is undocumented.

Never ask for a token in chat. If the remote rejects a push, explain the credential setup (`gh auth setup-git` or the system credential helper).
