# Spec storage and controls

Gei works locally. The plugin bundles a Node.js stdio MCP server; no hosted server, port, or Cloudflare account is needed. GitHub storage is optional and user-owned. Markdown lives under `projects/<project-name>/` and `context/` in either mode.

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
| `login` | Show authentication setup instructions |

GitHub credentials come from `GEI_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, `gh auth token`, or the Git credential helper, in that order; an invalid environment token must be fixed or removed. The token needs content read/write, plus repository creation for `--create`. The CLI never prints or saves credentials. `--branch` selects an existing branch instead of the default.

Connecting is a one-time user choice of account, repository, and upload scope. The preview lists upload paths and divergent local/remote documents; resolve those before retrying, since connection never picks a whole-file winner. CRLF/LF differences count as equal and keep the remote bytes; other differences are conflicts (edits still match exactly). The mode changes only after remote verification. To connect another repository, switch to local first. A second device authenticates and connects the same repository explicitly; names are never guessed from the code remote.

Local knowledge defaults to `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. Settings, snapshots, revision references, locks, and backups live separately under `~/.agents/gei-state/<store-path-hash>`; `GEI_SPEC_STATE` overrides that directory. The hash is not a project identity. Do not sync this directory or put it in a knowledge repository. Backend changes keep the enabled/disabled setting.

In GitHub mode, after verifying migration and saving any later local-only files, the old local knowledge directory can be removed; nothing recreates it until you switch back to local. Keep the state directory (binding and offline cache) and the same `GEI_SPEC_HOME` value, which still selects that state. Before deleting a former Git checkout, separately save repository metadata, untracked non-Markdown files, and unpushed branches.

## Daily use

Hooks identify the project and inject its INDEX. Tools take knowledge-relative paths such as `projects/example/INDEX.md`, never a repository address or token. MCP, CLI, and Hooks share one core and coordinate through the runtime state directory.

