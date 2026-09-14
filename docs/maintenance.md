# Spec maintenance

Spec keeps current knowledge and deletes records whose purpose has ended. There is no archive directory, secondary search, or user-managed review inventory. Age triggers review, never deletion of ordinary knowledge or an inactive project. Memo owns semantic judgment; the CLI and MCP share deterministic checks and atomic storage.

## Check and review

Use `node <gei>/bin/gei.mjs spec check --scope projects/example/` (or `--all` for an explicit full-store audit). The Skills package uses `<memo>/scripts/spec/cli.mjs`. MCP exposes the same operation as `spec_check({path_prefix: "projects/example/"})`. Scope is explicit so a runtime installation directory cannot accidentally select the wrong project.

Checks return 10 candidates by default, their reasons, evidence routes, incoming references, counts, and a revision. `--limit`, `--offset`, and `--revision` paginate a fixed snapshot. `--checkout-root` enables source-file comparisons for one explicit project; without the checkout those sources are unavailable, not invalid. All knowledge bodies are inspected to find cross-project incoming dependencies, but only the requested scope enters the worklist. This is a read-only operation on knowledge; it updates local check cadence/cache.

Candidates include invalid metadata, changed or unverified content, review dates, unavailable/changed evidence, unconfirmed environments, broken links, and expired transient retention. Low usage is not measured. Textual or unsupported Markdown references are conservative dependencies when they name a path relative to the referring document or the knowledge root; a shared basename does not connect unrelated projects. False positives still require semantic review, not mechanical deletion. A source fingerprint change only asks for investigation.

Ordinary `spec_edit` calls need only edits and a summary. Creation and correction preserve existing lifecycle state without initializing a new record or renewing whole-document verification. Documents without metadata remain ordinary Markdown; missing state alone does not create a maintenance candidate. Add optional `reviews` when an explicit semantic review has been completed. Each review has a path, outcome and concise `basis`:

- `verify` confirms the entire resulting document against current evidence, with or without accompanying edits. The basis can reference evidence already in the document.
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

Pass this through `spec edit --input FILE`, or use the same structured arguments with MCP. `checkout_root` plus a review's repository-relative `sources` captures optional file hashes. Actual checkout paths are not stored. `scope.environment` identifies the target environment, using the local instance returned by `spec_check`; it is not the author's machine. New runtime state creates a new instance. A mismatch marks a claim unconfirmed here, without deleting another host's facts. Restoring the same runtime state also restores its instance identity.

## Metadata and legacy knowledge

Each document is one Markdown file. Optional lifecycle state lives in its own `gei` frontmatter field. The runtime owns that field through structured `reviews`; agents maintain substantive content and supply review outcomes and evidence, without manually calculating timestamps or hashes. Plain INDEX, topic and note files need no header until an actual review requires state.

Read, search, exact edits, range edits, error contexts, and reference locations use the complete stored Markdown and its physical lines, including frontmatter. There is no hidden read mode, virtual document view, or line offset conversion. Reads remain bounded and can start at any physical line, so editing a tail section does not require reading the header. Startup INDEX injection still uses the body because it is a compact routing surface, not an editing view.

The managed field is a multiline JSON-as-YAML flow mapping, extending the previous single-line JSON format without adding a YAML dependency:

```markdown
---
gei: {
    "version": 4,
    "kind": "knowledge",
    "review_days": 90,
    "verified_at": "2026-09-14T08:00:00Z",
    "verified_hash": "<runtime-generated SHA-256>",
    "basis": "Current evidence recorded beside the claims"
  }
---
# A durable constraint

The actual knowledge and its supporting evidence.
```

Ordinary edits preserve the existing managed block byte for byte, including when a whole-document replacement omits it. A review updates only that block; the rest of the frontmatter, comments, BOM, body and newline bytes are not reformatted. Stable multiline serialization keeps individual field changes local in Git diff. New verification uses version 4 and hashes the content outside the managed field, including meaningful user frontmatter. Review deadlines are calculated from `verified_at` and `review_days`; new verification no longer stores `created_at` or redundant `review_after`. Prior version 1–3 baselines remain readable, and explicit verification adopts the current format. Historical evidence is not treated as a substantive document reference by GC; reference positions still use physical lines.

The existing `rename` operation carries the complete file without renewing state; repair incoming and relative links in the same batch. Deletion, GC, local recovery and GitHub commits likewise operate on the complete file. Semantic deletion and link repairs remain atomic. Plain documents still receive structural link checks, but absence of a review baseline does not establish that their knowledge is invalid.

### Migration from separate metadata

Existing `metadata/<document-path>.json` records remain readable for compatibility and move into their document when it is written. Reads, checks, startup hooks and storage import/export never silently migrate content. For a whole-store migration, run `spec migrate-metadata --all` (or `--scope projects/example/`). The preview identifies the destination as Markdown and reports candidate and blocked paths. Apply with `spec migrate-metadata --all --apply --base-revision REV` from that preview. The Markdown update and old JSON removal form one transaction or GitHub commit. Repeating the operation is a no-op; documents already using embedded metadata retain their existing formatting until a review changes it.

Migration preserves verification dates, review deadlines, destruction declarations and deferred conditions. Existing hash bridges remain only as long as needed to preserve deployed baselines; migration may add a bridge for old formats whose BOM/header hash input differs. A content change invalidates that bridge, and explicit verification removes it. Conflicting embedded/separate records, invalid JSON/state or orphan records block bulk migration without losing either copy. An evidence-based `verify` can rebuild invalid state; reading it does not make it verified or eligible for deletion.

Upgrade writers and the scheduled GC runtime together before migrating a shared store, and restart long-lived MCP processes. Older writers may move embedded state back to separate files or misread multiline fields. Until that coordinated upgrade, the new runtime can read the existing separate records. The bundled Actions template targets the matching release tag; a development build that has not been published needs its tested runtime supplied to the scheduled job. Previously issued physical-Markdown revisions keep their coordinate contract; a migration changes the content revision and requires a fresh read before subsequent edits.

MCP check/GC text is a formatted worklist containing reasons, relevant evidence, environment conditions, retention declarations and reference locations. The CLI uses the same presentation by default; `--json` requests structured output for scripts. Neither maintenance representation includes internal content/defer fingerprints. This formatting does not hide the actual frontmatter in ordinary read/search results.

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
