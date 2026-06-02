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
- Status: active | paused | closed | archived
- Promotion: pending | none | spec/CHANGELOG.md | spec/OVERVIEW.md | spec/ARCHITECTURE.md | spec/docs/#NNN-name.md | spec/INBOX.md | comma-separated target list
- Promotion note: <optional short reason when promotion is none or delayed>
- Resume: <active/paused only: where the work stands now · the next concrete step · what blocks it>
- Progress:
  - <one line per closed section or milestone — the decision, diagnosis, or deviation, not just what was added>
- Evidence:
  - <optional verbatim artifact backing a claim above — exact error string, symbol, file:line, or external constraint>
- Notes:
  - <cross-session constraints, pinned versions, known risks, or blockers>
```

Do not add `Author` or `Actor`.

## Field Definitions

**Intent** — one sentence explaining why this work exists. Must be concrete enough that a future agent reading only this file understands what the task is and why files changed.

**Expected scope** — the files and directories likely to change. Write "unknown until inspection" if genuinely unclear at start. Update as scope becomes known.

**Status** — lifecycle state of this entry:
- `active`: work is in progress. Do not overwrite or archive.
- `paused`: work will resume from this anchor. Do not overwrite or archive.
- `closed`: the task or phase ended, but whether to promote has not been decided.
- `archived`: promotion completed or judged unnecessary. May be removed during cleanup.

**Promotion** — where durable information from this entry will land, or `none` if no promotion is needed. It may name one target document or a comma-separated target list when the same entry has durable value in multiple spec surfaces. `pending` also means the durable-record decision itself has not been made yet; decide it before archiving.

**Resume** — for an `active` or `paused` entry, the single most important recovery fact: where the work stands now, the next concrete step, and anything blocking it. This is the first thing a returning agent reads. It is the one field you **overwrite** as state moves, not append to (unlike `Progress`). Leave empty (`—`) for `closed` or `archived` entries.

**Progress** — append-only history, one line per closed section or milestone, written when it closes (not retroactively). Bias each line toward what the diff and the task spec cannot show on their own: the decision made and why, an alternative ruled out, a root cause diagnosed, or a deviation from the plan. A bare restatement of what was added ("added route X, component Y") has little recovery value — the diff already shows it. The current tip and next step live in `Resume`, not here.

**Evidence** — optional. The raw artifact behind a `Progress`, `Resume`, or `Notes` claim that must survive verbatim: an exact error string, a symbol or `file:line`, an external API or version constraint, a short excerpt. It is the proof, not the conclusion — the conclusion belongs in `Progress`/`Notes`; `Evidence` is what you would quote to defend it. Never a command log: do not record routine passing lint/test/build runs, and do not search for something to fill this field. If you have a claim but no artifact worth quoting verbatim, leave `Evidence` empty.

**Notes** — persistent constraints, pinned versions, known risks, or blockers that must survive across sessions. Append when a constraint is discovered. Do not clean this field during active work.

## Examples

`Progress` — record the decision behind a change, not a restatement of the diff:

- Low value: `[Section 1] Added the /plugin route, sidebar entry, and page scaffold.` — the diff already shows this.
- High value: `[Block 1] Replaced the mock runtime with real Main lifecycle APIs; routed plugin file/path reads through Main/preload because renderer fs/path stubs were silently blocking installed main.js.`

`Evidence` — a verbatim artifact, never a routine run:

- Keep: `paddleocr ensureServedFromHttp throws when location.protocol === "file:"` — the exact reason packaged `file://` fails; backs the `neopot://` decision.
- Drop: `npm run test => 87 pass, 0 fail` — routine run; record it nowhere.

## Write Rules

Do not overwrite an `active` or `paused` entry when starting an unrelated task. Append a new entry instead and leave the old one in place until reconciliation marks it archived.

Update the existing entry when the current task is a direct continuation of that entry.

Append to `Progress` and `Notes` during work — not only at task end. Keep `Resume` current by overwriting it as the work moves; it is the one field you rewrite rather than append. Add `Evidence` only when a raw artifact is worth quoting verbatim. A future session must be able to reconstruct current state from this file alone without reading git diff.

When the task has a spec-task doc (`spec/docs/#NNN`), do not restate its plan, scope, or file list here. The spec-task holds the plan; this entry tracks progress against it plus in-flight decisions, deviations, and the current `Resume` state.

Do not infer a full plan from git diff when the anchor is missing — surface the gap instead.

## Close and Archive Rules

At every phase boundary, choose one of these transitions for each entry:

- **Closed:** work or phase ended, but whether to promote has not been decided.
- **Archived without promotion:** complete, no durable spec value. Set `Status: archived`, `Promotion: none`, add a short `Promotion note`.
- **Archived after promotion:** update the target Memo document or documents first, then set `Status: archived` and point `Promotion` at the promoted target or targets.
- **Paused:** work will resume from this exact anchor.

Closing an entry does not imply promotion. Promotion requires the promotion gate in the reconciliation event.

Release, publish, handoff, and deliberate Memo sync are phase boundaries. Do not carry an old active entry across them without explicitly closing, pausing, or archiving it.

Cleanups may remove only entries already marked `archived`. Do not delete `active`, `paused`, or `closed` entries because a new task is starting.

When the user explicitly asks to clean up `current-work.md`, Memo may remove entries archived during that cleanup only after the promotion decision is complete: either the durable target document was updated and named in `Promotion`, or the entry is marked `Promotion: none` with a short `Promotion note`. Never remove a `closed` entry with `Promotion: pending`; decide its promotion target first.

## Completion Check

Before finishing a Memo update that touches `spec/current-work.md`:

- Each unarchived entry describes one task only.
- No stale `active` entry exists for work that has clearly ended.
- The close or archive choice is explicit.
- For an `active` or `paused` entry, `Resume` states the current position, the next concrete step, and any blocker — enough to pick up without reading the diff.
- `Progress` records decisions, diagnoses, and deviations, not just a restatement of what the diff already shows.
- `Evidence`, when present, is a verbatim artifact backing a claim — never a routine command log.
- Durable work has a spec entry only when it passed the promotion gate.
- Non-durable complete work is marked `Status: archived` with `Promotion: none`.
- Explicit cleanup did not remove any `active`, `paused`, `closed`, or `Promotion: pending` entry before promotion was decided.
- `spec/` remains excluded from product commits unless the user explicitly opted in.
