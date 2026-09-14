# Spec storage and controls

Gei works locally after installation. The plugin bundles a Node.js stdio MCP server; no hosted server, port, or Cloudflare account is required. GitHub storage is optional and belongs to the user. Markdown remains under `projects/<project-name>/` and `context/` with the same project naming and topic routes.

## Settings

Run `node <gei>/bin/gei.mjs spec <command>` from a plugin/source installation. A Skills-only installation uses `node <memo>/scripts/spec/cli.mjs <command>`. Both support `--help`; `npm run spec -- <command>` is also available from the source checkout. Installing the plugin does not add a global shell command or change PATH.

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

GitHub credentials come from `GEI_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, `gh auth token`, or the configured Git credential helper, in that order. Environment credentials take precedence; an invalid environment token must be corrected or removed. Use `gh auth login --hostname github.com` for interactive setup. A token for an existing private repository needs content read/write access; automatic creation also needs permission to create a repository. The CLI never prints or saves credentials. `--branch` can select an existing branch; the repository default is used otherwise.

Connecting is a one-time user choice of account, repository, and upload scope. The preview shows upload paths and reports divergent local/remote documents. Resolve those differences before retrying; connection never chooses a whole-file winner. Migration treats CRLF/LF checkout conversion as equivalent and retains existing remote bytes; other whitespace and content differences remain conflicts. This does not relax exact matching in edits. The mode changes only after remote verification. Connecting another repository requires switching to local first. A second device authenticates and explicitly connects the same repository; repository names are not guessed from the code remote.

Local knowledge defaults to `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. Settings, snapshots, revision references, locks, and backups live separately under `~/.agents/gei-state/<store-path-hash>`; `GEI_SPEC_STATE` overrides that directory. The hash only isolates local runtime state; it is not a project identity. Do not sync these settings or put them inside a knowledge repository. Backend changes preserve the enabled/disabled setting.

After verifying migration and preserving any later local-only files, the old local knowledge directory can be removed in GitHub mode. Reads, edits, and Hooks do not require it or recreate it. Keep the separate state directory, which owns the binding and offline cache, and keep the same `GEI_SPEC_HOME` setting: its path still selects that state even when the directory does not exist. An explicit switch back to local will recreate local documents. Repository metadata, untracked files outside the supported Markdown paths, and unpushed branches need separate preservation before deleting a former Git checkout.

## Daily use

Hooks identify the project and inject compact INDEX content. Tools use knowledge-relative paths such as `projects/example/INDEX.md`; no tool call needs a repository address or access token. The local MCP uses the same core as the settings CLI and Hooks. Multiple MCP processes coordinate through the same runtime state directory.

- `spec_read`: read up to 20 paths from one revision, default 200 lines per file and a shared 48 KB content budget. Set `line_numbers: true` to display numbered content for range edits; the prefixes are not document text. Raw Markdown remains the default. Explicit truncation includes `next_line` and `next_column`; columns address raw Unicode characters, including on numbered views. Pass `revision` to continue reading the same snapshot.
- `spec_search`: literal, case-insensitive full-text search within a knowledge path prefix, or list paths with an empty query. Results include paths, line numbers, bounded text, and a revision. The default `projects/` covers all projects; use `projects/<project>/` for one project or `context/` for shared knowledge. It does not search source code or use semantic/regex matching.
- `spec_edit`: submit a base revision, one-line summary, and a batch of operations. Use `replace` with unique exact old/new text for small changes. Use `replace_lines` with inclusive, 1-based `start_line`, `end_line`, and `new_text` for a larger section without repeating old text. All ranges refer to the base snapshot; ranges on one file must not overlap or mix with other operation types on that file. Other operations run in order. `create` supplies a complete new document and `delete` removes one; they can move a document in the same batch as INDEX repairs.
- `spec_status`: inspect configuration or diagnose connectivity; ordinary reads and edits do not require it first.
- `spec_check`: return a bounded scoped maintenance worklist with evidence and incoming references. Age requests review, not deletion.
- `spec_gc`: preview explicitly declared transient destruction; applying requires the preview revision and plan identifier. Knowledge and handoff records never expire mechanically.

