# Changelog Contract

Use this contract when creating or updating `spec/CHANGELOG.md`.

## Responsibility

`spec/CHANGELOG.md` is the project's single task tracker. It records durable changed work and durable release or checkpoint history. There is no separate `current-work` ledger: changelog-worthy work is recorded here at completion, and release events compress `## Unreleased` into a named version or checkpoint.

`## Unreleased` holds work that is done but not yet released. A release renames it to a version section. This is the surface a future agent reads to learn what changed recently and what is waiting to ship.

It is not a diary and not a raw git log.

## What To Record

Add one concise typed entry under `## Unreleased` when changed work passes the durable relevance gate: it changes behavior, release contents, rollback expectations, architecture, workflow rules, public files, or future-agent maintenance context.

Do not add entries for stage-only work, failed attempts, exploratory checks, temporary debugging, partial work with no durable outcome, pure reads, or mechanical edits future agents do not need to recover (a typo fix, a local rename already proven by build).

Record the entry at completion, not before starting. In-progress work needs no entry. Work that genuinely must be resumed across sessions belongs in a `spec/docs/#NNN-{work-description}.md` task spec, not here.

## Who Writes It

- Work may append a single typed line under `## Unreleased` at task close. This is a trivial append and does not require invoking Memo.
- Memo owns every other `CHANGELOG.md` operation: the release or checkpoint transition, the `Summary`, compaction, and any architecture, overview, or memory promotion that the same work also requires through its own event.

## Entry Shape

Use this shape when creating the file:

```md
# Changelog

## Unreleased

### Summary
Pending.

### feat
- Add the new workflow.

### fix
- Correct the stale routing check.
```

Use conventional type headings such as `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`, `perf`, and `breaking`. Omit empty type headings.

## Release Or Checkpoint Shape

For projects with versions, rename `Unreleased` to:

```md
## v1.0.0 - YYYY-MM-DD
```

For projects without a fixed version scheme, use:

```md
## Checkpoint YYYY-MM-DD
```

A released or checkpointed section may include:

```md
### Summary
- Short outcome summary.
```

Keep the typed entries if they are still useful. Compress noisy entries into the summary when the section is too long. Do not add standalone changed-file or commit-list sections; mention an exact path or commit inline only when it materially helps future agents recover the work.

## Checkpoint Rules

Do not let `Unreleased` grow without bound. Create a checkpoint when any of these are true:

- `Unreleased` has more than 20 entries.
- The current active work cycle has been stable for 7-14 days.
- The user asks to organize, close, release, or publish work.
- The accumulated entries are making recent history hard to scan.

Keep `Unreleased` and recent version/checkpoint sections concise enough that the active file remains useful.

## Write Rules

- Record the outcome in one concise bullet.
- Mention exact paths or commit ids only when they help future agents find or verify the changed area.
- Do not require task specs, evidence blocks, or release metrics for ordinary task close entries.
- Never invent metrics. If a release/checkpoint summary needs evidence and none exists, write `not measured` or `not instrumented`.

## Completion Check

- `Unreleased` exists after every update.
- Durable closed file-changing work has one concise typed entry.
- Version/checkpoint sections are scan-friendly and not raw implementation diaries.
