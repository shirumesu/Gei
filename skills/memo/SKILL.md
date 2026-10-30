---
name: memo
description: Keep the user's memory outside the repository as plain Markdown files indexed by MEMORY.md, shared across machines and agents. Load before writing memory - when the user asks to remember, correct, or forget something, or when the work reveals a user preference, a practice that recurs with a stable meaning, or a pitfall the code cannot show - and land the write before the final reply. Reading the injected index needs no skill.
---

# Memo

Memory is a set of topic files, each indexed by one line in `MEMORY.md`. The agent doing the work writes them during the session. Most work earns no entry; no write is a normal outcome.

## Layout

```
AGENTS.md                      the user's standing instructions; injected
context/MEMORY.md              index of shared memories; injected
context/<topic>.md             one memory
projects/<project>/MEMORY.md   index of one project's memories; injected
projects/<project>/<topic>.md  one memory
```

- Change `AGENTS.md` only when the user explicitly asks for that file.
- A project memory that conflicts with a shared one wins.
- `context/` holds only what applies across unrelated projects.
- No injected project memory means the project has none yet. Its scope is `projects/<project>/` (naming rule in [storage](references/storage.md)); creating its `MEMORY.md` starts it.

## What Qualifies

Record only when all hold:

1. The user stated it, or it happened in this work: a correction, a failure, a repeated practice. Never record inference.
2. The code, git history, repository docs, `AGENTS.md`, and shared memory cannot answer it. Search before you write.
3. A later session will meet it again: it stays true after this task and the situation recurs.

Typical: a user preference, a practice that recurs with a stable meaning, a pitfall where the usual method fails, an environment fact outside the repository.

Never: tasks, progress, plans, what was done, decisions about finished work (what was kept, rejected, or deferred), pitfalls of one-off work that will not recur, proposals the user did not accept, general knowledge, secrets.

## Writing

- `MEMORY.md` holds only index lines, one per memory file: `- [<topic>](<topic>.md) - <when to read it>`. Nothing else goes in it.
- One file per topic. A new item on a recorded topic goes into that topic's file; start a file only for a new topic. The name is English kebab-case, e.g. `image-cve.md`, `local-testing.md`.
- Each file starts with a `# Title`. A file with several items gives each its own `## heading`. Each item is the rule or fact in a sentence or two, then:
  - `**Why:**` the reason the user gave, or the failure that taught it. Omit it when the reason is unknown; never guess one.
  - `**How to apply:**` when it applies and what to do, including edge cases.
- Write so a reader without this session understands it: plain sentences, no shorthand, symbols, or compressed key-value lists. Rewrite in your own words; never paste the conversation. No frontmatter, dates, or evidence logs.
- Write in the language of the existing memory.
- Update an item the moment it changes; remove it, and its index line once the file is empty, the moment it proves wrong.
- An injected file over about 9,500 characters is cut. Keep index lines short and `AGENTS.md` lean.

## Reading

The injected index is all a session sees. Before acting on a task an index line describes, read that file with `spec_read`.

## Saving

Read with `spec_read` for a revision, then save with `spec_edit` (`replace`, `replace_lines`, `create`, `delete`, `rename`). A new file and its index line go in the same batch.

Storage, project names, and the CLI fallback: [storage](references/storage.md).

## Finish

Land qualifying memory before the final reply. Mention a write in one line; keep a no-write decision silent.
