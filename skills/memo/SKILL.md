---
name: memo
description: Keep a short, typed project memory outside the repository - rules the user set, pitfalls where the usual method fails, environment facts the code does not hold, and decisions the code cannot explain. Use when the user asks to record, correct, or remove something, when work earns an entry while background Memo is off, or when a write returns MEMORY_FULL; reading the injected memory needs no skill.
---

# Memo

Memory is a few dozen one-line entries per project. Each one changes what a future agent does, and the code, git history, and docs cannot supply it. Most work earns no entry. No write is a normal outcome.

## Background Mode

When the startup context says Background Memo is on, a worker reviews the whole session after it ends or pauses and records what qualifies. During the session, change memory only when the user explicitly asks to record, correct, or remove something, and land that request at once. The rest of this skill guides the worker. Users switch the mode with the CLI `background on|off`.

## The Test

Record an entry only when both hold:

1. The repository, its git history, and its docs cannot answer it. Search before you write.
2. You can name the concrete future mistake it prevents.

Never record:

- Architecture, which technology is used, or how a feature works. The code answers it.
- Progress, status, or what was done: work logs, rollout or push state, "user says move on".
- Discussion, meeting notes, or a proposal the user did not accept.
- Dated requirement narration. Keep only a rule that still binds.
- Repository or directory overviews.
- One-off verification results, measurements, general knowledge, secrets.
- Why an option was rejected, until the option is proposed again and the user rejects it again.

User-requested documentation is still the deliverable; this test does not withhold it.

## Entries

| type | fields | use |
|---|---|---|
| rule | when, do, because? | A standing instruction: a working agreement the user stated, or "when you change X, also check Y". |
| pitfall | when, avoid, instead, because? | The usual method fails here, seen in real work. |
| env | subject, key, value, note? | A fact about an environment outside the repo. `key` is one of host, ip, url, port, path, version, account, owner, id, name, branch, schedule, retention, scope, cert, setting, limit, location, command. |
| why | choice, because, rejected? | A decision, or a problem left unfixed on purpose, whose reason the code cannot show. |

- Every entry has `basis`: `user` (the user said it), `observed` (seen in this work), or `inferred` (agent reasoning, not confirmed). Write `inferred` honestly; never present inference as the user's decision.
- Optional `until` states when the entry retires, for example "PR #4060 merges". Remove the entry when it holds. Optional `date` is YYYY-MM.
- One fact per entry, literal and short. A field holds at most 240 bytes, a rendered entry 480 bytes. About 80 Chinese characters fill a field.
- A project memory renders to at most 7000 bytes, the shared one to 2500. Everything is injected at session start, so these budgets keep the hosts from cutting it.
- A project entry wins over a conflicting shared entry.
- Write in the language of the existing memory.

## Writing

1. Read `<scope>MEMORY.md` with `spec_read` to get a revision.
2. Save with `spec_edit`: `add_entry`, `update_entry`, or `remove_entry` on that path. Entries and document edits can share one batch.
3. A new fact about a situation that has an entry updates that entry. `DUPLICATE_ENTRY` names it.
4. Remove an entry in the same task when it proves wrong or its `until` holds.
5. On `MEMORY_FULL`, remove or merge entries in the same batch. The error lists candidates, weakest basis first. Remove a `basis: user` entry only with the user's agreement. If nothing else can go, do not write.

The shared scope `context/` holds only rules that apply across unrelated projects.

## Docs And Tasks

- `docs/<name>.md`: long documents. Write one when the user asks to keep it (a design spec, a procedure), or for a non-standard procedure that worked and does not fit entries: numbered steps, about 3 KB at most. Frontmatter `description` says what it covers and when to read it. Docs are not injected; INDEX lists top-level docs, and a doc in `docs/<dir>/` is linked from a top-level doc.
- `tasks/<name>.md`: accepted work in progress or waiting on the user, with `status` (todo, doing, blocked), the goal, acceptance criteria, and the next step. When the work is done, save lasting entries and delete the task in the same batch. A final answer, a commit, or silence does not prove it is done.
- `INDEX.md` and `tasks/INDEX.md` are generated in every save. Do not edit them.

Storage, project names, and the CLI fallback: [storage](references/storage.md).

## Finish

Without background Memo, land qualifying entries before the final reply. Mention meaningful writes briefly. Keep a no-write decision silent.
