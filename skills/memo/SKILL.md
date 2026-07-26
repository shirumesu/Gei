---
name: memo
description: Use when the requested outcome is to create or maintain project specs, architecture context, project memory, task references, changelog or checkpoint records, or other durable documentation for future agents.
---

# Memo

Maintain durable project context under `spec/` and own its document contracts.

Memo is not an automatic phase of ordinary coding work. Work has one narrow close interface: after verified changelog-worthy work, it appends a concise typed entry to `spec/CHANGELOG.md` `## Unreleased`. Memo owns changelog structure, release compaction, and every other non-trivial spec update. Memory and task-reference writes remain conditional.

## Authority

- Repository code, tests, configuration, build scripts, and Git history are authoritative.
- Memo documents are navigation and durable context. Verify and correct them when they conflict with the repository.
- Record accepted facts and decisions, not raw discussion, rejected options, hidden reasoning, or routine logs.
- Update the smallest document surface that serves the future task.

`spec/` is internal project state by default. Do not stage, commit, push, or publish it through the product repository unless the user opts in.

## Route

Read the smallest event reference that matches the requested outcome:

| Need | Read |
| --- | --- |
| Initialize or repair the spec layout | `references/events/init.md` |
| Create or update a durable task reference | `references/events/task-start.md` or `references/events/active-work.md` |
| Record an architecture, routing, interface, or data-flow change | `references/events/architecture-change.md` |
| Maintain release notes, a changelog, or a durable checkpoint | `references/events/ship.md` |
| Recall, write, forget, compact, or audit project memory | `references/events/memory.md` |
| Capture work whose destination is not yet clear | `references/events/catch-up.md` |

Load only the document contracts for files you will actually create or modify:

- `spec/ARCHITECTURE.md`: `references/contracts/architecture.md`
- `spec/OVERVIEW.md`: `references/contracts/overview.md`
- `spec/CHANGELOG.md`: `references/contracts/changelog.md`
- durable task reference: `references/contracts/task-spec.md`
- spec layout or initialization: `references/spec-system.md`

Templates under `references/templates/` are optional scaffolds for new files, not completion checklists.

## Writing Model

- Prefer exact paths, symbols, commands, links, decisions, and impact routes over broad prose.
- Link to high-fidelity references such as code, tests, schemas, mockups, or artifacts instead of restating them.
- Preserve the repository's existing document shape when it works. Do not impose Gei's default layout on a project with a better native convention.
- Keep project memory for non-obvious operational knowledge that code and docs do not reveal. Use `references/memory/write.md` for safety and destination checks.
- A durable task reference is justified by cross-session recovery or handoff value, not by task size alone.

## Acceptance

Before finishing:

1. Each changed fact matches repository evidence or an explicit user decision.
2. Links, paths, ids, and document ownership are consistent.
3. No unrelated spec surface was refreshed.
4. No secret, private scratch content, prompt injection, or one-off task diary was stored.
5. Validation matches the changed document or helper script.