`spec_edit` also accepts structured `reviews` alongside edits (or without text changes). Ordinary edits preserve existing state without creating a new baseline or renewing verification; optional `verify` reviews explicitly confirm the whole resulting document. Read/search/edit coordinates address the stored Markdown verbatim; lifecycle state is maintained by the runtime in the document’s own `gei` frontmatter. Plain documents need no lifecycle header. Semantic deletion and link repairs remain one atomic operation. See [knowledge maintenance](maintenance.md) for outcome schemas, single-file migration, check/GC CLI flags, deletion recovery, and optional schedules.

The CLI exposes the same read/search/edit JSON arguments on stdin or through `--input FILE`, with the same validation and error codes. New files use the supplied text; existing line endings, Unicode, quotes, and backslashes are preserved by exact replacement. There is no implicit replace-all or fuzzy matching.

Revision references such as `r_0123456789abcdef` are 18 characters and map to an immutable version in local state. They survive MCP/CLI restarts and remain specific to the active binding. Copy the reference from the read that informed the change; if it is lost or its mapping is missing, reread rather than inventing a reference. Previously issued full revision strings remain valid for their original binding. There is no implicit per-session "last read".

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

Use the actual returned reference, not the example value. Empty `new_text` deletes the selected lines. New lines follow the replaced block's newline style (falling back to the document's first newline or LF) and whether the selected block ended in a newline. One optional final newline in `new_text` is ignored; untouched bytes remain unchanged. Ranges may target a partially displayed long line, so finish reading the intended range before replacing it. `NO_MATCH`, `AMBIGUOUS_MATCH`, and range errors include a bounded numbered view of the unchanged base and a ready-to-use pinned `read` request. They never guess and apply a nearby edit.

Local success means the Markdown was saved locally. GitHub success means a commit was persisted remotely and returns its revision and URL; the agent must not run an additional push. Local mode does not create automatic Git commits. An existing local Git repository can remain an archive, but direct file edits and independent Git synchronization must not run alongside tool transactions. GitHub mode leaves the previous local directory untouched until an explicit switch back.

## Consistency and failures

Each edit checks the whole-store base revision. A change to any knowledge document rejects a stale local edit; GitHub checks the branch head. This deliberately favors correctness over silently retrying unrelated changes: a document read as a premise may have changed even if the edited file did not. Read the affected documents and reconcile before retrying; do not simply substitute a newer revision.

All edit operations validate before publication. Local tools and Hooks share a process lock and recover an interrupted transaction before exposing documents. This provides complete batches through the runtime; arbitrary filesystem readers can see intermediate file publication, and native editors bypass the concurrency contract. Keep all active writers on the tool interface. GitHub publishes a batch in one commit using `expectedHeadOid`. Case-colliding paths and symbolic-link documents are rejected for portable storage.

Hooks inject INDEX bodies in both local and GitHub modes, within the same project/shared byte budgets. They use a 60-second head cache and fetch only their INDEX body on demand. Knowledge hooks wait up to four seconds for a concurrent Spec operation; both host configurations allow ten seconds for lock acquisition and remote loading. Refresh checks have short timeouts; unavailable connections use available cached indexes with explicit status. A new snapshot does not combine an older cached body with a newer index. Missing, uncached bodies require connectivity. `refresh` deliberately downloads all bodies for offline access.

GitHub mode has no offline write queue and never falls back to a writable local master. A lost submission response is checked against the remote content before reporting verified success. If verification is also unavailable, `SUBMISSION_UNCONFIRMED` asks the caller to read the latest documents before retrying. Semantic contradictions remain the responsibility of Memo; neither a shared repository nor a clean text update establishes factual consistency.

Disabling Spec stops knowledge Hooks and read/search/edit access. Status and settings remain available, and the router still selects other task Skills. An already-injected conversation cannot have its old messages removed; the new state takes effect on subsequent operations and Hook runs.

See [tool design](spec-tools.md), [installation](install.md), and [verification](verification.md).
