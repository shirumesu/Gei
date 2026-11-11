---
name: memo
description: Keep the user's memory outside the repository as plain Markdown in ~/.agents/geispec, shared across machines and agents through git. Load before writing memory - when the user asks to remember, correct, or forget something, corrects you, states a preference, or the work reveals a practice or pitfall that will recur, or a reuse pointer was just earned - and land the write before the final reply. Also for /gei:memo tidy, a manual entry-by-entry cleanup. Reading the injected indexes needs no skill.
---

# Memo

Memory exists so later sessions repeat fewer mistakes, ask the user fewer repeated questions, and rebuild less of what already exists. It is a folder of Markdown files you read and edit with your own file tools. Most work earns no entry; no write is a normal outcome.

## Layout

The store is `~/.agents/geispec`, a git clone. Paths below are relative to it.

```
AGENTS.md                      the user's standing instructions; loaded by Claude Code and Codex, not by Gei
context/MEMORY.md              index of shared memory; injected
context/<topic>.md             one shared topic
projects/<project>/MEMORY.md   index of one project's memory; injected
projects/<project>/<topic>.md  one topic
projects/<project>/MAP.md      reuse pointers; injected whole
```

- Change `AGENTS.md` only when the user explicitly asks for that file.
- The session start header names the current project. A project with no memory yet has its scope at `projects/<project>/`; creating its `MEMORY.md` starts it. Naming rules: [storage](references/storage.md).
- Never write memory into the source repository.

## Three Kinds Of Entries

| Kind | Example | Where |
| --- | --- | --- |
| Preference or correction | "commit straight to main"; "emails in plain text" | `projects/<project>/<topic>.md`, promoted to `context/` only as below |
| Practice or pitfall | the steps of a CVE round; an error a tool gives on a known input | `projects/<project>/<topic>.md` |
| Reuse pointer | which function formats relative time | one line in `projects/<project>/MAP.md` |

**Promotion.** A preference starts in the project where it was stated. Move it to `context/` only when the user says it holds for all projects, or the same preference shows up in a second, unrelated project. Moving means one file in `context/` and the project copies deleted.

**Not memory:** task progress, what was done, decisions about finished work, one-off problems that will not recur, proposals the user did not accept, general knowledge, anything the code, git history or repository docs already answer, and secrets.

## Writing A Topic

- One topic per file, English kebab-case name (`release.md`, `generated-data.md`). A new item on a recorded topic goes into that file.
- The file starts with `# Title`. Each item is the rule or fact in a sentence or two, then:
  - `**Why:**` the source and the reason: what the user said, or the failure seen in this work. A note with no source is inference; do not record it.
  - `**How to apply:**` when it applies and what to do, including edge cases.
- A prohibition states its condition and its cause: "do not use X when Y, because Z broke". A "never X" you cannot give a condition for is not recorded.
- Its index line goes in the same scope's `MEMORY.md`: `- [<topic>](<topic>.md) - <when to read it>`. The line says only when to read; the rule lives only in the file.
- Plain sentences a reader without this session understands; your own words, not the conversation. No frontmatter, dates, or logs. Write in the language of the existing memory.
- When a note turns out wrong, or conflicts with the current code or what the user says now, follow the code and the user and fix or delete the note in the same turn. Delete an empty file and its index line.

## Reuse Pointers

`MAP.md` holds pointers only, one per line:

```
- <when you need X> → <path>#<symbol>: <one-line contract>
```

`<path>` is relative to the repository root and `<symbol>` must appear in that file. Never describe implementation; read the code for that. Write a pointer only after a real event: the user says something already exists, you duplicated something or searched long for it, or you just built an interface meant for reuse. Never generate a map by scanning the repository.

Session start checks every pointer in the current checkout; dead ones are left out of the injection and listed as problems. Fix or delete them when you meet them.

## Budgets

| Injected part | Limit |
| --- | --- |
| Purpose and safety header (Gei's own) | 10 lines |
| `context/MEMORY.md` | 20 lines |
| `projects/<project>/MEMORY.md` | 30 lines |
| `projects/<project>/MAP.md` | 40 lines |
| Everything together | 100 lines, 8,000 characters; 150 characters per line |

At a limit, merge entries on the same topic or remove the least recently read (`gei memo trace --usage`) before adding.

## Reading

The injected indexes are all a session sees. Before acting on a task an index line describes, read that file. When you act on a memory, say which one in half a sentence of the final reply.

## Saving

Edit the files with your file tools. Do not commit: the Stop hook commits, pulls and pushes at the end of the turn, and session start syncs again. If either reports a sync failure or a conflict, tell the user; do not resolve a git conflict in the store unless asked.

## Tidy

Run only when the user asks (`/gei:memo tidy`). Change entries one at a time; never rewrite a whole file.

1. Run `gei memo lint` and `gei memo trace --usage` ([storage](references/storage.md) has the command), and read the indexes and files in scope.
2. List proposed changes, one line each: merge duplicates, fix stale or unconditioned rules, remove entries nobody reads, move a preference to the right scope, fix dead pointers.
3. Apply the ones the user accepts with targeted edits.
4. Commit once in the store with a message listing the changes (`git -C ~/.agents/geispec commit -am "Tidy memory: ..."`), then run `gei memo sync`.

## Finish

Land qualifying memory before the final reply and mention the write in one line. Keep a no-write decision silent.
