# Spec maintenance

Spec keeps current knowledge and deletes records whose purpose has ended. There is no archive directory, secondary search, or user-managed review inventory. Age never deletes knowledge or an inactive project. Memo owns semantic judgment; the CLI and MCP share deterministic checks and atomic storage.

## Check

Use `node <gei>/bin/gei.mjs spec check --scope projects/example/` (or `--all` for an explicit full-store audit). The Skills package uses `<memo>/scripts/spec/cli.mjs`. MCP exposes the same operation as `spec_check({path_prefix: "projects/example/"})`. Scope is explicit so the install directory never selects the wrong project.

Checks return 10 candidates by default, a revision, and only these signals:

- `broken_reference`: an outgoing Markdown reference does not name a document in the snapshot.
- `orphan_note`: a Markdown file under `topics/<domain>/`, other than that domain's `README.md`, is not linked from the README. A note the README links is reachable and is not reported. INDEX does not list sub-notes.
- `duplicate_content`: the same normalized prose block of at least 160 Unicode characters appears in another document in the scope. Code, navigation comments, and YAML frontmatter are excluded; paraphrases are not detected. Shared wording may be intentional; the agent decides ownership.
- `source_changed` / `source_unavailable`: the document's YAML frontmatter lists `sources`. With `--checkout-root` (MCP `checkout_root`) for one `projects/<project>/` scope, each path is resolved inside that checkout. `source_unavailable` means the path does not exist there. `source_changed` means both the source file and the knowledge document have a last git commit, and the source commit time is later than the document commit time (`git log -1 --format=%ct`). No content hash is stored.

`--limit`, `--offset`, and `--revision` paginate a fixed snapshot; MCP also returns `next_check`. Without `checkout_root`, sources are not judged. Missing git history on either side never yields `source_changed`. In GitHub mode the knowledge document has no local work tree, so `source_changed` is absent. `broken_reference`, `orphan_note`, `duplicate_content`, and `source_unavailable` are still reported.

Meaning, retention, and live behavior are not assessed, and no signal authorizes deletion. The check is read-only. A fresh online check quiets startup hints for seven days. Plain-text or unsupported Markdown references still count as dependencies when they name a real knowledge path.

## Frontmatter

`spec_edit` requires YAML frontmatter on every document except a path ending in `/INDEX.md`, including `tasks/INDEX.md`. `type` is `facts`, `decisions`, `runbooks`, `log`, or `tasks`. `description` is one non-empty line. A `tasks` document also requires `status`: `todo`, `doing`, `blocked`, or `done`. A `create`, `replace`, `replace_lines`, or `rename` that leaves a non-INDEX document without them fails with `FRONTMATTER` and writes nothing; add missing fields to older documents in the same batch. The fields are ordinary text, written with `create`, `replace`, or `replace_lines` (line 1 included). A heading that is still `<标题>` fails with `PLACEHOLDER_TITLE` and writes nothing.

`sources` is an optional YAML list in the frontmatter (not a JSON field or hash map). List checkout-relative files whose later commits should reopen the note, not every file that was read.

```markdown
---
type: facts
description: One line used later to label this document in INDEX.
sources:
  - hooks/knowledge.mjs
  - docs/spec.md
---
# A durable constraint

The actual knowledge.
```

A flow sequence (`sources: [hooks/knowledge.mjs]`) is also read. Keys other than `type`, `description`, `status`, and `sources` are left untouched. Reads start at line 1 and include this header. `body_start_line` is the first line after it. Search matches the full file. A trailing `#` comment on a scalar line is ignored when a space or tab precedes `#` and the `#` is outside quotes.

Local mode makes no git commits, so an edit does not move the document's commit time until something commits it. Drift compares commit times, not file modification times.

## Edits and recovery

Ordinary `spec_edit` calls need edits and a summary; there is no review array or verification record. Creation, correction, rename, and deletion share one batch, and the same save rebuilds the [INDEX catalog](spec.md#daily-use) and `tasks/INDEX.md`. A document with invalid frontmatter is omitted from the catalog until fixed. The first topic README or task creates the project index. Files only under `topics/<domain>/notes/` do not. One valid note in `context/notes/` creates `context/INDEX.md`. Deleting an index while documents it lists remain restores it from the previous header. Deleting the last listed document leaves an empty block; no index is created where none existed. A done task stays in `tasks/INDEX.md`.

Deletion batches reject remaining incoming references outside the generated block, including hand-written header links. Generated lines are updated first, so the caller never repairs them.

Deletion and link repairs stay atomic. `rename` moves the whole file and updates its catalog link; the moved document must still satisfy the frontmatter rules unless renamed to `INDEX.md`. All changed files, `INDEX.md` included, go out in one local publication or one GitHub commit.

GitHub deletion is one commit and recovery uses repository history. Local deletion batches save changed preimages outside knowledge, under runtime state, for 30 days. `spec restore` lists available deletion backups; `spec restore --backup ID` previews one; adding `--apply` restores the batch if no later content would be overwritten. Expired backups are removed on a later local deletion. Recovery is for mistakes, not routine search.

## When maintenance runs

Project and shared startup hooks offer a compact scoped check hint at most once per seven days after a successful current check. They do not scan all bodies or block responses; Memo handles one bounded batch. Errors found during work are fixed at once. An `--all` audit does not quiet each project's hint.

There is no scheduled mechanical deletion. Disposable notes are deleted with `spec_edit` when their decision has landed. Confirmed semantic deletions happen immediately. The plugin starts no AI service and has no review queue. MCP and CLI print the check as a formatted worklist; CLI `--json` gives structured output.
