# Anchor Reconciliation Event

Use this event when `spec/current-work.md` must be reconciled with the current task state.

## Trigger

Trigger this event when any of these are true:

- a file-changing task is ending and `spec/current-work.md` exists
- work expanded beyond the anchor's `Expected scope`
- `Durable record needed` is `yes` or `unknown` at a phase boundary
- a release, publish, handoff, checkpoint, or deliberate Memo sync is happening
- changed files exist but there is no reliable task intent except the current anchor or user statement

## Required Reading

Read:

1. `references/contracts/work-anchor.md`
2. `references/contracts/changelog.md` when changed files exist
3. `spec/current-work.md`
4. The smallest changed-file list or user summary needed to compare actual work against the anchor
5. Other Memo contracts only if the reconciliation will update those documents

Do not read broad source files just to reconstruct intent. Use the anchor first, then inspect only the files needed to verify scope or evidence.

## Actions

1. Compare `Intent` and `Expected scope` with the actual changed-file surface.
2. If relevant files changed, add one concise typed entry under `spec/CHANGELOG.md` `## Unreleased`.
3. If structure, routing, commands, module boundaries, or major data flow changed, route the architecture update through `architecture-change.md`.
4. If a complex plan or handoff was explicitly accepted, update the owning task spec.
5. Clear, close, pause, or overwrite `spec/current-work.md`.

## Decision Standard

- No relevant file changes -> close or clear the anchor only.
- Relevant file changes -> update `CHANGELOG.md` before closing or clearing the anchor.
- Architecture-visible change -> update `ARCHITECTURE.md` through the architecture event.
- Durable implementation plan is needed -> create or update a task spec.
- Intent is still uncertain -> capture a short `spec/INBOX.md` entry instead of guessing.

Do not create separate backlog or general-purpose memory records. Future work is recorded only when the user explicitly asks for a separate plan or task spec.

## Completion Check

- The anchor no longer contains stale active work.
- `CHANGELOG.md` records relevant changed work under `Unreleased`.
- Any promoted document has the correct id and link.
- No full task plan was invented from diff alone.
- Only necessary files were inspected.
