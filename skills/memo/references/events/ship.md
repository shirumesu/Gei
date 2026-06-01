# Ship Event

Use this event when a task reaches a durable checkpoint, release, publication, or formal handoff.

Ship is also a lifecycle boundary. Reconcile relevant `spec/current-work.md` entries before finishing the ship event.

## Trigger

Trigger this event when any of these are true:

- a task was merged
- a task was released
- a task was shipped
- a user-visible checkpoint was reached
- a formal handoff happened and the result should be part of durable history
- `CHANGELOG.md` `Unreleased` should be compressed into a version or checkpoint section

## Required Reading

Read:

1. `references/contracts/changelog.md`
2. `references/contracts/work-anchor.md` and `spec/current-work.md` if the anchor exists
3. `spec/CHANGELOG.md`
4. The active spec-task file only when this is spec-backed work
5. `references/contracts/task-spec.md` only when updating the active spec-task file
6. `references/contracts/architecture.md` and `spec/ARCHITECTURE.md` only for the stale diagram audit or when architecture changed

## Actions

1. Reconcile relevant `spec/current-work.md` entries; if durable changed work exists, ensure `CHANGELOG.md` `Unreleased` has a typed entry.
2. If the project has a version scheme or the user asked for a version, rename `Unreleased` to `## vX.Y.Z - YYYY-MM-DD`.
3. If the project has no fixed version scheme, rename `Unreleased` to `## Checkpoint YYYY-MM-DD` or `## Checkpoint YYYY-MM`.
4. Add or compress `Summary`, `Changed Files`, and `Commits` inside the version/checkpoint section.
5. Recreate a fresh `## Unreleased` section at the top.
6. Update the active spec-task file only when this work is explicitly spec-backed.
7. Run a stale diagram audit against `ARCHITECTURE.md` only when architecture changed or the release depends on diagram accuracy.
8. Archive promoted entries in `spec/current-work.md`; clean only entries already marked archived.

Never invent metrics. If coverage, completion rate, or other evidence is unavailable, write `not measured` or `not instrumented`.

## Changelog Standard

`CHANGELOG.md` records closed outcomes and release/checkpoint summaries, not raw diary noise.

Each checkpoint should answer:

- what changed
- which files or areas changed
- which commits belong to the checkpoint, when available

Prefer user-visible or architecture-visible language over commit-diff narration.

Keep the active changelog focused on recent history. Compress noisy checkpoint sections in place when they make recent history hard to scan.

## Completion Check

Before finishing:

- `CHANGELOG.md` has a fresh `Unreleased` section.
- The shipped work is represented by a version or checkpoint section.
- Changed files and related commits are listed or marked unavailable.
- The active task spec records final outcome only when the task was spec-backed.
- Architecture diagrams were checked when relevant.
- `spec/current-work.md` no longer contains stale active work, and promoted shipped entries are archived.
