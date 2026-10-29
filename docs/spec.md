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
| `show projects/<name>/` | Print the memory and index a session in that project receives (`show context/` for shared) |
| `login` | Show authentication setup instructions |

GitHub credentials come from `GEI_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, `gh auth token`, or the Git credential helper, in that order; an invalid environment token must be fixed or removed. The token needs content read/write, plus repository creation for `--create`. The CLI never prints or saves credentials. `--branch` selects an existing branch instead of the default.

Connecting is a one-time user choice of account, repository, and upload scope. The preview lists upload paths and divergent local/remote documents; resolve those before retrying, since connection never picks a whole-file winner. CRLF/LF differences count as equal and keep the remote bytes; other differences are conflicts (edits still match exactly). The mode changes only after remote verification. To connect another repository, switch to local first. A second device authenticates and connects the same repository explicitly; names are never guessed from the code remote.

Local knowledge defaults to `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. Settings, snapshots, revision references, and locks live separately under `~/.agents/gei-state/<store-path-hash>`; `GEI_SPEC_STATE` overrides that directory. The hash is not a project identity. Do not sync this directory or put it in a knowledge repository. Backend changes keep the enabled/disabled setting.

In GitHub mode, after verifying migration and saving any later local-only files, the old local knowledge directory can be removed; nothing recreates it until you switch back to local. Keep the state directory (binding and offline cache) and the same `GEI_SPEC_HOME` value, which still selects that state. Before deleting a former Git checkout, separately save repository metadata, untracked non-Markdown files, and unpushed branches.

## Daily use

Each scope (`projects/<project-name>/` or `context/`) holds:

```text
MEMORY.md        typed one-line entries, injected at session start
docs/<name>.md   long documents (frontmatter description), listed in INDEX;
                 docs/<dir>/*.md are linked from a top-level doc instead
tasks/<name>.md  work in progress (description, status todo|doing|blocked)
INDEX.md         generated list of docs and the first 5 tasks
tasks/INDEX.md   generated list of every task
```

`MEMORY.md` entries have a type and fixed fields:

| type | fields |
| --- | --- |
| rule | when, do, because? |
| pitfall | when, avoid, instead, because? |
| env | subject, key, value, note? (`key` from a fixed list: host, ip, url, port, path, version, account, owner, id, name, branch, schedule, retention, scope, cert, setting, limit, location, command) |
| why | choice, because, rejected? |

Every entry also has `basis` (`user`, `observed`, or `inferred`) and may have `until` (when it retires) and `date`. The file stays readable and hand-editable on GitHub:

```markdown
## pitfall

- **p1** 调 Dify 插件调用超时
  - avoid: 在 Pod env 设 MAX_INVOCATION_TIMEOUT
  - instead: 改 DIFY_BACKWARDS_INVOCATION_READ_TIMEOUT
  - basis: observed
```

Limits are checked on every save, never truth: a field holds at most 240 UTF-8 bytes, a rendered entry 480, a project memory 7000 rendered bytes and the shared memory 2500. A save that would grow a memory past its budget fails with `MEMORY_FULL` and lists removal candidates, weakest basis first; a save that shrinks it always succeeds. INDEX.md is capped at 1500 bytes. A broken hand edit fails the next save with `MEMORY_FORMAT` and is flagged at the top of the injected memory.

