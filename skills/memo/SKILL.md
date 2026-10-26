---
name: memo
description: Maintain external project background, topic routes, conditional lessons, and handoffs. Use when the user asks to record, correct, or remove knowledge, when work earns a durable update while background Memo is off, or when Spec reports maintenance candidates; ordinary context reading does not require this skill.
---

# Memo

Own useful project knowledge outside the repository. Create, update, merge, move, and remove it autonomously within the task; no separate user confirmation is needed. Honor host filesystem permissions and current user instructions. Do not merely offer to remember or defer a known correction.

## Background Mode

When the Hook reports Background Memo, a worker owns incidental capture and scheduled maintenance. After the session ends or pauses, it reviews the whole session record and judges the final outcome, not the latest turn. During the session, write only when the user explicitly asks to record, correct, or remove knowledge. Land that request immediately. Parallel sessions read it. The rest of this skill guides the worker. Users switch the mode with the CLI `background on|off`.

## What To Record

Record only what will change future behavior and cannot be found in code, git, or docs. Update the existing owner. No write is a successful outcome. Examples: [admission](references/admission.md).

- facts: environment, account ownership, external limits, pitfalls hit. Not grep-able code, temporary state, or process.
- decisions: situation, why, how to apply, and what not to do. Not the discussion. A rejected option is one line: `rejected X because Y`.
- runbooks: repeated operations with non-obvious steps. Not one-offs, steps `--help` explains, or standard git/PR flow.
- tasks: in progress and todo, with acceptance criteria and status. Done means delete. Lift valuable conclusions into decisions or facts first. Do not move the task into log.
- log: scratch. A weekly tidy distills what lasts, then deletes the log.
- Never record: secrets and credentials, chit-chat, content already clear in a PR or commit, one-off verification results, restated general knowledge.
- description: one sentence that says what the document covers and when to read it.

User-requested documentation remains the deliverable. This gate is not a reason to withhold it. Distinguish user-confirmed decisions, agent inferences, unimplemented targets, and observed behavior. Prior recording alone does not establish user acceptance. Current implementation does not overrule an accepted requirement. Keep explicit preferences at their stated scope. Never promote one choice into a universal preference.

## Shape

Use `spec_read/search/edit` for knowledge access. These tools resolve the user's local or GitHub binding. For an update, read the affected documents to obtain a revision, then submit the edits through `spec_edit`. Repair incoming links outside the generated INDEX catalog. The same save rewrites the catalog. An injected INDEX already serves ordinary routing. Read it again only in the cases in [topics](references/topics.md). On a revision conflict, reconcile the changed knowledge before retrying. Do not bypass the tools with direct file edits or Git synchronization. When Spec is disabled, skip maintenance. Without MCP, use the bundled [CLI](scripts/spec/cli.mjs). Read [tool access](references/tools.md) only for setup, fallback, or failures.

Non-INDEX documents require YAML frontmatter in the file. Set `type` to `facts`, `decisions`, `runbooks`, `log`, or `tasks`. Set `description` to one sentence: what the document covers and when to read it. `tasks` also requires `status`: `todo`, `doing`, `blocked`, or `done`. Do not leave a finished task at `done`; delete it. `sources` stays an optional list of checkout-relative paths. `INDEX.md` does not use these fields. Write the fields with `create`, `replace`, or `replace_lines`. `spec_edit` rejects a create or edit that leaves them invalid. Every template heading is `# <标题>`. Replace `<标题>` with the real title before saving. A create or replace that leaves that heading is rejected with `PLACEHOLDER_TITLE` and writes nothing. `create` also rejects a likely duplicate in the same project and returns the existing paths. Edit that document instead. Match the body to that `type`'s template, including `- fact [source; date]` for `facts`. Omit an empty section.

Use the Hook-provided external workspace. Knowledge lives under `projects/<project-name>`. No identity manifest is needed. Session start never creates files. The first `spec_edit` that writes a topic README or a task also creates `INDEX.md` in that same save. Writing only `topics/<domain>/notes/` does not create `INDEX.md`. Do not create an empty index ahead of a topic README or task. No repository files are required. Do not keep a fixed architecture/impact/changelog collection, a Group registry, or a routine whole-store audit.

- `INDEX.md`: a short hand-written header (purpose and confirmed working agreements) plus a generated catalog of topic READMEs, then the first 5 tasks in status order (doing, blocked, todo, done). When more tasks exist, that group ends with `更多任务 N 个，见 [tasks/INDEX.md](tasks/INDEX.md)`. Read INDEX, then the topic README, then the note. Edit only text outside the generated markers. Format and budgets: [topics](references/topics.md).
- If the injected INDEX ends with `⚠️ INDEX 超出预算…`, tell the user that topics were omitted and suggest cleaning up or merging topics.
- `topics/<domain>/README.md`: domain terms, ownership, constraints, entry points, and note routes. Use `type: facts`. Shape: [topics](references/topics.md).
- `topics/<domain>/notes/<meaningful-name>.md`: one scoped decision, fact list, procedure, or free-shape record. It is not an INDEX line. The topic README links it. Types: [notes](references/notes.md).
- `tasks/<name>.md`: in-progress or todo work, with acceptance criteria, status, and `type: tasks`. `tasks/INDEX.md` lists every task that still exists and is not injected. When the work is done, lift conclusions into a decision or fact, then delete the task in that same save. Do not leave `status: done`. Do not move it into log. Completion: [admission](references/admission.md).
- `context/INDEX.md` and `context/notes/`: only lessons whose conditions apply across unrelated projects. Shared INDEX lists topic READMEs when context has topics, and otherwise lists `context/notes/`.

Keep one owner per fact. Navigation repeats only a short retrieval cue. Resolve repository-relative evidence against the current checkout, not the knowledge directory.

## Maintain From Evidence

When a maintenance hint or request applies, use `spec_check` for a bounded batch in the relevant project or shared scope, then follow [maintenance](references/maintenance.md). Use `spec_edit` for corrections, confirmed deletions, and link repairs.

## Read Only What This Write Needs

- Whether to record, or which type to skip: [admission](references/admission.md).
- Storage, first write, relocation, or missing Hook: [storage](references/storage.md).
- Background, topic routing, scoped search, or compaction: [topics](references/topics.md).
- Decisions, pitfalls, generalization, or handoff: [notes](references/notes.md).
- Synced copies, divergent knowledge, or environment conflicts: [merge](references/merge.md).
- Legacy path-hash identity or five-file/Group store: [migration](references/migrate.md).
- Sentence and term style (ASD-STE100-style) for any write: [wording](references/writing.md).

Use only the relevant [index](templates/index.md), [facts](templates/facts.md), [decisions](templates/decisions.md), [runbooks](templates/runbooks.md), [log](templates/log.md), or [tasks](templates/tasks.md) example. Replace the `# <标题>` placeholder; other section headings are optional. Write short statements and links for agent retrieval, not a narrative report.

## Finish

Without Background Memo, before the final reply, land any qualifying update. Repair incoming links outside the generated catalog. Verify touched links. Distinguish accepted targets from implemented facts. Mention meaningful writes briefly. Keep no-write decisions silent. Do not append routine internal history or sweep unrelated topics.
