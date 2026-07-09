# Ship Event

Use this event when a task reaches a durable checkpoint, release, publication, or formal handoff.

Ship is the release boundary. Compress `spec/CHANGELOG.md` `## Unreleased` into a version or checkpoint section before finishing the ship event.

When a project has a release-specific memory entry, apply it before writing the ship record. Treat it as a checklist for project-local ordering, public-note style, publish boundaries, and post-release verification.

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
2. `spec/CHANGELOG.md`
3. Matching `spec/MEMORY.md` entries when a release, publish, tag, or project-specific ship workflow trigger applies
4. The public changelog or release notes file when the ship event publishes user-facing notes
5. The active spec-task file only when this is spec-backed work
6. `references/contracts/task-spec.md` only when updating the active spec-task file
7. `references/contracts/architecture.md` and `spec/ARCHITECTURE.md` only for the stale diagram audit or when architecture changed

## Actions

1. Ensure `CHANGELOG.md` `## Unreleased` has a typed entry for every durable change being shipped.
2. If the project has a version scheme or the user asked for a version, rename `Unreleased` to `## vX.Y.Z - YYYY-MM-DD`.
3. If the project has no fixed version scheme, rename `Unreleased` to `## Checkpoint YYYY-MM-DD` or `## Checkpoint YYYY-MM`.
4. Add or compress a `Summary` inside the version/checkpoint section.
5. Recreate a fresh `## Unreleased` section at the top.
6. When public release notes are part of the ship event, write them for the user-visible outcome and omit internal spec or verification logs unless the user explicitly wants operational notes.
7. Update the active spec-task file only when this work is explicitly spec-backed.
8. Run a stale diagram audit against `ARCHITECTURE.md` only when architecture changed or the release depends on diagram accuracy.
9. If a release publish step exists outside Memo, leave a clear handoff for Work's ship gate or the release workflow to commit, tag, push, publish, and verify the generated release.

Never invent metrics. If coverage, completion rate, or other evidence is unavailable, write `not measured` or `not instrumented`.

## Changelog Standard

`CHANGELOG.md` records closed outcomes and release/checkpoint summaries, not raw diary noise.

Each checkpoint should answer:

- what changed
- which files or areas changed

Mention exact paths or commit ids inline only when they materially help future agents recover the work; do not add standalone changed-file or commit-list sections.

Prefer user-visible or architecture-visible language over commit-diff narration.

Keep the active changelog focused on recent history. Compress noisy checkpoint sections in place when they make recent history hard to scan.

For public release notes, do not copy the internal `spec/CHANGELOG.md` mechanically. Convert internal outcomes into the language and locale expected by the project, and omit ignored internal spec state unless the user explicitly opted into publishing it.

## Publication Boundary

Memo records the durable ship state; it does not by itself prove that a release was published.

- Do not treat the ship event as complete merely because commits or tags were pushed.
- Do not force-add ignored `spec/`, cache, generated, or local-only files into a product release unless the user explicitly asks to publish those internal files.
- When the project has generated release artifacts, note the verification target so Work or the release workflow can confirm the release body and assets after publication.

## Completion Check

Before finishing:

- `CHANGELOG.md` has a fresh `Unreleased` section.
- The shipped work is represented by a version or checkpoint section.
- The version/checkpoint entries say what changed and which areas changed; inline path or commit mentions follow the changelog contract.
- The active task spec records final outcome only when the task was spec-backed.
- Architecture diagrams were checked when relevant.
- `CHANGELOG.md` `## Unreleased` is empty or reset after the shipped work moved into the version/checkpoint section.
- Public release notes, when present, are user-facing rather than an operation log.
- Any external publish, tag, release artifact, or generated release-note verification needed after Memo is recorded as a handoff or verified by the release workflow.
