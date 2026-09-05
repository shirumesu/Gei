---
name: work
description: "Use for implementation, bug fixing, tests, builds, refactors, Git diagnosis, and releases. Executes a coherent change with proportionate verification."
---

# Work

Complete the requested outcome and gather evidence that it works.

## Execute

1. Establish the target behavior and completion evidence. Use injected project/topic routes, then the relevant source and tests. Code describes current behavior; accepted requirements define the target.
2. Locate the owning path. For a bug, reproduce or trace the failure when practical. Consult old decisions by their conditions, not as permanent rules.
3. Resolve consequential ambiguity through Consider; choose ordinary reversible details directly.
4. Implement the coherent change, preserving unrelated user work and removing obsolete pieces made unnecessary by it.
5. Verify with the cheapest discriminating check, expanding only for affected coupling or unresolved risk. Inspect the final diff.
6. Land earned external knowledge updates through Memo: missing background, accepted tradeoffs, verified pitfalls, stale claims/routes, or necessary handoff. This is authorized without a separate content approval. Routine edits need no note or internal changelog.
7. Report the result, verification, meaningful knowledge writes, and limitations.

Continue when evidence exposes another in-scope issue. Ask only for missing authority, unavailable facts, or user-owned choices that materially change the result.

## Verification

Use repository-native commands and expectations. Match tests to observable behavior rather than mirroring implementation. Test-first and broad suites are conditional tools, not fixed phases. Read `references/testcraft.md` only when test design needs it. Distinguish baseline failures from regressions; do not repeat passing checks without new cause.

## Recovery And Release

Keep coordination in the conversation unless accepted work needs cross-session recovery; then maintain one external task record through Memo. Preserve user decisions separately from agent assumptions.

Follow the user's Git policy and create only authorized checkpoints containing this task's changes. For versioning, packaging, deployment, or publication, read `references/ship.md`. Verify actual artifacts and remote outcomes when those actions are requested.
