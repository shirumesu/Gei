# Changelog Contract

Use this contract when creating or updating `spec/CHANGELOG.md`.

## Responsibility

`CHANGELOG.md` records durable closed file-changing work and durable release or checkpoint history. It is not a diary and not a raw git log.

Closed work enters `CHANGELOG.md` only when it passes the durable relevance gate: it changes behavior, release contents, rollback expectations, architecture, workflow rules, public files, or future-agent maintenance context. Release or checkpoint events compress `Unreleased` into a named version or checkpoint.

Do not add entries for stage-only work, failed attempts, exploratory checks, temporary debugging, partial work with no durable outcome, or mechanical edits that future agents do not need to recover.

## Entry Shape

Use this shape when creating the file:

```md
# Changelog

## Unreleased

### Summary
Pending.

### feat
- Add the new workflow. Commit: `pending`

### fix
- Correct stale anchor reconciliation. Commit: `abc1234`
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

### Changed Files
- `path/to/file`

### Commits
- `abc1234`
```

Keep the typed entries if they are still useful. Compress noisy entries into the summary when the section is too long.

## Checkpoint Rules

Do not let `Unreleased` grow without bound. Create a checkpoint when any of these are true:

- `Unreleased` has more than 20 entries.
- The current active work cycle has been stable for 7-14 days.
- The user asks to organize, close, release, or publish work.
- The accumulated entries are making recent history hard to scan.

Keep `Unreleased` and recent version/checkpoint sections concise enough that the active file remains useful.

## Write Rules

- Record the outcome in one concise bullet.
- Include `Commit: pending` until a short commit id exists.
- Mention exact paths only when they help future agents find the changed area.
- Do not require task specs, evidence blocks, or release metrics for ordinary task close entries.
- Never invent metrics. If a release/checkpoint summary needs evidence and none exists, write `not measured` or `not instrumented`.

## Completion Check

- `Unreleased` exists after every update.
- Durable closed file-changing work has one concise typed entry.
- Commit ids are present or explicitly `pending`.
- Version/checkpoint sections are scan-friendly and not raw implementation diaries.
