---
name: memo
description: Maintain external project background, topic routes, conditional lessons, and handoffs. Use when the user asks to record, correct, or remove knowledge, when work earns a durable update while background Memo is off, or when Spec reports maintenance candidates; ordinary context reading does not require this skill.
---

# Memo

Own useful project knowledge outside the repository. Create, update, merge, move, and remove it autonomously within the task; no separate user confirmation is needed. Honor host filesystem permissions and current user instructions. Do not merely offer to remember or defer a known correction.

## Background Mode

When the Hook reports Background Memo, a worker owns incidental capture and scheduled maintenance. It reviews the whole session record after the session ends or pauses, so it judges final outcomes rather than the latest turn. During the session, write only when the user explicitly asks to record, correct, or remove knowledge; land that request immediately because parallel sessions read it. The rest of this skill then guides the worker. Users switch the mode with the CLI `background on|off`.

## Act On Evidence

For incidental memory, keep only information that can change a plausible future decision or avoid non-obvious repeated investigation, and is not already supplied by an existing authority. This includes continuing constraints, accepted decisions, reusable pitfalls and necessary handoffs. Update the existing owner first. Routine edits, test counts, raw logs, generic advice and code facts cheap to recover earn no note; no write is a successful outcome.

Do not record these as knowledge status (they fail the admission gate):
- git push or sync status (pushed or not)
- ahead/behind `origin` or other branch-tracking status
- Unreleased used as a living source-status field ("still Unreleased", "not released yet")
- local checkout has X / remote lacks X (or the reverse) as a standing fact
- whether an installed or plugin-cache copy has been upgraded

Keep mechanism notes about release tooling (for example CHANGELOG Unreleased extraction traps) when they change how agents ship; that is tool behavior, not a "source is still Unreleased" status field.

User-requested documentation remains the deliverable; this admission gate is not a reason to withhold it. Distinguish user-confirmed decisions, agent inferences, unimplemented targets and observed behavior. Prior recording alone does not establish user acceptance, and current implementation does not overrule an accepted requirement. Keep explicit preferences at their stated scope; never promote one choice into a universal preference.

## Shape

Use `spec_read/search/edit` for knowledge access; these tools resolve the user's local or GitHub binding. For an update, read the affected documents to obtain a revision, then submit the edits through `spec_edit`. Repair incoming links that sit outside the generated INDEX catalog; the catalog itself is rewritten in that same save. An injected INDEX already serves ordinary routing; read it through tools only when its content is missing, clipped, needs refreshing, or the hand-written header must be edited. On a revision conflict, reconcile the changed knowledge before retrying. Do not bypass the tools with direct file edits or Git synchronization. When Spec is disabled, skip maintenance. Without MCP, use the bundled [CLI](scripts/spec/cli.mjs); its `--help` describes equivalent JSON operations and storage controls. Read [tool access](references/tools.md) only for setup, fallback, or failures.

Non-INDEX documents require YAML frontmatter in the file. Set `type` to `facts`, `decisions`, `runbooks`, `log`, or `tasks`, and set `description` to one non-empty line. `tasks` also requires `status`: `todo`, `doing`, `blocked`, or `done`. `sources` stays an optional list of checkout-relative paths. `INDEX.md` does not use these fields. Write the fields with `create`, `replace`, or `replace_lines`. `spec_edit` rejects a create or edit that leaves them invalid. `create` also rejects a likely duplicate in the same project and returns the existing paths; edit that document instead. Use `facts` for one fact per line (`- fact [source; date]`), `decisions` for situation / why / how to apply, `runbooks` for preconditions / steps / verification, `tasks` for goal / acceptance, and `log` when the shape is free. Omit an empty section.

Use the Hook-provided external workspace. Knowledge lives under `projects/<project-name>`; no identity manifest is needed. Session start never creates files. The first `spec_edit` that writes a valid document also creates `INDEX.md` in that same save. Do not create an empty index ahead of that document. No repository files are required. No fixed architecture/impact/changelog collection, Group registry, or routine whole-store audit.

