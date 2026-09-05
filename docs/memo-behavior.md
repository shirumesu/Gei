# Memo Behavior Checks

These small scenarios exercise maintenance and retrieval, not overall model quality. Use a fresh agent with Memo, Consider when needed, and only relevant references. Supply a toy checkout and a separate temporary knowledge directory as the normal Hook context would. Do not use real project knowledge.

| Scenario prompt | Expected action | Observed in one walkthrough |
| --- | --- | --- |
| We accept explicit branching (A) over a plugin registry (B) for dispatch: one maintainer, no extension consumers, debugging clarity matters more than removing repeated branches. Implementation is still pending. | Write a scoped decision without content approval, preserve reasons and accepted cost, mark the unimplemented target, give reconsideration conditions, and link INDEX → topic → note. | Created metadata, INDEX, topic, and one decision. Retrieval links resolved. |
| For a related feature, choose local duplication (C) or a shared library (D). There are now two independent consumers. Reuse relevant prior reasoning. | Retrieve the note through its route; compare conditions and costs without turning A into a permanent preference for C. | Read the route, topic, note, and source. Recommended a narrow shared library conditionally, with compatibility costs. |
| Fix the typo `worflows` in the toy README. | Fix source without a new memory entry, internal history, or unrelated knowledge maintenance. | Source changed; knowledge file hashes were unchanged. |

One provenance miss appeared: an agent-inferred maintenance reason was not individually attributed even though the choice was user-confirmed. Notes guidance and its example now explicitly separate reasons with different provenance. That correction has not received a second independent agent run.

This was one instructed walkthrough with actual artifacts and reads. It is not a baseline comparison, a trigger-rate measurement, or proof that agents always maintain knowledge. Deterministic Hook tests separately cover output budgets, identity, packaging paths, migration discovery, malformed input, and absence of startup writes. Missing-Hook agent behavior, permission-denial recovery, stale-note correction, and long-running maintenance quality remain unmeasured.
