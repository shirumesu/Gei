---
name: memo
description: Save, revise and remove the user's memory entries with the `memo` command (a table of short entries outside the repository, shared across machines and agents). Load before writing memory - when the user asks to remember, correct, or forget something, corrects you, states a preference, or warns you, or the work reveals a pitfall that will recur - and land the write before the final reply. Also for /gei:memo tidy, a manual cleanup with `memo review`. Looking entries up (`memo find`) needs no skill.
---

# Memo

Memory is a table of short entries kept outside the repository. Every read and write goes through the `memo` command; never read or edit the store's files (`~/.agents/geispec`) directly. Where `memo` is not on PATH (Codex), use the full command the session-start memory shows. Most work earns no entry; no write is a normal outcome.

## What Earns An Entry

- The user corrects you, states a preference, or warns you about something. Add `--user`.
- A pitfall that will recur: an error a tool gives on a known input, a step that must not be skipped.

Not worth saving: progress, finished work, one-off problems, rejected proposals, general knowledge, anything the code, git history or repository docs already answer, and secrets (`memo` refuses likely secrets).

## Writing One

```
memo put --keys k1,k2 --when "<situation>" --do "<what to do>" --why "<source and reason>" [--user] [--shared] [--group <name>]
```

- **keys** (1 to 6, each at most 24 characters): the literal things that will show up again - a tool, command, file, error text, host - plus one broad key (the service, tool or area). When the action has common synonyms (deploy, release, ship), add the one the user says. Lookups match keys first.
- **when** (at most 60 characters): the situation in which the entry applies.
- **do** (at most 300 characters): an imperative that stands on its own for a reader without this session. A prohibition states its condition: "do not X when Y". A procedure is "step → step". A pointer to a file starts with its path.
- **why** (at most 200 characters): the source - what the user said, or the failure seen in this work. A rule with no source is a guess; do not save it.
- **--shared** puts the entry in the scope every project sees. Use it only when the user says it holds everywhere, or the same preference shows up in a second, unrelated project. `memo mv <id> --shared` moves an existing one.
- **--group** names the steps of one procedure that are saved as several entries.
- Write in the language of the existing entries.

## Replace Or New

When an entry close to yours exists, `put` refuses and prints it. Then decide:

- The same rule, corrected or sharpened: `memo put --replace <id> ...` with the full new keys, when and do. It keeps the id, level and uses; the old text goes to the history.
- A different rule that only looks alike (same template, different fact): run the same `put` again with `--new`.

## When An Entry Is Wrong

Follow the current code and what the user says now. Then `memo wrong <id>` (level 0; a second time deletes it), or `memo put --replace <id> ...` with the corrected rule. `memo del <id>` removes an entry the user wants gone; `memo restore <id>` brings it back.

## Long Documents

Anything longer than an entry (a full procedure, a design note) is a Markdown file under the scope's `docs/` directory in the store: `~/.agents/geispec/projects/<project>/docs/<name>.md`, or `~/.agents/geispec/context/docs/<name>.md` for every project. Write it with your file tools, then save one pointer entry whose `do` starts with that path. Never write memory into the source repository.

## Citing

When you act on an entry, cite it in the reply as `[m:<id>]`. Cited entries rise; entries shown above a cited one sink a little. Write an id in that form only for an entry you acted on; mentioning one you set aside counts as a use.

## Pinning

`memo pin <id>` puts an entry's `do` at the top of every session (at most 8 per scope, `do` at most 160 characters). Pin only when the user asks.

## Tidy

Run only when the user asks (`/gei:memo tidy`).

1. Run `memo review`. It lists entries never used, at level 0, deleted after `wrong`, pinned or said by the user but never used, possible duplicates, entries brought back from shadow, and searches that found nothing more than once. `memo show <id>` gives the full entry and its history.
2. Propose changes one line each: delete, merge two duplicates into one (`--replace` one, `del` the other), sharpen keys or `when`, move to the shared scope, unpin, or add an entry for words that keep finding nothing.
3. Apply only the ones the user accepts, with `memo` commands, then run `memo sync`.

## Finish

Land qualifying memory before the final reply and mention the write in one line. Keep a no-write decision silent. The hooks sync the store; if a sync failure is reported, tell the user and do not resolve a git conflict in the store unless asked. Commands and storage: [storage](references/storage.md).
