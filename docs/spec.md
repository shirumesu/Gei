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

Connecting is a one-time user choice of account, repository, and upload scope. The preview shows upload paths and reports divergent local/remote documents. Resolve those differences before retrying; connection never chooses a whole-file winner. The mode changes only after remote verification. Connecting another repository requires switching to local first. A second device authenticates and explicitly connects the same repository; repository names are not guessed from the code remote.

Local knowledge defaults to `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. Settings, snapshots, locks, and backups live separately under `~/.agents/gei-state/<store-path-hash>`; `GEI_SPEC_STATE` overrides that directory. The hash only isolates local runtime state; it is not a project identity. Do not sync these settings or put them inside a knowledge repository. Backend changes preserve the enabled/disabled setting.

## Daily use

Hooks identify the project and inject compact INDEX content. Tools use knowledge-relative paths such as `projects/example/INDEX.md`; no tool call needs a repository address or access token. The local MCP uses the same core as the settings CLI and Hooks. Multiple MCP processes coordinate through the same runtime state directory.

- `spec_read`: read up to 20 paths from one revision, default 200 lines per file and a shared 48 KB content budget. Explicit truncation includes `next_line` and `next_column`; columns count Unicode characters and allow progress through long lines. Pass `revision` to continue reading the same snapshot.
- `spec_search`: literal, case-insensitive search within a path prefix, or list paths with an empty query. Results include paths, line numbers, bounded text, and a revision.
- `spec_edit`: submit a base revision, one-line summary, and an ordered batch of `replace`, `create`, and `delete` operations. Exact replacements must match once. Move a document by creating its new path and deleting its old path in the same batch as link repairs.
- `spec_status`: inspect configuration or diagnose connectivity; ordinary reads and edits do not require it first.

The CLI exposes the same read/search/edit JSON arguments on stdin or through `--input FILE`, with the same validation and error codes. New files use the supplied text; existing line endings, Unicode, quotes, and backslashes are preserved by exact replacement. There is no implicit replace-all or fuzzy matching.

Local success means the Markdown was saved locally. GitHub success means a commit was persisted remotely and returns its revision and URL; the agent must not run an additional push. Local mode does not create automatic Git commits. An existing local Git repository can remain an archive, but direct file edits and independent Git synchronization must not run alongside tool transactions. GitHub mode leaves the previous local directory untouched until an explicit switch back.

## Consistency and failures

Each edit checks the whole-store base revision. A change to any knowledge document rejects a stale local edit; GitHub checks the branch head. This deliberately favors correctness over silently retrying unrelated changes: a document read as a premise may have changed even if the edited file did not. Read the affected documents and reconcile before retrying; do not simply substitute a newer revision.

All edit operations validate before publication. Local tools and Hooks share a process lock and recover an interrupted transaction before exposing documents. This provides complete batches through the runtime; arbitrary filesystem readers can see intermediate file publication, and native editors bypass the concurrency contract. Keep all active writers on the tool interface. GitHub publishes a batch in one commit using `expectedHeadOid`. Case-colliding paths and symbolic-link documents are rejected for portable storage.

Hooks use a 60-second head cache and fetch only their INDEX body on demand. Refresh checks have short timeouts; unavailable connections use available cached indexes with explicit status. A new snapshot does not combine an older cached body with a newer index. Missing, uncached bodies require connectivity. `refresh` deliberately downloads all bodies for offline access.

GitHub mode has no offline write queue and never falls back to a writable local master. A lost submission response is checked against the remote content before reporting verified success. If verification is also unavailable, `SUBMISSION_UNCONFIRMED` asks the caller to read the latest documents before retrying. Semantic contradictions remain the responsibility of Memo; neither a shared repository nor a clean text update establishes factual consistency.

Disabling Spec stops knowledge Hooks and read/search/edit access. Status and settings remain available, and the router still selects other task Skills. An already-injected conversation cannot have its old messages removed; the new state takes effect on subsequent operations and Hook runs.

See [tool design](spec-tools.md), [installation](install.md), and [verification](verification.md).
