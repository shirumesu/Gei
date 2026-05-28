# Current Work Buffer Contract

Use this contract when Memo is reading, validating, closing, archiving, or promoting entries in `spec/current-work.md`.

## Responsibility

`current-work.md` records the intent and reconciliation state of active, paused, closed, and not-yet-archived file-changing tasks. It is a bounded work buffer, not a task spec, changelog, backlog, or diary.

Memo is the format authority for this file. Work and using-gei reference this contract for the entry shape and field rules.

## Anchor Format

Each entry uses this shape:

```md
# Current Work

## `#W-YYYYMMDD-NNN` - <short task label>

- Intent: <why this file-changing work is happening>
- Started: YYYY-MM-DD
- Expected scope: <files, directories, or "unknown until inspection">
- Durable record needed: unknown | yes | no
- Status: active | paused | closed | archived
- Promotion: pending | none | spec/CHANGELOG.md | spec/docs/#NNN-name.md | spec/ARCHITECTURE.md | spec/INBOX.md
- Promotion note: <optional short reason when promotion is none or delayed>
- Progress:
  - <one line per completed section or milestone, appended as work progresses>
- Evidence:
  - <command and observed result, appended after each verification run>
- Notes:
  - <cross-session constraints, pinned versions, known risks, or blockers>
```

Do not add `Author` or `Actor`.

## Field Definitions

**Intent** — one sentence explaining why this work exists. Must be concrete enough that a future agent reading only this file understands what the task is and why files changed.

**Expected scope** — the files and directories likely to change. Write "unknown until inspection" if genuinely unclear at start. Update as scope becomes known.

**Durable record needed** — whether the completed work deserves a permanent entry in a spec document. Set to `unknown` when unsure; decide before closing.

**Status** — lifecycle state of this entry:
- `active`: work is in progress. Do not overwrite or archive.
- `paused`: work will resume from this anchor. Do not overwrite or archive.
- `closed`: the task or phase ended, but whether to promote has not been decided.
- `archived`: promotion completed or judged unnecessary. May be removed during cleanup.

**Promotion** — where durable information from this entry will land, or `none` if no promotion is needed.

**Progress** — running append log. After each section or meaningful milestone completes, append one line describing what was done. This is the primary recovery surface for a new session picking up an in-progress task. Write each line when the section closes, not retroactively at the end.

**Evidence** — running append log of verification commands and observed outputs. Append after each verification run, not only at task end. Each line should be self-contained: command + result.

**Notes** — persistent constraints, pinned versions, known risks, or blockers that must survive across sessions. Append when a constraint is discovered. Do not clean this field during active work.

## Write Rules

Do not overwrite an `active` or `paused` entry when starting an unrelated task. Append a new entry instead and leave the old one in place until reconciliation marks it archived.

Update the existing entry when the current task is a direct continuation of that entry.

Append to `Progress`, `Evidence`, and `Notes` during work — not only at task end. A future session must be able to reconstruct current state from this file alone without reading git diff.

Do not infer a full plan from git diff when the anchor is missing — surface the gap instead.

## Close and Archive Rules

At every phase boundary, choose one of these transitions for each entry:

- **Closed:** work or phase ended, but whether to promote has not been decided.
- **Archived without promotion:** complete, no durable spec value. Set `Status: archived`, `Promotion: none`, add a short `Promotion note`.
- **Archived after promotion:** update the target Memo document first, then set `Status: archived` and point `Promotion` at that document.
- **Paused:** work will resume from this exact anchor.

Closing an entry does not imply promotion. Promotion requires the promotion gate in the reconciliation event.

Release, publish, handoff, and deliberate Memo sync are phase boundaries. Do not carry an old active entry across them without explicitly closing, pausing, or archiving it.

Cleanups may remove only entries already marked `archived`. Do not delete `active`, `paused`, or `closed` entries because a new task is starting.

## Completion Check

Before finishing a Memo update that touches `spec/current-work.md`:

- Each unarchived entry describes one task only.
- No stale `active` entry exists for work that has clearly ended.
- The close or archive choice is explicit.
- `Progress`, `Evidence`, and `Notes` reflect the actual work done, appended incrementally.
- Durable work has a spec entry only when it passed the promotion gate.
- Non-durable complete work is marked `Status: archived` with `Promotion: none`.
- `spec/` remains excluded from product commits unless the user explicitly opted in.
