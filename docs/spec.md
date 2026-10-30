# Spec storage and controls

Gei works locally. The plugin bundles a Node.js stdio MCP server; no hosted server, port, or Cloudflare account is needed. GitHub storage is optional and user-owned. Markdown lives in `AGENTS.md`, `context/`, and `projects/<project-name>/` in either mode.

## Settings

Run `node <gei>/bin/gei.mjs spec <command>` (plugin or source), or `node <memo>/scripts/spec/cli.mjs <command>` (Skills only). Both support `--help`; a source checkout also has `npm run spec -- <command>`. Nothing is added to PATH.

| Command | Effect |
| --- | --- |
| `status` | Show enablement, backend, binding, and cached connection status without contacting GitHub |
| `enable` / `disable` | Toggle knowledge injection and tool access; retain data and keep other Skills available |
| `connect github --repo owner/name` | Preview connecting a private repository and importing local documents |
| `connect github --repo owner/name --create` | Preview creation of a private repository in the authenticated personal account |
| Either connect command with `--apply` | Perform the selected connection/import after reviewing its scope |
| `use local` | Preview exporting the latest remote snapshot to the local store |
| `use local --apply` | Back up existing local Markdown outside the store, export, and change backend |
| `use local --cached-revision REV --apply` | Explicitly export a fully cached revision when offline; never silently select an old snapshot |
| `refresh` | Fetch the current complete snapshot, including bodies for offline reading |
| `show PATH` | Print what a session receives for `AGENTS.md`, `context/MEMORY.md`, or `projects/<name>/MEMORY.md` |
| `login` | Show authentication setup instructions |

GitHub credentials come from `GEI_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, `gh auth token`, or the Git credential helper, in that order; an invalid environment token must be fixed or removed. The token needs content read/write, plus repository creation for `--create`. The CLI never prints or saves credentials. `--branch` selects an existing branch instead of the default.

Connecting is a one-time user choice of account, repository, and upload scope. The preview lists upload paths and divergent local/remote documents; resolve those before retrying, since connection never picks a whole-file winner. CRLF/LF differences count as equal and keep the remote bytes; other differences are conflicts (edits still match exactly). The mode changes only after remote verification. To connect another repository, switch to local first. A second device authenticates and connects the same repository explicitly; names are never guessed from the code remote.

Local knowledge defaults to `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. Settings, snapshots, revision references, and locks live separately under `~/.agents/gei-state/<store-path-hash>`; `GEI_SPEC_STATE` overrides that directory. The hash is not a project identity. Do not sync this directory or put it in a knowledge repository. Backend changes keep the enabled/disabled setting.

In GitHub mode, after verifying migration and saving any later local-only files, the old local knowledge directory can be removed; nothing recreates it until you switch back to local. Keep the state directory (binding and offline cache) and the same `GEI_SPEC_HOME` value, which still selects that state. Before deleting a former Git checkout, separately save repository metadata, untracked non-Markdown files, and unpushed branches.

## Daily use

```text
AGENTS.md                      the user's standing instructions, injected;
                               agents change it only on the user's explicit request
context/MEMORY.md              memory for every project, injected
context/<name>.md              one memory too long for a line, linked from MEMORY.md
projects/<project>/MEMORY.md   memory for one project, injected
projects/<project>/<name>.md
```

Everything is plain Markdown without frontmatter. `MEMORY.md` holds one memory per line, e.g. `- when X → do Y (because Z)` or short key-value pairs; a procedure that does not fit a line gets its own file and a linking line. The tools check paths and revisions, never content. The Memo skill holds the rules for what qualifies and how to write it.

- `spec_read`: read up to 20 paths from one revision, default 200 lines per file and a shared 48 KB content budget. Content is raw Markdown; line numbers are physical. Set `line_numbers: true` for range edits. Truncated files include `next_read` arguments pinned to the snapshot.
- `spec_search`: literal, case-insensitive search across full Markdown, or path enumeration with an empty query. Follow `next_search` for fixed-revision pagination.
- `spec_edit`: a base revision, a one-line summary, and up to 100 operations in order. `replace`, `replace_lines`, `create`, `rename`, and `delete` change any document. Ranges refer to the base snapshot and must not mix with other operations on the same file. On `REVISION_CONFLICT`, reread and reconcile. On `SUBMISSION_UNCONFIRMED`, read before retrying because the write may have persisted. `applied=false` with `unchanged=true` is a successful no-op.

`show projects/<project>/MEMORY.md` (or `show AGENTS.md`, `show context/MEMORY.md`) prints exactly what a session receives. The CLI accepts the same read/search/edit JSON on stdin or `--input FILE`.

Revision references such as `r_0123456789abcdef` map to an immutable version in local state and belong to the active binding. Use the reference from the read that informed the change; if it is lost, reread.

Local success means the Markdown was saved; no Git commit is made. GitHub success means one remote commit per save, returned with revision and URL; the repository history is the audit trail and the way to undo a change.

## Consistency and failures

Each edit checks the whole-store base revision. A change to any knowledge document rejects a stale local edit; GitHub checks the branch head. This is deliberate: a document read as a premise may have changed even if the edited file did not. Reread and reconcile before retrying; do not just substitute a newer revision.

All edit operations validate before publication. Local tools and Hooks share a process lock and recover an interrupted transaction before exposing documents. Batches are complete only through the runtime; other filesystem readers may see partial publication and native editors bypass concurrency checks, so keep all writers on the tools. GitHub publishes a batch in one commit using `expectedHeadOid`. Case-colliding paths and symbolic-link documents are rejected for portable storage.

Three SessionStart Hooks inject `AGENTS.md`, `context/MEMORY.md`, and the current project's `MEMORY.md`, each as its own hook output and only when it has content. Claude Code replaces any hook text over 10,000 characters with a file path and a 2,000-character preview, and Codex spills hook context over its per-hook limit (raised to 8,000 tokens in `codex-hooks.json`). Each output is therefore cut at a line near 9,500 characters, ending with a notice that names the file to read and shorten. Hooks use a 60-second head cache and fetch only their own file. They wait up to four seconds for a concurrent Spec operation; unavailable connections use cached files. `refresh` downloads all bodies for offline access.

GitHub mode has no offline write queue and never falls back to a writable local master. A lost submission response is checked against the remote content before reporting verified success. If verification is also unavailable, `SUBMISSION_UNCONFIRMED` asks the caller to read the latest documents before retrying. Semantic contradictions are Memo's job.

Disabling Spec stops memory Hooks and read/search/edit access. Status and settings remain available, and Consider still works. The change applies to later operations; already-injected messages remain.

See [tool design](spec-tools.md) and [installation](install.md).