- `spec_read`: read up to 20 paths from one revision, default 200 lines per file and a shared 48 KB content budget; unused short-document allowance is redistributed. Each file starts with an extracted overview (title, opening prose, missing-description flag; never a summary) and `body_start_line`, the first line after YAML frontmatter. The window starts at line 1. Set `line_numbers: true` before range edits. Truncated files include `next_read` arguments pinned to the snapshot.
- `spec_search`: literal, case-insensitive text search across the full Markdown, including frontmatter, or document enumeration with an empty query. Enumeration shows overviews in navigation order: INDEX, topic README owners, other documents, then notes, by path. Follow `next_search` to paginate (`offset` past the first page requires `revision`). The default scope is `projects/`; pass a project or `context/` explicitly. Empty results do not prove a requirement is absent.
- `spec_edit`: submit a base revision, one-line summary, and a batch of operations. `replace` takes unique exact old/new text for small changes. `replace_lines` takes inclusive 1-based `start_line`, `end_line`, and `new_text` for larger sections. Ranges refer to the base snapshot; ranges on one file must not overlap or mix with other operation types on that file. Other operations run in order. `create` supplies a complete document and rejects a likely duplicate in the same project, returning the existing paths; `delete` removes one. Every document except a path ending in `/INDEX.md` (including `tasks/INDEX.md`) needs frontmatter with `type`, a one-line `description` and, for `tasks`, `status` (see [frontmatter](maintenance.md#frontmatter)); a batch that breaks this is rejected and nothing is written. In the same save, `spec_edit` rewrites `projects/<name>/INDEX.md` and `projects/<name>/tasks/INDEX.md` (shared: `context/INDEX.md` and `context/tasks/INDEX.md`). The generated block sits between `<!-- gei:index start -->` and `<!-- gei:index end -->`. INDEX lists each `topics/<domain>/README.md` as `[title](path): description`, then a `## tasks` group of at most 5 tasks (`ProjectIndex.TASKS_IN_INDEX`) with status, newest first. Local mode orders tasks by knowledge-file mtime. GitHub mode orders them by the committer time of the last commit that touched the file. No `updated` field is stored. When more tasks exist, the block adds `更多任务 N 个，见 [tasks/INDEX.md](tasks/INDEX.md)`. `tasks/INDEX.md` lists every task the same way and is not injected. Sub-notes are not catalog lines. `context/INDEX.md` lists topic READMEs when that scope has one, and otherwise lists `context/notes/` grouped by type. The title is the first ATX H1 (`# `) outside fenced code and HTML comments, the same heading `spec_read` extracts, else the filename stem. A `<!--` in the title or description is neutralized until it cannot open a comment, and backslashes are escaped. Descriptions drop `[` and `]`. U+0085, U+2028, and U+2029 fold into spaces. Text outside a matched pair of markers (purpose, agreements) is preserved; edits inside are overwritten. A start marker with no end marker after it is the generated block through the end of the file; text before that start is kept, and an end marker that appears only before the start does not close the block. Returned `paths` includes the index when its bytes change.
- `spec_status`: inspect configuration or diagnose connectivity; ordinary reads and edits do not require it first.
- `spec_check`: return a bounded mechanical worklist of broken references, topic notes not linked from their README (`orphan_note`), duplicate prose, and source drift. Candidates request investigation, not deletion, and zero candidates is not approval. Follow `next_check` for more; use paginated enumeration for a complete audit.

All coordinates are physical lines of the stored Markdown; frontmatter is ordinary editable text. The overview's missing-description flag means no opening prose, not a missing frontmatter `description`. There is no lifecycle field or review batch. See [maintenance](maintenance.md) for check signals and `sources`, and [tool design](spec-tools.md) for duplicate matching.

The CLI accepts the same read/search/edit JSON on stdin or `--input FILE`, with the same validation and error codes. Exact replacement preserves line endings, Unicode, quotes, and backslashes. There is no replace-all or fuzzy matching.

Revision references such as `r_0123456789abcdef` (18 characters) map to an immutable version in local state, survive restarts, and belong to the active binding. Older full revision strings stay valid for their binding. Use the reference from the read that informed the change; if it is lost or unmapped, reread. There is no implicit "last read".

For a range edit, read with line numbers, then send, for example:

```json
{
  "base_revision": "r_0123456789abcdef",
  "summary": "Clarify the deployment steps",
  "edits": [{
    "op": "replace_lines",
    "path": "projects/example/INDEX.md",
    "start_line": 12,
    "end_line": 18,
    "new_text": "Updated first line.\nUpdated second line."
  }]
}
```

Empty `new_text` deletes the lines. New text uses the replaced block's newline style (else the document's first newline, else LF) and keeps whether the block ended in a newline; one trailing newline in `new_text` is ignored. Finish reading a partially shown long line before replacing it. `NO_MATCH`, `AMBIGUOUS_MATCH`, and range errors return a bounded numbered view of the base and a pinned `read` request; they never apply a nearby edit.

Local success means the Markdown was saved; no Git commit is made. GitHub success means a remote commit, returned with revision and URL; do not push again. A local Git repository may stay as an archive, but do not edit files or sync Git alongside tool transactions. GitHub mode leaves the old local directory untouched.

## Consistency and failures

Each edit checks the whole-store base revision. A change to any knowledge document rejects a stale local edit; GitHub checks the branch head. This is deliberate: a document read as a premise may have changed even if the edited file did not. Reread and reconcile before retrying; do not just substitute a newer revision.

All edit operations validate before publication. Local tools and Hooks share a process lock and recover an interrupted transaction before exposing documents. Batches are complete only through the runtime; other filesystem readers may see partial publication and native editors bypass concurrency checks, so keep all writers on the tools. GitHub publishes a batch in one commit using `expectedHeadOid`. Case-colliding paths and symbolic-link documents are rejected for portable storage.

Hooks inject INDEX bodies in both modes. HTML comments, including the catalog markers, are stripped first; the body, hand-written header included, is capped at 3 KiB (3072 bytes) for a project and 1 KiB (1024) for shared, with whole-output caps of 4096 and 1536. An over-cap body is clipped on a complete line and the hook names the index path; the stored catalog stays complete. Hooks use a 60-second head cache and fetch only INDEX bodies. Knowledge hooks wait up to four seconds for a concurrent Spec operation; both host configurations allow ten seconds for lock acquisition and remote loading. Refresh checks have short timeouts; unavailable connections use available cached indexes with explicit status. A new snapshot does not combine an older cached body with a newer index. Missing, uncached bodies require connectivity. `refresh` deliberately downloads all bodies for offline access.

GitHub mode has no offline write queue and never falls back to a writable local master. A lost submission response is checked against the remote content before reporting verified success. If verification is also unavailable, `SUBMISSION_UNCONFIRMED` asks the caller to read the latest documents before retrying. Semantic contradictions are Memo's job.

`background on|off` controls post-session maintenance (on by default). Prompt, Stop, and SessionEnd Hooks append the user's prompts and the agent's final replies to `memo/sessions/` under the state directory, then queue a handoff in `memo/pending/` and start a detached worker. An idle handoff waits 15 minutes and is replaced by each later Stop; SessionEnd and long sessions run at once. The worker runs `claude -p` with only the Spec MCP and read tools, or `codex exec` in a read-only sandbox, using the session's model when the Hook or transcript names it and the host default otherwise. A worker environment flag keeps its own run unrecorded. SessionStart retries stale or failed handoffs (at most three attempts, seven days) and reports background writes once. Processed records are deleted. `hooks/memo_worker.mjs --status` and `--session ID --dry-run` inspect the queue and prompt; `memo/worker.log` records outcomes. With background off, Hooks record nothing and Memo maintains knowledge in-session.

Disabling Spec stops knowledge Hooks and read/search/edit access. Status and settings remain available, and Consider still works. The change applies to later operations; already-injected messages remain.

See [tool design](spec-tools.md) and [installation](install.md).
