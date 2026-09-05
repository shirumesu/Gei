---
name: work
description: "Implement, debug, refactor, and deliver working changes across their real consumers. Use for execution and verification, including builds and releases; unresolved consequential design belongs in Consider."
---

# Work

Close the gap between a plausible local patch and a working outcome.

## Trace The Delivery Path

Use project topic routes, then follow the affected entry point through the owning implementation to its consumers. Compare a working neighboring flow for product and integration conventions.

Choose evidence that would reject a plausible incomplete fix: a helper accepting an option does not prove the CLI parses it or the UI passes it. For changes spanning layers, establish one usable entry-to-result path, then reconcile affected callers, configuration, persisted state, or artifacts. Preserve real consumer contracts; remove obsolete parallel paths made unnecessary by the change.

Use Consider for unresolved consequential choices; continue independent work and choose routine reversible details directly.

## Diagnose Before Accumulating Fixes

Compare the failing path with a working case. Probe where their input, state, or timing first diverges; change the responsible behavior and rerun that case. If evidence contradicts the hypothesis, revise it rather than stacking speculative fixes. Distinguish a traced cause from a suspected one when reproduction is unavailable.

## Verify Where The Result Is Used

Exercise the actual changed entry/consumer, including a nearby case where the change might overreach. For presentation, inspect the rendered view/output and meaningful states against product conventions; build success cannot prove appearance. Name unavailable evidence precisely.

Read [testcraft](references/testcraft.md) when test design is needed; mechanical edits need no new tests. Before delivery, inspect the diff for incomplete consumer updates, leftover probes, and stale paths. Separate baseline failures from regressions.

- For release or packaging work, read [ship](references/ship.md); verify the actual authorized artifact/destination.
- Maintain earned external knowledge or necessary handoffs through Memo autonomously. Routine execution needs no knowledge log or separate plan file.
