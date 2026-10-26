# Decisions, Pitfalls, And Handoffs

Record a reason that can change plausible future work and is not already available from an authority worth linking. Skip rules for each type: [admission](admission.md). Prefer the existing topic. Create a note only when one coherent decision, fact, or procedure earns separate retrieval. A note may use `type: decisions`, `facts`, or `runbooks`. Its `description` is one sentence: what the note covers and when to read it. Use `log` for free-shape scratch. A weekly tidy distills what lasts into `facts` or `decisions`, then deletes the log. Do not move a finished task into the log. Keep the conclusion and applicability near the top, then useful reasons, when to reconsider, and evidence. The matching example is optional scaffolding, not a form to fill: [decisions](../templates/decisions.md), [facts](../templates/facts.md), [runbooks](../templates/runbooks.md), or [log](../templates/log.md).

## Decision Transfer

Preserve the actual problem, constraints, evaluation priorities, chosen alternative, and accepted cost. Attribute reasons individually when provenance differs. A confirmed choice does not make the agent's inferred explanation user-confirmed. Do not invent discarded alternatives.

For a future C/D choice after an A/B decision:
- retrieve by the shared evaluation dimension, not merely the selected technology;
- check whether the original constraints and priorities still apply;
- identify material differences that could reverse the result;
- use the old reasoning as evidence, never as a permanent command to prefer C.

One choice is not a universal user preference. Broaden scope only with evidence or an explicit user statement. Preserve explicit preferences once at their stated scope. Do not promote a recorded proposal or inferred reason to user acceptance through repetition. If acceptance provenance is missing, mark it unverified, not rejected. Keep confirmed targets, observed defects, and current behavior distinct, including accepted requirements absent from code. When a decision is reversed, retain only rationale that still affects a plausible choice. Delete obsolete detail rather than keeping a second historical specification.

## Pitfalls

Keep a pitfall only when its trigger remains plausible and a future agent needs a non-obvious cause or response not already covered by a reliable guard or native document. State the symptom, applicability, and effective response concisely, with uncertainty where needed. A retry succeeding once is not a general fix. Once code, tests, or patch documentation owns the necessary guidance, link that authority or remove the note. An incident's history need not survive its lesson.

## Handoff

Use one [task record](../templates/tasks.md) for accepted work that is in progress or still to do. Capture the goal, acceptance criteria, and `status` (`todo`, `doing`, or `blocked`). Do not copy the conversation. Do not create a second task tracker.

Update the same record when accepted scope or recovery state changes. When the work is done, lift conclusions that will change future behavior into a decision or a fact, then delete the task in that same `spec_edit` batch. Do not set `status: done` and leave the file. Do not move the task into `log`. Do not keep a second "completed" / "已完成" ledger. A final answer, Git commit, or quiet period does not by itself prove completion. Uncertain completion stays `doing` or `blocked` until the outcome is known. Deferred items, competitor comparisons, and one-off research are not lasting notes once the decision lands. See [admission](admission.md) and [maintenance](maintenance.md). No four-file change package or internal changelog is required.
