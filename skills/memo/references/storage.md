# Storage And Tools

Memory lives in `~/.agents/geispec` (override with `GEI_SPEC_HOME`), never in the source repository. Settings and caches live in `~/.agents/gei-state` (override with `GEI_SPEC_STATE`). The user can bind a private GitHub repository instead; then every `spec_edit` is one commit, and its history is the audit trail. Do not add local spec folders or ignore rules for it.

## Injection

Three SessionStart Hooks inject `AGENTS.md`, `context/MEMORY.md`, and the current project's `MEMORY.md`, each on its own and only when it has content. Each is cut at a line near 9,500 characters, with a notice, because Claude Code replaces hook text over 10,000 characters with a short preview.

## Project Names

The project name is the main repository root's directory name for Git repositories and linked worktrees, the common Git directory's name for separate metadata or bare repositories, and the directory name otherwise. It is normalized with Unicode NFKC, lowercase, whitespace to hyphens, other characters outside letters, numbers, dot, underscore, and hyphen to hyphens, and trimmed. Equal names share memory across machines and clones. When the name has no `MEMORY.md` yet, the nearest parent directory below the home directory whose name has one owns the workspace. The startup Hook records project roots in local state (`roots.json`) to keep that parent match from taking a same-named project in another directory.

## Tools

- `spec_read` reads paths from one snapshot and returns a revision.
- `spec_search` lists documents or finds literal lines.
- `spec_edit` saves one batch of text operations against that revision.

Errors:

- `REVISION_CONFLICT`: read the changed documents and reconcile.
- `NO_MATCH` / `AMBIGUOUS_MATCH`: reread the exact text.
- `SUBMISSION_UNCONFIRMED`: read the remote state before retrying.

Without MCP, run `node <memo>/scripts/spec/cli.mjs --help`. `read`, `search`, and `edit` take the same JSON through stdin or `--input FILE`. `show projects/<project>/MEMORY.md` prints what a session receives. Plugin installs also expose `node <gei>/bin/gei.mjs spec ...`. Do not assume a global `gei` executable. If GitHub credentials are unavailable, explain the setup; never ask for a token in chat or switch storage mode on your own.
