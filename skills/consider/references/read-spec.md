# Read Spec

The goal is to recover the minimum context that lets you answer these questions quickly and precisely:

- What does this project do?
- What technology stack does it use?
- How is the system structured?
- Where should a new feature in this area probably be added?
- Is there active work or recent closed work that affects this design?

## Core Rule

Start with `spec/ARCHITECTURE.md`.

- Do not start with `spec/docs/`.
- Do not bulk-read the whole `spec/` tree.
- Treat `ARCHITECTURE.md` as the primary entry point for understanding the product, the stack, the system boundaries, and the likely extension points.
- Treat `current-work.md` and `CHANGELOG.md` as conditional context.
- Open `spec/docs/#NNN-{work-description}.md` only when `ARCHITECTURE.md`, `current-work.md`, or the requested feature clearly points to that exact work area.
- Read code only after the Spec surface tells you which exact area matters.

## Quick Check

Confirm that the project has a usable Spec surface:

```text
spec/
  ARCHITECTURE.md
  CHANGELOG.md
  current-work.md
  docs/
  test/
```

`current-work.md`, `docs/`, and `test/` may be absent in a fresh or lightweight project. Their absence is not a reason to initialize or repair Memo from `consider`.

## Reading Order

Use this order unless the user gives a stronger reason to do something narrower.

1. Read `spec/ARCHITECTURE.md`.
2. Read `spec/current-work.md` only when active or recent work may overlap the request.
3. Read `spec/CHANGELOG.md` only when recent closed behavior might matter for the new feature.
4. Open a `spec/docs/#NNN-{work-description}.md` file only when `ARCHITECTURE.md`, `current-work.md`, `CHANGELOG.md`, or the requested feature gives you a direct reason to open it.
5. Read code only after the Spec surface has narrowed the likely files or modules.

## Step 1. Read Architecture First

`spec/ARCHITECTURE.md` is the main entry point.

Read it to answer:

- what the product or system is for
- what the top-level folders or modules are
- what each major part owns
- what runtime, framework, language, database, and service choices exist
- what the main request flow, data flow, or state flow looks like
- which boundaries and invariants new work must respect
- where a new feature of the user's type most likely belongs

This is the first file because it should tell you how the system is supposed to fit together before you read task history.

If the architecture file contains links, references, commands, or named modules, follow only the parts that are needed to answer the current feature question.

## Step 2. Use Architecture To Infer The Extension Path

Before reading task history, use the architecture to form an initial model of how a new feature should be added.

You should be able to name:

- the likely owning module or folder
- the adjacent systems the feature will interact with
- the storage or state boundary it must respect
- the interface layer where the feature will probably enter
- the main risks of adding work in that area

If you cannot do this after reading `ARCHITECTURE.md`, do not jump straight into every work record. Read only the exact architecture sections or linked source files needed to close that gap.

## Step 3. Read Current Work Only When It May Overlap

Read `spec/current-work.md` only when:

- it exists and has `Status: active` or `Status: paused`
- the current request might touch the same files or area
- you need to avoid interrupting or overwriting an active task

Use it to learn:

- the current task intent
- the expected scope
- whether the current task is active, paused, or closed

Do not treat `current-work.md` as a design document, backlog, or changelog.

## Step 4. Read Changelog For Recent Closed Reality

Read `spec/CHANGELOG.md` only when recent closed behavior might matter for the new feature.

Use it to learn:

- what changed recently in the same area
- whether `Unreleased` contains relevant closed work
- whether there is a nearby version or checkpoint that reveals the normal integration path
- which files, commits, or spec-task ids are worth following

Do not use `CHANGELOG.md` as the main design document. It is a recent-history surface, not the architecture source of truth.

## Step 5. Open Work Records Only When There Is A Direct Reason

Open `spec/docs/#NNN-{work-description}.md` only when at least one of these is true:

- `ARCHITECTURE.md` points to a relevant work record
- `current-work.md` points to a relevant work record
- `CHANGELOG.md` links a directly relevant spec id
- the requested feature clearly overlaps an existing feature area and you need the prior file list, constraints, or verification plan

When you do open a work record, use it for targeted context:

- the exact scope of the old or current work
- the chosen direction for that area
- the files that were expected to change
- the verification approach
- the constraints that shaped that work

Do not bulk-read every work record under `spec/docs/`.

## Step 6. Read Code Only After The Spec Surface Narrows It

Once `ARCHITECTURE.md`, optional `current-work.md`, optional `CHANGELOG.md`, and any directly relevant work record have narrowed the target area, then read code.

At that point you should already know:

- which module likely owns the feature
- which nearby systems it touches
- which existing patterns are likely relevant
- which exact files or folders are the first ones worth opening

Do not scan the whole codebase just because you are still uncertain. Narrow the uncertainty first through the Spec surface.

## What "Enough Context" Looks Like

Stop the Spec-reading pass once you can explain all of the following in plain terms:

- what the project does
- what the major stack choices are
- where the requested feature most likely belongs
- what existing boundaries or conventions the feature must follow
- whether active or recent closed work affects the request
- which files or modules should be inspected next in code

If you cannot explain those points, do not read more at random. Identify the exact missing answer and read the one file that is most likely to answer it.

## Escalation Rules

Stop this guide and invoke `memo` when any of these are true:

- `ARCHITECTURE.md` is missing or too stale to explain the system
- `current-work.md` clearly conflicts with the current repo state
- `CHANGELOG.md` clearly disagrees with the current architecture
- the relevant area has no usable task history even though the Spec surface implies it should
- a new feature request exposes that the current Spec surface no longer explains how the project should be extended

## Optional Command Patterns

Use targeted reads instead of broad scans.

```powershell
Get-Content spec/ARCHITECTURE.md
Select-String -Path spec/ARCHITECTURE.md -Pattern '^#|^##|module|flow|route|interface|stack|runtime|database|service|command'
Get-Content spec/current-work.md
Select-String -Path spec/CHANGELOG.md -Pattern '^##|^###|Commit:|Checkpoint|Unreleased|feat|fix|docs|chore'
Get-ChildItem spec/docs -File | Sort-Object Name
```

Use these commands to narrow the next read. Do not use them as an excuse to read everything.
