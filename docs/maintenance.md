# Spec maintenance

Spec keeps current knowledge and deletes records whose purpose has ended. There is no archive directory, secondary search, or user-managed review inventory. Age never deletes ordinary knowledge or an inactive project. Memo owns semantic judgment. The CLI and MCP share deterministic checks and atomic storage.

## Check

Use `node <gei>/bin/gei.mjs spec check --scope projects/example/` (or `--all` for an explicit full-store audit). The Skills package uses `<memo>/scripts/spec/cli.mjs`. MCP exposes the same operation as `spec_check({path_prefix: "projects/example/"})`. Scope is explicit so a runtime installation directory cannot accidentally select the wrong project.

Checks return 10 candidates by default, a revision, and only these signals:

- `broken_reference`: an outgoing Markdown reference does not name a document in the snapshot.
- `duplicate_content`: the same normalized prose block of at least 160 Unicode characters appears in another document in the scope. Code, navigation comments, and YAML frontmatter are excluded. Shared wording may be intentional; only an agent can decide ownership. Paraphrases stay outside this detector.
- `source_changed` / `source_unavailable`: the document's YAML frontmatter lists `sources`. With `--checkout-root` (MCP `checkout_root`) for one `projects/<project>/` scope, each path is resolved inside that checkout. `source_unavailable` means the path does not exist there. `source_changed` means both the source file and the knowledge document have a last git commit, and the source commit time is later than the document commit time (`git log -1 --format=%ct`). No content hash is stored.

`--limit`, `--offset`, and `--revision` paginate a fixed snapshot. MCP also supplies ready-to-call `next_check`. Without `checkout_root`, source entries are not judged. A missing git history on either side does not invent `source_changed`. GitHub-backed knowledge has no local work tree for the document, so this build does not report `source_changed` in that mode; a missing checkout path can still be `source_unavailable`.

Coverage of meaning, retention, and live behavior is explicitly unassessed. Zero candidates is not approval. This operation is read-only on knowledge. A fresh online check records local cadence so startup hints stay quiet for seven days.

Neither a duplicate hint nor a newer source commit authorizes deletion. Textual or unsupported Markdown references remain dependencies when they name an actual knowledge path.

## Sources frontmatter

`sources` is an optional YAML list in the document frontmatter, written by the editor as ordinary Markdown. It is not a JSON field and it is not a hash map. List checkout-relative files whose later commits should reopen the note, not every file that was read.

```markdown
---
sources:
  - hooks/knowledge.mjs
  - docs/spec.md
---
# A durable constraint

The actual knowledge.
```

A flow sequence (`sources: [hooks/knowledge.mjs]`) is also read. Other frontmatter keys are left untouched. Reads start at line 1 and include this header. `body_start_line` is the first line after it. Search matches the full file.

Local mode does not create git commits. An edit therefore does not move the document's commit time until something commits the knowledge file. Drift compares those commit times, not working-tree mtimes.

## Edits and recovery

Ordinary `spec_edit` calls need edits and a summary. There is no review array and no separate verification record. Creation, correction, rename, and deletion are the same batch. Deletion batches still reject remaining incoming references. That does not prove semantic consistency.

Semantic deletion and link repairs stay atomic. `rename` moves the complete file. Plain documents stay plain Markdown.

GitHub deletion is one commit and recovery uses repository history. Local deletion batches save changed preimages outside knowledge, under runtime state, for 30 days. `spec restore` lists available deletion backups; `spec restore --backup ID` previews one; adding `--apply` restores the batch if no later content would be overwritten. Expired backups are removed on a later local deletion and are no longer offered. Older read snapshots are not a retention service. Recovery is for an actual mistake, not routine knowledge search.

## When maintenance runs

Project and shared startup hooks offer a compact scoped check hint at most once per seven days after a successful current check. They do not scan all bodies or block final responses. Memo handles one bounded batch. Errors found during actual work are corrected immediately. A read-only all-store audit does not acknowledge checks for every separate project's local hint.

There is no scheduled mechanical deletion. Disposable notes are deleted with `spec_edit` when their decision has landed. Confirmed semantic deletions happen immediately. Fully unattended semantic maintenance would be a separate agent using `spec_check` and the same Memo rules. The plugin does not start an AI service or require users to review a queue.

MCP check text is a formatted worklist of the three signals. The CLI uses the same presentation by default; `--json` requests structured output.
