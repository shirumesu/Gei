# Spec maintenance

Spec keeps current knowledge and deletes records whose purpose has ended. There is no archive directory, secondary search, or user-managed review inventory. Age triggers review, never deletion of ordinary knowledge or an inactive project. Memo owns semantic judgment; the CLI and MCP share deterministic checks and atomic storage.

## Check and review

Use `node <gei>/bin/gei.mjs spec check --scope projects/example/` (or `--all` for an explicit full-store audit). The Skills package uses `<memo>/scripts/spec/cli.mjs`. MCP exposes the same operation as `spec_check({path_prefix: "projects/example/"})`. Scope is explicit so a runtime installation directory cannot accidentally select the wrong project.

Checks return 10 candidates by default, coverage, evidence changes, incoming references, and a revision. `--limit`, `--offset`, and `--revision` paginate a fixed snapshot; MCP also supplies ready-to-call `next_check`. `--checkout-root` enables source-file comparisons for one project. Source details distinguish omitted checkout (`not_checked`), missing paths, inaccessible evidence and changed readable files. Coverage counts references, not unique files. All knowledge bodies are inspected for incoming dependencies; duplicate-prose comparisons and the worklist stay in the requested scope. This is read-only on knowledge; it updates local check cadence and sampling state.

Coverage explicitly leaves semantic validity, retention value and live behavior unassessed. Zero candidates is not approval, and absence of a review baseline is not a defect. Each first check page also proposes up to three documents without mechanical signals as `review_sample`, with pinned read calls. Fresh online checks rotate the sample using local state; returning a sample records no semantic review and changes no knowledge. Agent maintenance considers these documents' continued value, preserving useful low-frequency constraints and deleting or merging only after reading evidence. Complete user-requested audits enumerate all documents with paginated `spec_search`, rather than assuming candidates or samples cover the store.

Candidates include invalid metadata, changed or unverified content, review dates, unavailable/changed evidence, unconfirmed environments, broken links, expired transient retention and substantial repeated prose. Duplicate hints identify exact normalized prose blocks of at least 160 Unicode characters in different documents, excluding lifecycle metadata, code and navigation; they include physical lines and bounded peer references with omission counts. Shared wording may be intentional: only an agent can decide ownership and remove redundancy. Paraphrases and all semantic duplication remain outside this detector. Low usage is not measured. Textual or unsupported Markdown references remain conservative dependencies when they name an actual path. Neither a duplicate hint nor a source fingerprint change authorizes deletion.

Ordinary `spec_edit` calls need only edits and a summary. Creation and correction preserve existing lifecycle state without initializing a new record or renewing whole-document verification. Documents without metadata remain ordinary Markdown; missing state alone does not create a maintenance candidate. Add optional `reviews` when an explicit semantic review has been completed. Each review has a path, outcome and concise `basis`:

- `verify` confirms the entire resulting document against current evidence, with or without accompanying edits, after deciding that it still earns retention. It does not imply live execution when evidence is source inspection. The basis references owning evidence rather than copying logs; new review submissions are limited to 300 Unicode characters.
- `delete` gives the deletion rationale and removes that record; repair incoming references in the same batch.
- `defer` identifies missing evidence without renewing verification. Any accompanying corrections are saved without verification; the same content/evidence condition cools for 30 days, while changed content or sources can reopen it.

Example CLI input (use an actual read/check revision):

```json
{
  "base_revision": "r_from_the_read",
  "summary": "Verify the compatibility requirement",
  "reviews": [{
    "path": "projects/example/topics/compatibility.md",
    "outcome": "verify",
    "basis": "The current compatibility contract and reader implementation confirm the document; sources are linked beside the requirement.",
    "review_days": 365
  }]
}
```

