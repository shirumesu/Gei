# Spec System

Use this reference when initializing or changing the overall `spec/` layout.

## Default Layout

```text
spec/
  OVERVIEW.md
  ARCHITECTURE.md
  MEMORY.md
  CHANGELOG.md
  memory/
  docs/
```

This is a default, not a requirement for repositories with an existing documentation system.

## Document Roles

- `OVERVIEW.md`: small project map and where to read next
- `ARCHITECTURE.md`: durable structure, boundaries, flows, and impact routes
- `MEMORY.md` plus `memory/`: reviewed index and non-obvious project knowledge
- `CHANGELOG.md`: explicit internal releases or durable checkpoints
- `docs/`: optional task references needed for handoff or cross-session recovery
- `INBOX.md`: optional temporary capture whose durable destination is not yet known

## Read And Write Judgment

Start from `OVERVIEW.md`, then load only the document that can change the current decision. Treat code, configuration, tests, build scripts, and Git history as authoritative.

Update one document when one document owns the fact. Link to code, tests, schemas, mockups, or artifacts instead of restating them. Do not refresh all files after ordinary work.

Use repository-native naming and structure when established. Otherwise keep filenames stable and task-reference slugs concise; numeric ids are optional unless the project already relies on them.

## Version Control

Gei initializes `spec/` as internal state by default, but initialization must not silently create a Git repository, overwrite existing files, or change version-control policy. Any Git initialization, ignore rule, or publish decision should be explicit.

## Acceptance

- Each document has one clear role.
- The layout supports retrieval without duplicating project sources of truth.
- Optional documents were created only for a current need.
- Existing project documentation and version-control policy were preserved.
