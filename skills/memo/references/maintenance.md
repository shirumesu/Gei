# GeiSpec Maintenance

Use this reference to reconcile a verified change with durable context, repair known drift, or compact a Spec that has become repetitive or hard to route. Maintenance is event-driven: update when evidence changes a claim, not because a calendar interval elapsed.

GeiSpec is a recovery and routing layer, not a second implementation or behavior source of truth. Code, configuration, tests, schemas, observed behavior, repository-native specifications, and current user decisions remain authoritative.

## Reconciliation Gate

After a verified change, compare its durable effects with the current claims that future work will load or follow. Inspect only documents whose ownership could have changed.

| Durable effect | Owning surface |
| --- | --- |
| Purpose, responsibility, project relation, shared language, or read route changed | Project or Group `OVERVIEW.md` |
| Stable boundary, component ownership, critical flow, interface, state model, risk, or task entry point changed | `ARCHITECTURE.md` or one domain view |
| A consequential choice was accepted or replaced and its rationale will matter later | Decision record; mark the old record `Superseded` and link the replacement |
| Editing one surface now requires a non-obvious downstream update or check | Project or Group `IMPACTS.md` |
| A verified maintainer-meaningful outcome completed | Project `CHANGELOG.md` `Unreleased` |
| A hidden operational lesson passed the Memory write gate | The narrowest `MEMORY.md` index and entry |
| Accepted work, constraints, or unresolved questions must survive handoff | An active task reference or structured change package |

One outcome may update several owners because they answer different future questions. Do not duplicate the same prose across them. A Changelog entry never makes a stale current-state Overview or Architecture acceptable.

Distinguish three states:

- **Implemented and verified**: update current-state documents and Changelog.
- **Accepted but not implemented**: keep it in a task reference, structured change, or Proposed/Accepted decision record; do not describe it as current architecture.
- **Observed mismatch with uncertain intent**: preserve the evidence, surface the ambiguity, and do not guess which side should become authoritative.

When evidence is conclusive, correct drift autonomously in the same task. Ask only when resolving it requires a consequential user-owned decision.

## Behavior Specifications

Prefer repository-native requirements, API schemas, tests, product documentation, or an established Spec system for observable behavior. If a project uses OpenSpec, Spec Kit, an RFC process, or another native lifecycle, maintain that system as the behavior authority and route to it from GeiSpec when useful.

Do not create a parallel GeiSpec behavior catalog by default. Temporary change requirements may guide implementation, but after completion their durable contract must land in the owning native specification, test, schema, or product documentation. GeiSpec retains only the stable architecture, routing, impact, decision, outcome, or lesson needed for recovery.

## Drift Audit

Run a focused audit when the user asks, when a loaded claim conflicts with repository evidence, after a broad migration or rename, or when routing has become difficult. Do not turn every task into a full-document review.

1. Start from the injected Overview and affected change surface; identify only claims the change could invalidate.
2. Check exact paths, symbols, interfaces, generated artifacts, and linked documents against current evidence.
3. Search for renamed or removed concepts across the Project Spec and any affected Group layer.
4. Find duplicated rules, contradictory scope records, completed active task documents, superseded decisions presented as current, and Memory entries whose trigger or rule no longer applies.
5. Replace, move, merge, archive, or delete the stale content. Preserve history only in Changelog, version control, an accepted decision chain, or a genuinely valuable archived change.
6. Re-read the resulting routes as a future agent: each summary should say why and when to load the next document, and each link should resolve.

## Compaction

- Keep current-state documents current: rewrite sections instead of accumulating chronological amendments.
- Keep Overview injectable and Architecture scannable. Split Architecture only by a cohesive maintenance boundary; merge or delete a domain view when it no longer earns a separate read.
- Keep Impact routes sparse. Remove a route when the consequence disappears, becomes locally obvious, or gains a stronger deterministic guard.
- Keep Memory as a concise retrieval index. Merge overlapping lessons, delete obsolete ones, and move broadened lessons instead of copying them across scopes.
- Keep only active work in the active task area. Delete completed task references after durable facts land elsewhere; archive a structured change only when its rationale or audit history still has retrieval value.
- Keep Changelog as the history surface. Move completed Unreleased entries into the real release or checkpoint rather than repeating them in current-state documents.
- Prefer links to authoritative evidence over copied source detail. If a rule can be enforced reliably by a test, schema, linter, script, or Hook, make that mechanism authoritative and let GeiSpec route to it.

Stop when the remaining documents are accurate, non-overlapping, and cheaper to load than to rediscover.
