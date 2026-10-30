---
name: memo
description: Keep the user's memory outside the repository as plain Markdown files indexed by MEMORY.md, shared across machines and agents. Load before writing memory - when the user asks to remember, correct, or forget something, or when the work reveals a user preference, a practice that recurs with a stable meaning, or a pitfall the code cannot show - and land the write before the final reply. Reading the injected index needs no skill.
---

# Memo

Memory is a set of small files, each indexed by one line in `MEMORY.md`. The agent doing the work writes them during the session. Most work earns no entry; no write is a normal outcome.

## Layout

```
AGENTS.md                      the user's standing instructions; injected
context/MEMORY.md              index of shared memories; injected
context/<name>.md              one memory
projects/<project>/MEMORY.md   index of one project's memories; injected
projects/<project>/<name>.md   one memory
```

- Change `AGENTS.md` only when the user explicitly asks for that file.
- A project memory that conflicts with a shared one wins.
- `context/` holds only what applies across unrelated projects.
- No injected project memory means the project has none yet. Its scope is `projects/<project>/` (naming rule in [storage](references/storage.md)); creating its `MEMORY.md` starts it.

## What Qualifies

Record only when all hold:

1. The user stated it, or it happened in this work: a correction, a failure, a repeated practice. Never record inference.
2. The code, git history, and repository docs cannot answer it. Search before you write.
3. It is static: it stays true after this task.

Typical: a user preference, a practice that recurs with a stable meaning, a pitfall where the usual method failed, an environment fact outside the repository, the reason for a choice the code cannot explain.

Never: tasks, progress, work logs, plans, what was done, proposals the user did not accept, one-off results, general knowledge, secrets.

Judge only whether it qualifies. Do not predict whether it will be useful later.

## Writing

- `MEMORY.md` holds only index lines, one per memory: `- [<name>](<name>.md) - <when it applies; why>`. Nothing else goes in it, however short the memory.
- Every memory is its own file `<name>.md` in the same scope. The name is English kebab-case and says what to do or what it is about, e.g. `no-tables-in-reports.md`.
- The file holds the memory itself, plain Markdown without frontmatter, usually one to three lines. Rules and pitfalls: `when X → do Y (because Z)`. Facts and preferences: short key-value pairs, e.g. `地点：伦敦；早餐：欧式，10am`.
- Write the minimum a senior reader needs to act: no evidence, dates, politeness, or rhetoric; a fragment beats a sentence.
- Keep the reason in a few words. It lets the reader apply the memory to cases it does not name.
- Write in the language of the existing memory.
- A new fact about something recorded updates that file. Remove a memory, file and index line, the moment it proves wrong.
- Each injected file must stay under about 9,500 characters; beyond that the hook cuts it. When the injection says it was cut, merge memories and shorten descriptions before adding.

## Reading

The injected index is all a session sees. Before acting on a task an index line describes, read that file with `spec_read`.

## Saving

Read `MEMORY.md` with `spec_read` for a revision, then save with `spec_edit` (`replace`, `replace_lines`, `create`, `delete`, `rename`). A memory file and its index line go in the same batch.

Storage, project names, and the CLI fallback: [storage](references/storage.md).

## Finish

Land qualifying memory before the final reply. Mention a write in one line; keep a no-write decision silent.
