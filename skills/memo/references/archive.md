# Archive Cleanup

## Purpose

Use this reference when memo work is about trimming stale history out of the active spec system.

The goal is not to re-document the project. The goal is to keep `spec/` readable by moving closed or low-value history into `spec/archive/`.

## Scope Rule

If the user gave a specific archive request, follow that scope first.

If the user did not give a specific scope, use this default cleanup:

1. Move every item from `spec/TODO.md` `Done` into `spec/archive/TODO.md`.
2. Keep only the latest five version entries in `spec/CHANGELOG.md`; move older entries into `spec/archive/CHANGELOG.md`.
3. Review `spec/MEMORY.md` for entries that no longer belong in the active memory surface.

## Read Discipline

Keep this pass doc-first.

Read:

1. `spec/TODO.md`
2. `spec/CHANGELOG.md`
3. `spec/MEMORY.md`
4. any existing files in `spec/archive/`
5. the current `spec/docs/#NNN-work.md` only if it is needed to classify a borderline entry

Do not inspect code unless the user asked for it or the documents are too stale to classify an entry safely.

## Archive Layout

Create `spec/archive/` only when content is actually being moved.

Use these files:

- `spec/archive/TODO.md`
- `spec/archive/CHANGELOG.md`
- `spec/archive/MEMORY.md`

Keep each archive file organized by source surface. Do not mix TODO, MEMORY, and CHANGELOG material into one file.

## TODO Cleanup

During a default cleanup pass, move all items from the active `Done` section into `spec/archive/TODO.md`.

Rules:

- Preserve original TODO ids and close-out references.
- Keep the active `TODO.md` focused on backlog and currently relevant work.
- If the user asked to keep a recent completion visible, leave only that requested subset in `Done`.

## CHANGELOG Cleanup

Keep `spec/CHANGELOG.md` as the recent window, not the full historical ledger.

Rules:

- Retain the latest five version entries in `spec/CHANGELOG.md`.
- Move older version entries into `spec/archive/CHANGELOG.md`.
- Preserve release headings, dates, spec references, and resolved TODO ids.
- Do not rewrite old entries just to match a newer style unless the user asked for a full cleanup.

## MEMORY Cleanup

`spec/MEMORY.md` should keep only reusable project memory.

Keep entries in the active file only when they are likely to help again across multiple tasks, files, or sessions.

Archive candidates include entries such as:

- a note that only applies to one file or one transient patch
- a user rejection that reads like a casual one-off preference instead of a stable rule
- a narrow wording preference that is not general enough to guide future work
- a short-lived refusal or detour that no longer affects current decisions

When you find MEMORY archive candidates:

1. List them explicitly to the user.
2. Explain briefly why each one looks too local, too stale, or too weak to keep active.
3. Archive only the entries the user selects, unless the user already gave an explicit bulk-archive rule.

If an entry is clearly reusable, keep it active. When unsure, surface it instead of deciding silently.

## Archive Writing Rules

When moving content into `spec/archive/`:

- preserve original ids, dates, and cross-references
- keep the original wording unless a tiny edit is needed to keep the archive readable
- add a short archive note only when the reason is not obvious from context
- append or insert in a stable order that keeps later lookup easy

The archive is a recovery surface, not a second active workspace.

## Completion Check

Before finishing an archive cleanup pass, verify:

1. `spec/` is easier to scan than before.
2. No active file lost references that still matter.
3. `TODO.md`, `CHANGELOG.md`, and `MEMORY.md` now contain only current or reusable information.
4. `spec/archive/` contains everything removed from the active files.
5. No code inspection happened unless it was explicitly needed.
