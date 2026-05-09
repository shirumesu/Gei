# Archive Cleanup

Use this reference when active spec files are noisy with stale closed history.

Archive cleanup is a maintenance event. It should make the active spec surface easier to read without losing useful history.

## Default Scope

By default, archive cleanup only manages `spec/CHANGELOG.md`.

Read:

1. `spec/CHANGELOG.md`
2. `spec/archive/CHANGELOG.md` if it exists
3. the active spec-task file only if it is needed to classify a borderline release or checkpoint section

Do not read code unless the user asked for it or the docs are too stale to classify an entry safely.

## Archive Layout

Use:

```text
spec/archive/
  CHANGELOG.md
```

Create `spec/archive/` only when content is actually moved there.

## Changelog Cleanup

Keep active `spec/CHANGELOG.md` focused on recent history:

- Always keep `## Unreleased`.
- Keep the latest five version or checkpoint sections.
- Move older sections into `spec/archive/CHANGELOG.md`.
- Preserve headings, dates, changed files, commit ids, and summaries.

Do not split a single version or checkpoint section across active and archive files.

## Completion Check

- Active `CHANGELOG.md` contains `Unreleased` plus only the latest relevant sections.
- Archived sections are present in `spec/archive/CHANGELOG.md`.
- No active project state was moved into archive.
- No unrelated spec files were rewritten.
