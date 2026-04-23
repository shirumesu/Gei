# Read Spec

The goal is to recover the minimum context that lets you answer these questions quickly and precisely:

- What does this project do?
- What technology stack does it use?
- How is the system structured?
- Where should a new feature in this area probably be added?
- Is there already related planned work, active work, or recently shipped work?

## Core Rule

Start with `spec/ARCHITECTURE.md`.

- Do not start with `spec/docs/`.
- Do not bulk-read the whole `spec/` tree.
- Treat `ARCHITECTURE.md` as the primary entry point for understanding the product, the stack, the system boundaries, and the likely extension points.
- Treat `TODO.md` and `CHANGELOG.md` as secondary context.
- Open `spec/docs/#NNN-{work-description}.md` only when one of those files points you there or when the requested feature clearly overlaps that exact work area.
- Read code only after the Spec surface tells you which exact area matters.

## Quick Check

Confirm that the project has a usable Spec surface:

```text
spec/
  ARCHITECTURE.md
  TODO.md
  MEMORY.md
  CHANGELOG.md
  docs/
  test/
```

## Reading Order

Use this order unless the user gives a stronger reason to do something narrower.

1. Read `spec/ARCHITECTURE.md`.
2. Read `spec/TODO.md` only after you understand the architecture.
3. Read `spec/CHANGELOG.md` only after you understand the architecture.
4. Open a `spec/docs/#NNN-{work-description}.md` file only when `ARCHITECTURE.md`, `TODO.md`, or `CHANGELOG.md` gives you a direct reason to open it.
5. Read `spec/MEMORY.md` only when the relevant feature area may contain repeatable pitfalls, rejected directions, or version-specific hazards.
6. Read code only after the Spec surface has narrowed the likely files or modules.

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

## Step 3. Read TODO For Current Reality

Read `spec/TODO.md` only after you already understand the high-level system shape.

Use it to learn:

- whether the requested feature or adjacent work is already planned
- whether related work is in `Backlog`, `TODO`, `In Progress`, or `Done`
- which `#TOD-###` or `#NNN` ids are directly relevant
- whether there is already active work in the same area that should constrain the design

Do not treat `TODO.md` as the first place to understand the project. It tells you current work state, not the overall system.

## Step 4. Read Changelog For Recent Reality

Read `spec/CHANGELOG.md` only when recent shipped behavior might matter for the new feature.

Use it to learn:

- what changed recently in the same area
- how the project usually describes shipped changes
- whether there is already a nearby shipped feature that reveals the normal integration path
- which `#NNN` or `#TOD` ids are worth following

Do not use `CHANGELOG.md` as the main design document. It is a recent-history surface, not the architecture source of truth.

## Step 5. Open Work Records Only When There Is A Direct Reason

Open `spec/docs/#NNN-{work-description}.md` only when at least one of these is true:

- `ARCHITECTURE.md` points to a relevant work record
- `TODO.md` links a directly relevant `#NNN` id
- `CHANGELOG.md` links a directly relevant `#NNN` id
- the requested feature clearly overlaps an existing feature area and you need the prior file list, constraints, or verification plan

When you do open a work record, use it for targeted context:

- the exact scope of the old or current work
- the chosen direction for that area
- the files that were expected to change
- the verification approach
- the constraints that shaped that work

Do not bulk-read every work record under `spec/docs/`.

## Step 6. Read Memory Only When The Area Is Risky

`spec/MEMORY.md` is not the first-stop context file for a fresh feature request.

Read it only when:

- the area has known repeatable pitfalls
- the project has durable rejected directions that may block the proposed feature
- there are version-specific or tool-specific hazards that could affect the design
- a linked work record or architecture note points to a known trap

Use it to avoid repeating old mistakes, not to understand the whole product from scratch.

## Step 7. Read Code Only After The Spec Surface Narrows It

Once `ARCHITECTURE.md`, `TODO.md`, `CHANGELOG.md`, and any directly relevant work record have narrowed the target area, then read code.

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
- whether there is related planned, active, or shipped work
- which files or modules should be inspected next in code

If you cannot explain those points, do not read more at random. Identify the exact missing answer and read the one file that is most likely to answer it.

## Escalation Rules

Stop this guide and invoke `memo` when any of these are true:

- `ARCHITECTURE.md` is missing or too stale to explain the system
- `TODO.md` and `CHANGELOG.md` clearly disagree with the current architecture
- the relevant area has no usable task history even though the Spec surface implies it should
- a new feature request exposes that the current Spec surface no longer explains how the project should be extended

## Optional Command Patterns

Use targeted reads instead of broad scans.

```powershell
Get-Content spec/ARCHITECTURE.md
Select-String -Path spec/ARCHITECTURE.md -Pattern '^#|^##|module|flow|route|interface|stack|runtime|database|service|command'
Select-String -Path spec/TODO.md -Pattern '#NNN|#TOD-|Backlog|TODO|In Progress|Done'
Select-String -Path spec/CHANGELOG.md -Pattern '#NNN|#TOD-|shipped|released|deferred|feature'
Get-ChildItem spec/docs -File | Sort-Object Name
```

Use these commands to narrow the next read. Do not use them as an excuse to read everything.
