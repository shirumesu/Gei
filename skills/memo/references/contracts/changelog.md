# Changelog Contract

Use this contract when creating or updating `spec/CHANGELOG.md`.

## Responsibility

`CHANGELOG.md` records shipped outcomes and durable checkpoints. It is not a diary and not a commit log.

## Entry Shape

Use this shape when creating the file:

```md
# Changelog

## V0.0.1

### [#001](docs/#001-work.md)

- Summary:
- Impact:
- Resolved TODOs:
- Deferred TODOs:
- Evidence:
- Git Commit: `ID` (optional)
```

## Required Content

Each shipped entry should answer:

- what changed
- why it mattered
- which spec doc tracked it
- which TODO ids it resolved or deferred
- what evidence exists

## Write Rules

- Record outcomes first, then impact.
- Prefer user-visible or architecture-visible language over commit-diff narration.
- Reference spec docs and resolved or deferred TODO ids.
- Never invent metrics.
- If evidence is unavailable, write `not measured` or `not instrumented`.
- Keep only the latest five version entries in active `CHANGELOG.md` during archive cleanup; move older entries to `spec/archive/CHANGELOG.md`.

## Completion Check

- The entry references the owning spec doc.
- Resolved and deferred TODO ids are present or explicitly none.
- Evidence is concrete or marked unavailable.
- The entry describes the outcome, not raw implementation noise.
