# Init Event

Use this event when the project has no complete working spec system. Initialization creates a usable navigation layer, not a full project encyclopedia.

## Trigger

Trigger this event when any of these are true:

- `spec/` does not exist.
- One of `OVERVIEW.md`, `ARCHITECTURE.md`, `MEMORY.md`, `CHANGELOG.md`, `memory/`, `test/`, or `docs/` is missing.
- The current repo clearly has no working spec system yet.
- The project has no current `spec/docs/#NNN-{work-description}.md` for an accepted spec-backed task.

## Required Reading

Read:

1. `references/spec-system.md`
2. Contracts for every spec file you will create.
3. `references/writing-guide.md` only if you are writing the first full pass of several documents.

Use templates from `references/templates/` when creating files from scratch.

## Actions

1. Prefer `scripts/init-spec.py <project-path>` to create the `spec/` tree from bundled templates.
2. If the script reports existing spec-management markers, stop and surface the exact conflicting paths unless the user explicitly approves `--force`.
3. Scan the repo, docs, and recent history only enough to seed the first spec pass.
4. Write the first pass of `OVERVIEW.md`.
5. Write the first pass of `ARCHITECTURE.md`.
6. Ensure `MEMORY.md`, `CHANGELOG.md`, `spec/memory/`, `spec/test/`, and `spec/docs/` exist.
7. Create or update `spec/docs/#001-{work-description}.md` only when there is an accepted spec-backed task.
8. Keep `MEMORY.md` as a short retrieval index. Do not seed detailed memory entries unless a durable project-specific rule already passes the Memo memory write gate.
9. Record the document map in `OVERVIEW.md` and routing rules in `ARCHITECTURE.md` so future agents know which document to read first.

## Script Rules

Use `scripts/init-spec.py` for fresh bootstrap when possible.

Rules:

- Refuse to initialize when the target project already contains `spec/` or other likely plan-management markers; surface the exact conflicting paths.
- Continue with `--force` only when the user explicitly wants it.
- If `git` is unavailable, skip all git-related work.
- If `.gitignore` exists, append the `spec/` ignore block without overwriting the file.

## Completion Check

Before finishing:

- The required `spec/` layout exists.
- The active spec-task file uses the next correct id when one was created.
- `OVERVIEW.md` explains the project and points to the next spec files.
- `ARCHITECTURE.md` has enough routing context for a future agent.
- `MEMORY.md` exists as a concise trigger-shaped index, and `spec/memory/` exists for future entries.
- `CHANGELOG.md` has an `Unreleased` section.
- All newly created files follow their contracts.
