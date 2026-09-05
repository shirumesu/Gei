---
name: memo
description: Maintain external project background and topic routes, conditional decisions and pitfalls, stale knowledge, and necessary handoffs. Use proactively when a task earns a durable update; ordinary context reading does not require this skill.
---

# Memo

Own useful project knowledge outside the repository. Create, update, merge, move, and remove it autonomously within the task; no separate user confirmation is needed. Honor host filesystem permissions and current user instructions. Do not merely offer to remember or defer a known correction.

## Act On Evidence

Write when a task establishes missing project background or working agreements, an accepted consequential decision, a verified reusable pitfall, a changed knowledge claim/route, or a needed handoff. Update the existing owner first. Routine edits, raw logs, transcripts, generic advice, and code facts cheap to recover earn no note.

Distinguish user-confirmed decisions, agent inferences, unimplemented targets, and observed behavior. An old implementation does not overrule an accepted requirement. Never promote one choice into a universal preference.

## Shape

Use the Hook-provided external workspace. Session start allocates `project.json` and a minimal `INDEX.md` even before useful knowledge exists. Enrich that index from evidence; create topic/note/task files only when they earn content. No repository files are required. No fixed architecture/impact/changelog collection, Group registry, or routine whole-store audit.

- `INDEX.md`: short background, durable working agreements, and business-term routes to topics. This is injected; keep it compact.
- `topics/<domain>/README.md`: domain terms, ownership, non-obvious constraints, code/native-doc entry points, and relevant note routes. Split by responsibility only when lookup gets difficult.
- `topics/<domain>/notes/<meaningful-name>.md`: scoped decision or pitfall, its reasons/evidence, and when to reconsider.
- `tasks/<name>.md`: accepted work that must survive handoff; do not create a second task tracker.
- `context/INDEX.md` and `context/notes/`: only lessons whose conditions apply across unrelated projects.

Keep one owner per fact. Navigation repeats only a short retrieval cue. Resolve repository-relative evidence against the current checkout, not the knowledge directory.

## Read Only What This Write Needs

- Storage, first write, relocation, or missing Hook: [storage](references/storage.md).
- Background, topic routing, scoped search, or compaction: [topics](references/topics.md).
- Decisions, pitfalls, generalization, or handoff: [notes](references/notes.md).
- Existing five-file/Group store: [migration](references/migrate.md).

Use only the relevant [index](templates/index.md), [topic](templates/topic.md), [note](templates/note.md), or [task](templates/task.md) example; headings are optional. Write short statements and links for agent retrieval, not a narrative report.

## Finish

Before the final reply, land the earned update and repair its nearest incoming route. Check touched links and distinguish accepted targets from implemented facts. Mention meaningful writes briefly; keep no-write decisions silent. Do not append routine internal history or sweep unrelated topics.
