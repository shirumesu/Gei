# GeiSpec Maintenance

Maintain GeiSpec at two cadences: a lightweight pass after state-changing work, and a broader reconciliation when a version or checkpoint closes. GeiSpec is a recovery and routing layer; code, configuration, tests, schemas, observed behavior, repository-native specifications, and current user decisions remain authoritative.

## Routine Change Pass

Use the changed surface, the injected Project Overview and Unreleased outcomes, and only an owning document directly implicated by the result. This is maintenance of the change, not an audit of the Spec.

1. For a verified durable result, append or fold one concise maintainer-meaningful outcome into Project `CHANGELOG.md` `Unreleased`.
2. Read an owning current-state document only when the change can alter one of its claims.
3. Rewrite or remove the smallest affected claim; do not preserve stale text by appending a caveat.
4. Stop without inspecting unrelated domains. Pure formatting, generated churn, failed attempts, or transient state may require no durable write.

| Durable effect | Owning surface |
| --- | --- |
| Purpose, responsibility, project relation, shared language, or read route | Project or Group `OVERVIEW.md` |
| Stable boundary, ownership, critical flow, interface, state model, risk, or task entry point | `ARCHITECTURE.md` or one domain view |
| Consequential accepted or replaced choice | Decision record; supersede and cross-link the old record |
| Non-obvious downstream update or check | Project or Group `IMPACTS.md` |
| Hidden operational lesson | The narrowest Memory index and entry, when its write gate passes |
| Accepted work that must survive handoff | Active task reference or structured change package |

Describe implemented and verified facts as current. Keep accepted but unimplemented targets in a task/change document or decision record. If evidence and intended truth disagree, surface the ambiguity rather than guessing.

Observable behavior stays in repository-native requirements, tests, schemas, or product documentation. Temporary change requirements must land in that authority after implementation; do not create a parallel GeiSpec behavior catalog by default.

## Release Or Checkpoint Reconciliation

Run this broader pass when `Unreleased` is promoted into a formal version/checkpoint, when the canonical version is being released, or after a broad migration or explicit drift-review request.

1. Establish the release delta from the native Changelog, changes since the prior version/checkpoint, and active task/change documents.
2. Review Project Overview, root Architecture, Impacts, Memory index, and active task documents; open only domain views, decisions, entries, or Group surfaces touched by the delta.
3. Merge verified current facts into their owners, resolve contradictions, supersede replaced decisions, and remove or archive completed task material.
4. Compact duplicate or obsolete routes and lessons, then move the verified Unreleased outcomes into the real version/checkpoint and leave a fresh Unreleased section.
5. Re-read the resulting routes as a future agent and confirm that named paths and links still resolve.

This is a complete Spec reconciliation for the release delta, not a reread of the entire repository or unrelated domains.

## Compaction Rules

- Rewrite current-state sections instead of accumulating chronological amendments; history belongs in Changelog, version control, or a decision chain.
- Keep Overview injectable and root Architecture scannable. Split, merge, or delete domain views by maintenance boundary and retrieval value.
- Remove an Impact route when its consequence disappears, becomes obvious locally, or gains a stronger deterministic guard.
- Keep Memory as a concise retrieval index; merge, move, or delete obsolete and overlapping lessons.
- Keep only active work in the active task area. Archive completed changes only when their rationale or audit history remains useful.
- Prefer links to authoritative evidence. When a test, schema, linter, script, or Hook can enforce a rule, make it authoritative and let GeiSpec route to it.

Stop when the affected current facts are accurate and the release-level routes are non-overlapping and cheap to recover.