Pass this through `spec edit --input FILE`, or use the same structured arguments with MCP. `checkout_root` plus repository-relative `sources` captures optional file hashes only for files whose changes could invalidate the claims, not every file read during work. Actual checkout paths are not stored. A review omitting `scope` preserves it; an object replaces it; `null` clears it. Platform-only applicability is allowed. Set `environment` only for an actual installation-specific claim, using its known instance rather than automatically copying the checking host. New runtime state creates a new instance; a mismatch leaves the claim unconfirmed here rather than deleting another host's facts. A `defer` cannot change scope or evidence, including clearing them.

## Metadata and legacy knowledge

Each document is one Markdown file. Optional lifecycle state lives in its own `gei` frontmatter field. The runtime owns that field through structured `reviews`; agents maintain substantive content and supply review outcomes and evidence, without manually calculating timestamps or hashes. Plain INDEX, topic and note files need no header until an actual review requires state.

All coordinates are physical lines of the stored Markdown; there is no virtual view or line offset conversion. `spec_read` skips the Gei-managed frontmatter by default, so a document with lifecycle state may start at line 4. Each file reports `body_start_line` and a one-line `lifecycle` summary (kind, verification and review dates, source count) instead of the raw field. Pass `start_line: 1` to read the field itself. `spec_search` skips managed lines unless `include_lifecycle: true`. Startup INDEX injection uses the body only.

Edits cannot touch the managed field. `replace_lines` ranges that include the field or the delimiters of a Gei-only header fail with a RANGE error that names the first body line. Exact `replace` never matches inside the field, so text that also appears in evidence does not cause ambiguous matches. `create` content must not contain a `gei` field. A final check rejects any batch that would still change the field. Only `reviews` write it.

The managed field is one line of JSON, which is a YAML flow mapping:

```markdown
---
gei: {"version":5,"kind":"knowledge","review_days":90,"verified_at":"2026-10-06T08:00:00.000Z","verified_hash":"<16 hex>","basis":"Short evidence pointer","sources":{"hooks/knowledge.mjs":"<16 hex>"}}
---
# A durable constraint

The actual knowledge and its supporting evidence.
```

Format 5 hashes use the first 16 hex characters of SHA-256; they detect change and are not a security boundary. Content hashes cover everything outside the managed field, including other frontmatter, with CRLF normalized. `sources` maps at most 8 checkout-relative paths to file hashes. New review `basis` is limited to 300 characters; point to evidence in the document or source instead of copying it. Review deadlines are calculated from `verified_at` and `review_days`.

The existing `rename` operation carries the complete file without renewing state; repair incoming and relative links in the same batch. Deletion, GC, local recovery and GitHub commits likewise operate on the complete file. Semantic deletion and link repairs remain atomic. Plain documents still receive structural link checks, but absence of a review baseline does not establish that their knowledge is invalid.

### Migration from 0.11 records

Only format 5 is active. Documents with older embedded records (versions 1–4) are reported as `legacy_metadata` by checks and cannot be reviewed until converted. Run `spec migrate-metadata --all` (or `--scope projects/example/`) to preview, then apply with `spec migrate-metadata --all --apply --base-revision REV`. Conversion runs in one transaction or GitHub commit:

- A verification baseline that still matches the content is rebased onto the new hash (`baseline: preserved`). A baseline that no longer matches stays unmatched (`stale`), so the document still reports `content_changed`.
- Verification dates, review intervals, basis text, scope, source baselines and destruction declarations are kept. Older bases longer than 300 characters are kept in full.
- Deferral fingerprints cannot be carried over. The reason is kept, and deferred documents appear again in the next check.
- Records that cannot be parsed are listed as blocked; verify them with evidence to rebuild their state.

Separate `metadata/<document-path>.json` records from 0.11.0 development builds are no longer read. Convert them with Gei 0.11.x before upgrading. Upgrade writers and the scheduled GC runtime together, and restart long-lived MCP processes; older writers cannot read format 5. A migration changes the revision, so read again before later edits.

