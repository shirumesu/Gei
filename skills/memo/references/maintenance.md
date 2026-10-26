# Knowledge Maintenance

Use a maintenance hint, an explicit cleanup request, or a concrete stale claim as the trigger. `spec_check` returns a bounded worklist of three mechanical signals: a broken reference, repeated prose, and source drift. A clean signal set does not establish semantic quality or live correctness. Read the returned bodies and relevant evidence; paginate for an explicit wider audit, not on every ordinary task.

First assess continued value: merge duplicates, remove cheaply recoverable implementation summaries, and retire reasoning that no longer affects plausible work. If a document has no residual decision or recovery value, delete it. Do not keep it by rewording while the prose still looks valid. Do not rerun a retired architecture merely to justify deleting its history. Ordinary creation and correction are normal `spec_edit` batches. Keep evidence near the claims it supports.

Optional `sources` in YAML frontmatter lists checkout-relative files whose later commits should reopen the document. Pass that project's `checkout_root` when checking. A source whose last git commit is newer than the document's is a prompt to investigate, not proof the note is false. A missing source path means the listed file is not in the checkout. Age, low read counts, and project inactivity do not retire an applicable constraint.

An edit that saves a non-INDEX document must leave `type` and a one-line `description`, and `status` when `type` is `tasks`. Add those fields in the same batch when the document does not have them yet. `INDEX.md` is exempt. `sources` stays optional.

## Decide The Outcome

- **Correct or merge:** update the owning document, preserve useful conditions and reasons, and repair references. A source-file change is a prompt to read the source, not a deletion order.
- **Delete:** establish supersession, redundancy, or loss of recovery/reasoning value. Resolve incoming references and remove navigation in the same `spec_edit` batch. A link does not confer permanent retention, but its sentence cannot be discarded mechanically. Typical noise with no residual decision value: git push/sync or ahead-of-origin status; competitor comparison matrix snapshots; completed handoff progress tables or tasks rewritten to "completed" / "已完成"; deferred items and one-off research that no longer steer a live choice.

Dates and project inactivity alone do not retire applicable constraints or accepted work. Missing rationale prose does not establish missing value; inspect evidence without inventing a reason. Preserve reasons that can still change a decision, including accepted targets absent from code. Existing code, tests, and native docs can replace implementation summaries, not user requirements. "It might return someday" is insufficient to keep an otherwise retired architecture in active knowledge.

## Handoffs And Environment Observations

A handoff exists while recovery is needed; do not maintain a second active/completed tracker, and never rewrite a finished handoff to "completed" / "已完成" so it keeps occupying space. A final answer, Git commit, or quiet period does not prove completion. When the work is complete, cancelled, or replaced, first land any lasting knowledge, then delete the handoff and its route in that same `spec_edit` batch. If the outcome cannot be established, leave the handoff until it can.

Environment observations must pass the same admission test as other knowledge. Record the environment described, not the machine on which the note was written. A different environment does not invalidate a still-applicable lesson; a past installation or successful run alone does not earn a permanent record. Keep platform and version conditions on retained lessons. Delete the observation when it no longer applies. There is no destruction date and no mechanical cleanup of disposable notes.

## What The Check Does Not Do

`spec_check` does not delete, sample documents that have no signal, or score semantic validity, retention value, or live behavior. Confirmed deletions happen in `spec_edit` immediately. There is no archive search layer. Use current INDEX routes and current evidence in normal work. Version history and deletion backups are for an actual recovery task, not a routine second search. Do not add archive indexes, task inventories, or recurring full-store audits to ordinary sessions.

Honor a request to only report: run the check and do not edit. Otherwise, finish confirmed maintenance through `spec_edit`. Do not ask the user to maintain a queue.
