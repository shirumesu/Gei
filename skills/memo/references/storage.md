# Storage And Tools

Knowledge lives in `~/.agents/geispec` (override with `GEI_SPEC_HOME`), never in the source repository. Settings and caches live in `~/.agents/gei-state` (override with `GEI_SPEC_STATE`). The user can bind a private GitHub repository instead; then every `spec_edit` is one commit, and its history is the audit trail. Do not add AGENTS.md, local spec folders, or ignore rules for it.

## Scopes

- `projects/<project-name>/`: one project's `MEMORY.md`, `docs/`, `tasks/`, and the generated indexes.
- `context/`: shared memory and docs for every project.

The project name is the main repository root's directory name for Git repositories and linked worktrees, the common Git directory's name for separate metadata or bare repositories, and the directory name otherwise. It is normalized with Unicode NFKC, lowercase, whitespace to hyphens, other characters outside letters, numbers, dot, underscore, and hyphen to hyphens, and trimmed. Equal names share memory across machines and clones. When the name has no memory yet, the nearest parent directory below the home directory whose name has memory owns the workspace. The startup Hook records project roots in local state (`roots.json`) to keep that parent match from taking a same-named project in another directory.

## Tools

- `spec_read` reads paths from one snapshot and returns a revision.
- `spec_search` lists documents or finds literal lines.
- `spec_edit` saves one batch against that revision: entry operations on `MEMORY.md`, text operations on `docs/` and `tasks/`.

Errors:

- `REVISION_CONFLICT`: read the changed documents and reconcile.
- `NO_MATCH` / `AMBIGUOUS_MATCH`: reread the exact text.
- `MEMORY_FORMAT`: someone hand-edited `MEMORY.md` into an invalid shape; fix those lines with a text edit.
- `MEMORY_ENTRY`, `DUPLICATE_ENTRY`, `MEMORY_FULL`, `INDEX_FULL`, `FRONTMATTER`, `GENERATED`: the message says what to change.
- `SUBMISSION_UNCONFIRMED`: read the remote state before retrying.

Without MCP, run `node <memo>/scripts/spec/cli.mjs --help`. `read`, `search`, and `edit` take the same JSON through stdin or `--input FILE`. `show projects/<project>/` prints what a session receives. Plugin installs also expose `node <gei>/bin/gei.mjs spec ...`. Do not assume a global `gei` executable. If GitHub credentials are unavailable, explain the setup; never ask for a token in chat or switch storage mode on your own.