MCP check/GC text is a formatted worklist containing reasons, relevant evidence, environment conditions, retention declarations and reference locations. The CLI uses the same presentation by default; `--json` requests structured output for scripts. Neither maintenance representation includes internal content/defer fingerprints.

Kinds are `knowledge` (default), `handoff` (default under tasks/), and `transient`. Default review intervals are 90, 14, and 30 days respectively, configurable from 1 to 365. Environment observations normally use knowledge with a 30-day review interval. Stable accepted requirements can use 365 days. These are review intervals, not deletion deadlines. Read/search/import, ordinary edits, and opening a project never renew verification. Transport/cache `stale` describes snapshot freshness, independently of knowledge validity.

A handoff file exists while recovery is needed. There is no additional active/completed tracker. At verified completion, preserve lasting knowledge and delete the handoff with its route in one batch. Missing completion evidence leads to deferral. Do not keep completed task inventories.

## Deterministic cleanup and recovery

`spec gc --scope projects/example/` or `spec_gc` previews cleanup. Only a `transient` non-INDEX record with an explicit `delete_after` UTC timestamp and `deletion_reason`, set by a successful review, can qualify. Its body must still match the destruction declaration. An edit that adds new findings revokes mechanical eligibility until retention is explicitly reconsidered. Ordinary topics, handoffs, old projects, and legacy files are never expired automatically.

GC removes only standalone Markdown list links in INDEX/README files or `<!-- gei:navigation -->` blocks. Additional prose, reference-style links, HTML, textual mentions, and ambiguous references are treated as dependencies. They block mechanical deletion until an agent reconciles the content. Deletion batches reject remaining incoming references; this does not prove semantic consistency or detect every possible informal dependency.

To apply, pass `--apply --base-revision REV --plan-id ID` from the preview. The content revision and planned deletion/navigation set must still match, including when another destruction date passes. GC does not silently rebase. A batch shares the existing 100-operation limit; narrow a larger scope. Read/search/check never run deletion as a side effect. Spec disablement also disables checks and GC; offline GitHub reads cannot become offline writes.

GitHub deletion is one commit and recovery uses repository history. Local deletion batches save all changed preimages (including routes) outside knowledge, under runtime state, for 30 days. `spec restore` lists available deletion backups; `spec restore --backup ID` previews one; adding `--apply` restores the batch if no later content would be overwritten. Expired backups are removed on subsequent local deletion maintenance and are no longer offered by restore. Older read snapshots are not a guaranteed retention/recovery service. Recovery is for an actual mistake, not routine knowledge search.

## When maintenance runs

Project/shared startup hooks offer a compact scoped check hint at most once per seven days after a successful current check. They do not scan all bodies, inject a maintenance inventory, or block final responses with a Stop hook. Memo handles one bounded batch, while relevant errors found during actual work are corrected immediately. A read-only all-store audit does not acknowledge checks for every separate project's local hint.

Confirmed semantic deletions happen in `spec_edit` immediately. For scheduled mechanical cleanup, use `<memo>/scripts/spec/gc-run.mjs --scope all`; it previews by default. Add `--apply` only when automatic execution is intended. The runner calls the same GC core, previews and applies the exact plan, and never connects or enables a store. A weekly local scheduler can invoke this command with the existing binding and Node.js 22+; keep credentials in the existing credential mechanism, not the scheduler command.

The bundled [GitHub Actions template](../skills/memo/assets/spec-gc.yml) is for the private knowledge repository, not the Gei source repository. Copy it into that repository's `.github/workflows/` only when scheduling is wanted. It binds an empty temporary local store to that repository and runs weekly, using its scoped GitHub token. The default is preview; setting repository variable `GEI_SPEC_GC_APPLY=true` enables mechanical deletion. The template is shipped but never installed into a user's store automatically.

Actions cannot semantically verify a deployment or a missing checkout. Fully unattended semantic maintenance requires a separately configured agent using `spec_check` and the same Memo rules. The plugin does not start an AI service or require users to review a queue.
