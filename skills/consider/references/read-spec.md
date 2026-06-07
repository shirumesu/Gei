# Read Spec

Use this guide only when `consider` is recovering project context from an existing Gei `spec/` system. The goal is to identify the minimum additional context needed to design without conflicting with the existing project.

## Core Rule

Start from `spec/OVERVIEW.md`, or from the injected OVERVIEW context if it is already present. Do not reread it just to satisfy this guide.

- Use OVERVIEW as the document map and cold-start context.
- If the injected `spec/MEMORY.md` index has not already been checked, scan it and apply matching entries through Memo memory recall before design decisions.
- Do not start from `spec/docs/` or bulk-read the `spec/` tree.
- Read the next spec surface only when it answers a design-relevant question.
- Read source code only after the spec surface has narrowed the likely files, modules, or interfaces.
- When sources disagree, trust repository code/config/tests/Git history first, `spec/current-work.md` second for recent task state, and durable spec files third.

## Context Decisions

Read `spec/ARCHITECTURE.md` when the design needs durable structure, routing, data flow, module boundaries, extension points, or cross-file impact context. If it points to a relevant `spec/architecture/*.md` fragment, read only that fragment.

Read `spec/current-work.md` only when active, paused, debug, release, handoff, reconciliation, or recent work may overlap the request. Use it for intent and in-flight constraints, not as a backlog, changelog, or design source.

Read `spec/CHANGELOG.md` only when recent closed behavior might affect the design, compatibility, migration path, or normal integration route.

Open a `spec/docs/#NNN-{work-description}.md` file only when OVERVIEW, architecture, current-work, changelog, or the requested feature points to that exact work area. Use it for prior scope, constraints, affected files, and verification approach; do not scan every work record.

Read code after the spec pass identifies the likely owner, neighboring systems, interfaces, or files. If the spec surface does not narrow the target, identify the missing answer and read the single file most likely to provide it instead of scanning broadly.

## Enough Context

Stop the spec-reading pass once you can explain:

- what the project does
- the major stack choices that affect the design
- where the requested change probably belongs
- which project boundaries or conventions must be preserved
- whether active or recent closed work affects the request
- which files or modules should be inspected next

## Escalation Rules

Stop this guide and invoke `memo` when any of these are true:

- `ARCHITECTURE.md` is missing or too stale to explain the relevant structure
- `current-work.md` clearly conflicts with the current repo state
- `CHANGELOG.md` clearly disagrees with the current architecture
- the relevant area has no usable task history even though the spec surface implies it should
- a new feature request exposes that the current spec surface no longer explains how the project should be extended
