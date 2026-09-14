# Knowledge Maintenance

Use a maintenance hint, an explicit cleanup request, or a concrete stale claim as the trigger. `spec_check` returns reasons, evidence routes, incoming references, and a revision. Work on the returned bounded scope; paginate for an explicit wider audit, not on every ordinary task. Read candidate bodies and the relevant evidence before deciding. Tool schemas own arguments and lifecycle defaults.

Ordinary creation and correction save knowledge without requiring a review. Complete a review when current evidence establishes the validity and applicability of the whole resulting document. Keep evidence near the claims it supports; a review can briefly refer to that evidence. A dated environment observation normally uses knowledge with a 30-day review interval, not a destruction deadline.

## Decide The Outcome

- **Verify:** establish that the whole document and its applicability still hold, including any corrections made in the same batch. Elapsed time or possible future usefulness alone does not establish verification.
- **Correct or merge:** update the owning document, preserve useful conditions and reasons, and repair references. A correction can stand on its own while other claims remain unreviewed. A source-file change is a prompt to investigate, not proof the note is false.
- **Delete:** establish supersession, redundancy, or loss of recovery/reasoning value. Resolve substantive incoming dependencies and remove navigation in the same `spec_edit` batch. A link does not confer permanent retention, but its sentence cannot be discarded mechanically.
- **Defer:** identify the missing evidence and submit `defer`. This records an attempt without renewing verification. Do not guess that an inaccessible checkout, another environment, or an old project no longer matters. A cooldown prevents repeated inconclusive checks.

Dates, low read counts, and project inactivity are never sufficient reasons to delete ordinary knowledge. A decision's rationale can remain useful after the implementation changes. Native docs can replace cheaply recoverable code facts, but not an unrecorded user requirement.

## Handoffs And Environment Observations

A handoff exists while recovery is needed; do not maintain a second active/completed tracker. A final answer, Git commit, or quiet period does not prove completion. When the work is complete, cancelled, or replaced, first land any lasting knowledge, then delete the handoff and its route in that batch. If the outcome cannot be established, defer.

Record the environment a claim describes, not the machine on which the note was written. Reinstallation or a different environment makes an observation unconfirmed here; it does not invalidate another machine's state. Keep platform/version conditions on reusable lessons. Never promote an old installation, deployment, or permission observation into a current global fact.

## Mechanical Cleanup

`spec_gc` previews by default. It only applies predeclared destruction dates to transient records and removes unambiguous navigation links. Substantive references block mechanical deletion and become review work. Ordinary knowledge, handoffs, legacy metadata, and unknown environments do not acquire destruction dates automatically.

Honor a preview-only request: report the scope without modifying knowledge or its review state. Otherwise, confirmed semantic maintenance is completed through `spec_edit`; do not ask the user to maintain a queue. Scheduled GC uses the same CLI core and cannot perform semantic review.

There is no archive search layer. Use current INDEX routes and current evidence in normal work. Version history/deletion backups are for an actual recovery task, not a routine second search. Do not add archive indexes, task inventories, or recurring full-store audits to ordinary sessions.

For requested scheduling, use the shared [GC runner](../scripts/spec/gc-run.mjs) (`--help`) or [Actions template](../assets/spec-gc.yml). Both default to preview; do not install or enable a user's automatic cleanup schedule merely because the package includes them.