- `INDEX.md`: a short hand-written header (purpose and confirmed working agreements) plus a generated catalog. `spec_edit` rewrites the block between `<!-- gei:index start -->` and `<!-- gei:index end -->`: one line per valid document, `[title](relative path): description`, grouped by `type` (`facts`, `decisions`, `runbooks`, `log`, `tasks`). `context/INDEX.md` is generated the same way from `context/`. Edit a document's title, `description`, `type`, or path to change its line. Edit only the text outside the markers when the header needs a change; edits inside the markers are overwritten. The catalog does not use `type`, `description`, or `status`. Startup injection still clips the comment-stripped INDEX body at 3 KiB for a project and 1 KiB for shared context. Keep the header short so more catalog lines fit. Merge or delete documents to shorten a clipped catalog; do not hand-prune the generated lines.
- `topics/<domain>/README.md`: domain terms, ownership, non-obvious constraints, code/native-doc entry points, and relevant note routes. Use `type: facts` and a one-line description. The [facts example](templates/facts.md) is the shape, including its short Routes block. Split by responsibility only when lookup gets difficult.
- `topics/<domain>/notes/<meaningful-name>.md`: scoped decision, fact list, procedure, or free-shape record, with reasons and when to reconsider. Use `type: decisions`, `facts`, `runbooks`, or `log`, and a one-line description.
- `tasks/<name>.md`: accepted work that must survive handoff, with `type: tasks`, a one-line description, and `status` (`todo`, `doing`, `blocked`, or `done`). Do not create a second task tracker. When lasting knowledge is merged, delete the task in the same `spec_edit` batch—never leave `status: done` or a "completed" / "已完成" ledger occupying space.
- `context/INDEX.md` and `context/notes/`: only lessons whose conditions apply across unrelated projects.

Keep one owner per fact. Navigation repeats only a short retrieval cue. Resolve repository-relative evidence against the current checkout, not the knowledge directory.

## Maintain From Evidence

When a maintenance hint or request applies, use `spec_check` for a bounded batch in the relevant project or shared scope, then follow [maintenance](references/maintenance.md). Signals are broken links, repeated prose, and source drift. A clean signal set is not a semantic or live verdict. Keep low-frequency constraints while applicable; age or inactivity alone does not retire them. Use `spec_edit` for corrections, confirmed deletions, and link repairs.

Keep a note only while it can still change a later decision. Deferred comparisons, competitor snapshots, and one-off research are deleted once the product decision lands; do not keep them as durable knowledge, and do not assign a destruction date. Reading, importing, or rewording a document does not by itself earn retention. INDEX contains stable background and routes. Environment observations and unfinished operations stay in scoped records and are removed when they no longer apply.

## Read Only What This Write Needs

- Storage, first write, relocation, or missing Hook: [storage](references/storage.md).
- Background, topic routing, scoped search, or compaction: [topics](references/topics.md).
- Decisions, pitfalls, generalization, or handoff: [notes](references/notes.md).
- Synced copies, divergent knowledge, or environment conflicts: [merge](references/merge.md).
- Legacy path-hash identity or five-file/Group store: [migration](references/migrate.md).
- Sentence and term style (ASD-STE100-style) for any write: [wording](references/writing.md).

Use only the relevant [index](templates/index.md), [facts](templates/facts.md), [decisions](templates/decisions.md), [runbooks](templates/runbooks.md), [log](templates/log.md), or [tasks](templates/tasks.md) example; headings are optional. Write short statements and links for agent retrieval, not a narrative report.

## Finish

Without Background Memo, before the final reply, land any qualifying update and repair incoming links outside the generated catalog. Verify touched links, and distinguish accepted targets from implemented facts. Mention meaningful writes briefly; keep no-write decisions silent. Do not append routine internal history or sweep unrelated topics.
