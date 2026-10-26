# Knowledge Maintenance

Use a maintenance hint, an explicit cleanup request, or a concrete stale claim as the trigger. `spec_check` returns a bounded worklist of mechanical signals: a broken reference, a topic note not linked from its README (`orphan_note`), repeated prose, and source drift. A clean signal set does not establish semantic quality or live correctness. Read the returned bodies and relevant evidence. Paginate for an explicit wider audit, not on every ordinary task.

First assess continued value. Merge duplicates, remove cheaply recoverable implementation summaries, and retire reasoning that no longer affects plausible work. If a document has no residual decision or recovery value, delete it. Reading, importing, or rewording does not by itself earn retention, including when the prose still looks valid. Do not rerun a retired architecture merely to justify deleting its history. Ordinary creation and correction are normal `spec_edit` batches. Keep evidence near the claims it supports.

Optional `sources` in YAML frontmatter lists checkout-relative files whose later commits should reopen the document. Pass that project's `checkout_root` when checking. A source whose last git commit is newer than the document's is a prompt to investigate, not proof the note is false. A missing source path means the listed file is not in the checkout. Age, low read counts, low frequency, and project inactivity do not retire an applicable constraint.

Add missing frontmatter in the same batch. Requirements are in [Memo Shape](../SKILL.md). A document with invalid frontmatter is omitted from the catalog until a later edit makes it valid.

An edit that saves a non-INDEX document must leave `type` and a one-line `description` (what the document covers and when to read it), and `status` when `type` is `tasks`. Add those fields in the same batch when the document does not have them yet. `INDEX.md` is exempt. `sources` stays optional.

## Decide The Outcome

- **Correct or merge:** update the owning document, preserve useful conditions and reasons, and repair references. A source-file change means read the source; it is not a deletion order.
- **Delete:** establish supersession, redundancy, or loss of recovery or reasoning value. Repair incoming links that remain outside the generated catalog, including a hand-written link in the INDEX header. A link does not confer permanent retention, but its sentence cannot be discarded mechanically. Typical noise with no residual decision value: admission-gate status (see [admission](admission.md)); competitor comparison matrix snapshots; a second "completed" / "已完成" ledger; a finished task left at `status: done`; deferred items and one-off research that no longer steer a live choice. Delete a finished task after its conclusions are in a decision or fact.

Dates and project inactivity alone do not retire applicable constraints or accepted work. Missing rationale prose does not establish missing value. Inspect evidence without inventing a reason. Preserve reasons that can still change a decision, including accepted targets absent from code. Existing code, tests, and native docs can replace implementation summaries, not user requirements. "It might return someday" is insufficient to keep an otherwise retired architecture in active knowledge.

## Handoffs And Environment Observations

A handoff exists while recovery is still needed. When the work is done, lift lasting conclusions into a decision or fact, then delete the task. Do not leave `status: done`. Completion is in [admission](admission.md) and [notes](notes.md). A final answer, Git commit, or quiet period does not prove completion. Delete cancelled or replaced work that has no remaining recovery value, including its route. If the outcome cannot be established, leave the handoff until it can.

Environment observations must pass the same admission test as other knowledge. Record the environment described, not the machine on which the note was written. A different environment does not invalidate a still-applicable lesson. A past installation or successful run alone does not earn a permanent record. Keep platform and version conditions on retained lessons. Delete the observation when it no longer applies. There is no destruction date and no mechanical cleanup of disposable notes.

## What The Check Does Not Do

`spec_check` does not delete, sample documents that have no signal, or score semantic validity, retention value, or live behavior. Confirmed deletions happen in `spec_edit` immediately. There is no archive search layer. Use current INDEX routes and current evidence in normal work. Version history and deletion backups are for an actual recovery task, not a routine second search. Do not add a second hand-written task inventory. `tasks/INDEX.md` is the generated list. Do not add archive indexes or recurring full-store audits to ordinary sessions.

Honor a request to only report: run the check and do not edit. Otherwise, finish confirmed maintenance through `spec_edit`. Do not ask the user to maintain a queue.
