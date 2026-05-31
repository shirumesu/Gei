# Current Work Reconciliation Event

Use this event when entries in `spec/current-work.md` must be reconciled with the current task state.

## Trigger

Trigger this event when any of these are true:

- a file-changing task or phase is ending and `spec/current-work.md` exists
- work expanded beyond an entry's `Expected scope`
- `Promotion` is still `pending` at a phase boundary
- a release, publish, handoff, checkpoint, or deliberate Memo sync is happening
- changed files exist but there is no reliable task intent except the current-work buffer or user statement

## Required Reading

Read:

1. `references/contracts/work-anchor.md`
2. `references/contracts/changelog.md` when changed files exist
3. `spec/current-work.md`
4. The smallest changed-file list or user summary needed to compare actual work against the selected entry
5. Other Memo contracts only if the reconciliation will update those documents

Do not read broad source files just to reconstruct intent. Use the selected current-work entry first, then inspect only the files needed to verify scope or decision-supporting evidence.

## Actions

1. Select the relevant current-work entry. Do not reconcile unrelated entries unless the user asked for cleanup.
2. Compare `Intent` and `Expected scope` with the actual changed-file surface.
3. Check whether `Resume`, `Progress`, and `Notes` are enough to resume the task without rereading the full diff. Prefer concise current-state, decision, and remaining-risk facts over verification-command logs.
4. Apply the promotion gate before writing any durable spec document.
5. If durable changelog value exists, add one concise typed entry under `spec/CHANGELOG.md` `## Unreleased`.
6. If structure, routing, commands, module boundaries, or major data flow changed, route the architecture update through `architecture-change.md`.
7. If a complex plan or handoff was explicitly accepted, update the owning task spec.
8. Set the entry to `closed`, `paused`, or `archived`; only remove entries that were already archived before this event or were archived during an explicit cleanup.

## Decision Standard

- No relevant file changes -> archive the entry with `Promotion: none`, or close it if the phase ended but the outcome is still uncertain.
- Stage-only work, failed attempts, exploratory checks, temporary debugging, or partial implementation with no durable outcome -> keep in `current-work.md`; do not promote yet.
- File changes with durable maintenance, release, rollback, user-visible, workflow, or future-agent value -> update `CHANGELOG.md` before archiving the entry.
- Architecture-visible change -> update `ARCHITECTURE.md` through the architecture event.
- Durable implementation plan is needed -> create or update a task spec.
- Intent is still uncertain -> capture a short `spec/INBOX.md` entry instead of guessing.
- No durable value after review -> set `Status: archived`, `Promotion: none`, and a short `Promotion note`.

Do not create separate backlog or general-purpose memory records. Future work is recorded only when the user explicitly asks for a separate plan or task spec.

## Completion Check

- The reconciled entry no longer contains stale active work.
- The selected entry can be resumed from `Intent`, `Resume`, `Progress`, and `Notes` without treating routine lint/test/build success as important context.
- `CHANGELOG.md` records only durable changed work under `Unreleased`.
- Any promoted document has the correct id and link.
- Entries not promoted to spec are explicitly marked `Promotion: none` with a short reason.
- No full task plan was invented from diff alone.
- Only necessary files were inspected.