- `spec_read`: read up to 20 paths from one revision, default 200 lines per file and a shared 48 KB content budget. Overviews and `body_start_line` precede raw Markdown; line numbers are physical. Set `line_numbers: true` for range edits. Truncated files include `next_read` arguments pinned to the snapshot.
- `spec_search`: literal, case-insensitive search across full Markdown, or enumeration with an empty query (MEMORY.md and INDEX.md first, then docs and tasks). Follow `next_search` for fixed-revision pagination.
- `spec_edit`: a base revision, a one-line summary, and up to 100 operations in order. `add_entry`, `update_entry` (an empty string removes an optional field), and `remove_entry` change `MEMORY.md`; ids are assigned. `DUPLICATE_ENTRY` means an entry already covers the same rule or pitfall situation, why choice, or env subject and key. `replace`, `replace_lines`, `create`, `rename`, and `delete` change docs and tasks. Ranges refer to the base snapshot and must not mix with other operations on the same file. Only `MEMORY.md`, `docs/`, and `tasks/` are writable; older files can only be deleted or renamed into `docs/`. The same save regenerates `INDEX.md` and `tasks/INDEX.md`, which cannot be edited. On `REVISION_CONFLICT`, reread and reconcile. On `SUBMISSION_UNCONFIRMED`, read before retrying because the write may have persisted. `applied=false` with `unchanged=true` is a successful no-op.

`show projects/<project>/` (or `show context/`) prints exactly what a session receives. The CLI accepts the same read/search/edit JSON on stdin or `--input FILE`.

Revision references such as `r_0123456789abcdef` map to an immutable version in local state and belong to the active binding. Use the reference from the read that informed the change; if it is lost, reread.

Local success means the Markdown was saved; no Git commit is made. GitHub success means one remote commit per save, returned with revision and URL; the repository history is the audit trail and the way to undo a change.

## Consistency and failures

Each edit checks the whole-store base revision. A change to any knowledge document rejects a stale local edit; GitHub checks the branch head. This is deliberate: a document read as a premise may have changed even if the edited file did not. Reread and reconcile before retrying; do not just substitute a newer revision.

All edit operations validate before publication. Local tools and Hooks share a process lock and recover an interrupted transaction before exposing documents. Batches are complete only through the runtime; other filesystem readers may see partial publication and native editors bypass concurrency checks, so keep all writers on the tools. GitHub publishes a batch in one commit using `expectedHeadOid`. Case-colliding paths and symbolic-link documents are rejected for portable storage.

Hooks inject each scope's rendered `MEMORY.md` and `INDEX.md` body. The write-time budgets keep a project's injection below 9000 bytes, under both hosts' hook limits (Claude Code 10,000 characters, Codex about 2,500 tokens), so nothing is clipped. Hooks use a 60-second head cache and fetch only those two files. They wait up to four seconds for a concurrent Spec operation; unavailable connections use cached files with explicit status. `refresh` downloads all bodies for offline access.

GitHub mode has no offline write queue and never falls back to a writable local master. A lost submission response is checked against the remote content before reporting verified success. If verification is also unavailable, `SUBMISSION_UNCONFIRMED` asks the caller to read the latest documents before retrying. Semantic contradictions are Memo's job.

`background on|off` controls post-session maintenance (on by default). Prompt, Stop, and SessionEnd Hooks append the user's prompts and the agent's final replies to `memo/sessions/` under the state directory, then queue a handoff in `memo/pending/` and start a detached worker. An idle handoff waits 15 minutes and is replaced by each later Stop; SessionEnd and long sessions run at once. The worker runs `claude -p` with only `spec_read`, `spec_search`, `spec_edit`, and read tools, or `codex exec` in a read-only sandbox, using the session's model when the Hook or transcript names it and the host default otherwise. A worker environment flag keeps its own run unrecorded. SessionStart retries stale or failed handoffs (at most three attempts, seven days) and reports background writes once. Processed records are deleted. On `MEMORY_FULL` the worker removes inferred, then observed entries, and never a `basis: user` entry. `hooks/memo_worker.mjs --status` and `--session ID --dry-run` inspect the queue and prompt; `memo/worker.log` records outcomes. With background off, Hooks record nothing and Memo maintains knowledge in-session.

Disabling Spec stops memory Hooks and read/search/edit access. Status and settings remain available, and Consider still works. The change applies to later operations; already-injected messages remain.

See [tool design](spec-tools.md) and [installation](install.md).
