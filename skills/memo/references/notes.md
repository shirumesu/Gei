# Decisions, Pitfalls, And Handoffs

Record a reason that can change plausible future work and is not already available from an authority worth linking. Prefer the existing topic; create a note only when one coherent decision, fact, or procedure earns separate retrieval. A note may be `decisions`, `facts`, or `runbooks`, and takes a one-line `description`. Use `log` when the shape is free. Keep the conclusion and applicability near the top, followed by useful reasons and evidence. The matching example is optional scaffolding, not a form to fill: [decisions](../templates/decisions.md), [facts](../templates/facts.md), [runbooks](../templates/runbooks.md), or [log](../templates/log.md).

## Decision Transfer

Preserve the actual problem, constraints, evaluation priorities, chosen alternative, and accepted cost. Attribute reasons individually when provenance differs: a confirmed choice does not make the agent's inferred explanation user-confirmed. Do not invent discarded alternatives.

For a future C/D choice after an A/B decision:
- retrieve by the shared evaluation dimension, not merely the selected technology;
- check whether the original constraints and priorities still apply;
- identify material differences that could reverse the result;
- use the old reasoning as evidence, never as a permanent command to prefer C.

One choice is not a universal user preference. Broaden scope only with evidence or an explicit user statement; preserve explicit preferences once at their stated scope. Do not promote a recorded proposal or inferred reason to user acceptance through repetition. If acceptance provenance is missing, mark it unverified, not rejected. Keep confirmed targets, observed defects and current behavior distinct, including accepted requirements absent from code. When a decision is reversed, retain only rationale that still affects a plausible choice; delete obsolete detail rather than keeping a second historical specification.

## Pitfalls

Keep a pitfall only when its trigger remains plausible and a future agent needs a non-obvious cause or response not already covered by a reliable guard or native document. State the symptom, applicability and effective response concisely, with uncertainty where needed. A retry succeeding once is not a general fix. Once code/tests/patch documentation owns the necessary guidance, link that authority or remove the note; an incident's history need not survive its lesson.

## Handoff

Use one [task record](../templates/tasks.md) only for accepted work that needs cross-session recovery. Capture goal, accepted decisions, open assumptions, current state, next action, and verification pointers. Do not copy the conversation.

Update the same record when accepted scope or recovery state changes. Set `status` to `todo`, `doing`, `blocked`, or `done` as the work moves. At completion, merge only earned lasting knowledge into its owner, then delete the handoff in the same batch. That delete removes its generated INDEX line. Do not leave `status: done` as a progress ledger or second product-spec book. Repair links that other documents still make to it. Preserve still-useful reasoning in its topic/note owner, not a completed task inventory. Deferred items, competitor comparisons, and one-off research are deleted once the decision lands; they are not lasting notes. Uncertain completion stays until the outcome is known; age is not a deletion reason. See [maintenance](maintenance.md). No four-file change package or internal changelog is required.
