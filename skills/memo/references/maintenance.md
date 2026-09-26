# Knowledge Maintenance

Use a maintenance hint, an explicit cleanup request, or a concrete stale claim as the trigger. `spec_check` provides a bounded worklist of deterministic signals and rotating review samples. A clean signal set does not establish semantic quality or live correctness. Read the returned bodies and relevant evidence; paginate for an explicit wider audit, not on every ordinary task. Tool schemas own arguments and lifecycle defaults.

First assess continued value: merge duplicates, remove cheaply recoverable implementation summaries and retire reasoning that no longer affects plausible work. Then verify the retained claims. Do not rerun a retired architecture merely to justify deleting its history. Ordinary creation and correction need no review transaction; complete a review only when current evidence establishes the whole resulting document's validity and applicability. Keep evidence near the claims it supports, not as accumulated verification logs.

## Decide The Outcome

- **Verify:** establish that the retained document earns its place and its claims and applicability hold, including corrections in the same batch. A mechanical check or possible future usefulness alone is not verification.
- **Correct or merge:** update the owning document, preserve useful conditions and reasons, and repair references. A correction can stand on its own while other claims remain unreviewed. A source-file change is a prompt to investigate, not proof the note is false.
- **Delete:** establish supersession, redundancy, or loss of recovery/reasoning value. Resolve substantive incoming dependencies and remove navigation in the same `spec_edit` batch. A link does not confer permanent retention, but its sentence cannot be discarded mechanically.
- **Defer:** identify the missing evidence and submit `defer`. This records an attempt without renewing verification. Do not guess that an inaccessible checkout, another environment, or an old project no longer matters. A cooldown prevents repeated inconclusive checks.

Dates, low read counts and project inactivity alone do not retire applicable constraints or accepted work. Missing rationale prose does not establish missing value; inspect evidence without inventing a reason. Preserve reasons that can still change a decision, including accepted targets absent from code. Existing code/tests/native docs can replace implementation summaries, not user requirements. “It might return someday” is insufficient to keep an otherwise retired architecture in active knowledge.

## Handoffs And Environment Observations

A handoff exists while recovery is needed; do not maintain a second active/completed tracker. A final answer, Git commit, or quiet period does not prove completion. When the work is complete, cancelled, or replaced, first land any lasting knowledge, then delete the handoff and its route in that batch. If the outcome cannot be established, defer.

Environment observations must pass the same admission test as other knowledge. Record the environment described, not the machine on which the note was written. A different environment does not invalidate a still-applicable lesson; a past installation or successful run alone does not earn a permanent record. Keep platform/version conditions on retained lessons.

## Mechanical Cleanup

`spec_gc` previews by default. It only applies predeclared destruction dates to transient records and removes unambiguous navigation links. Substantive references block mechanical deletion and become review work. Ordinary knowledge, handoffs, legacy metadata, and unknown environments do not acquire destruction dates automatically.

Honor a preview-only request: report the scope without modifying knowledge or its review state. Otherwise, confirmed semantic maintenance is completed through `spec_edit`; do not ask the user to maintain a queue. Scheduled GC uses the same CLI core and cannot perform semantic review.

There is no archive search layer. Use current INDEX routes and current evidence in normal work. Version history/deletion backups are for an actual recovery task, not a routine second search. Do not add archive indexes, task inventories, or recurring full-store audits to ordinary sessions.

For requested scheduling, use the shared [GC runner](../scripts/spec/gc-run.mjs) (`--help`) or [Actions template](../assets/spec-gc.yml). Both default to preview; do not install or enable a user's automatic cleanup schedule merely because the package includes them.
