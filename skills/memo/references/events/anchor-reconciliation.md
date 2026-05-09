# Anchor Reconciliation Event

Use this event when `spec/current-work.md` must be reconciled with the current task state.

## Trigger

Trigger this event when any of these are true:

- a file-changing task is ending and `spec/current-work.md` exists
- work expanded beyond the anchor's `Expected scope`
- `Durable record needed` is `yes` or `unknown` at a phase boundary
- a release, publish, handoff, or deliberate Memo sync is happening
- changed files exist but there is no reliable task intent except the current anchor or user statement

## Required Reading

Read:

1. `references/contracts/work-anchor.md`
2. `spec/current-work.md`
3. The smallest changed-file list or user summary needed to compare actual work against the anchor
4. Other Memo contracts only if the reconciliation will update those documents

Do not read broad source files just to reconstruct intent. Use the anchor first, then inspect only the files needed to verify scope or evidence.

## Actions

1. Compare `Intent` and `Expected scope` with the actual changed-file surface.
2. Choose one close path:
   - **Close only:** task is verified and has no durable value.
   - **Promote to TODO:** work needs future tracking.
   - **Promote to task spec:** work is complex enough for handoff or multi-step execution.
   - **Promote to CHANGELOG:** a shipped or user-visible checkpoint happened.
   - **Promote to MEMORY:** a repeatable pitfall, durable rejection, or reusable project rule was found.
   - **Capture in INBOX:** evidence is insufficient for a canonical document.
3. Update only the documents required by the chosen path.
4. Clear, close, pause, or overwrite `spec/current-work.md`.

## Decision Standard

- Small verified edit with no future value -> close or clear the anchor.
- Follow-up work remains -> create or update `spec/TODO.md`.
- Durable implementation plan is needed -> create or update a task spec.
- User-visible shipped result -> update `spec/CHANGELOG.md`.
- Reusable lesson or hazard -> update `spec/MEMORY.md`.
- Intent is still uncertain -> capture a short `spec/INBOX.md` entry instead of guessing.

## Completion Check

- The anchor no longer contains stale active work.
- Any promoted document has the correct id and link.
- No full task plan was invented from diff alone.
- Only necessary files were inspected.
