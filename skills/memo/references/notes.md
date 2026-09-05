# Decisions, Pitfalls, And Handoffs

Record the reason a future agent would otherwise have to rediscover. Use one note for one coherent decision or pitfall. Keep the conclusion/status and applicability near the top, followed by only useful reasons, alternatives, reconsideration conditions, and evidence. The [note example](../templates/note.md) is optional scaffolding.

## Decision Transfer

Preserve the actual problem, constraints, evaluation priorities, chosen alternative, and accepted cost. Attribute reasons individually when provenance differs: a confirmed choice does not make the agent's inferred explanation user-confirmed. Do not invent discarded alternatives.

For a future C/D choice after an A/B decision:
- retrieve by the shared evaluation dimension, not merely the selected technology;
- check whether the original constraints and priorities still apply;
- identify material differences that could reverse the result;
- use the old reasoning as evidence, never as a permanent command to prefer C.

One choice is not a universal user preference. Broaden scope only with evidence or an explicit user statement. Mark accepted-but-unimplemented work separately from verified implementation. Update implementation references in place; a reversed decision needs a clear supersession link or a compact explanation preserving still-useful rationale.

## Pitfalls

Keep the recognizable symptom, applicable environment, verified cause or remaining uncertainty, effective response, and conditions that retire the lesson. A retry succeeding once is not a general fix. If a deterministic guard makes the lesson unnecessary, route to the guard or remove the note.

## Handoff

Use one [task record](../templates/task.md) only for accepted work that needs cross-session recovery. Capture goal, accepted decisions, open assumptions, current state, next action, and verification pointers. Do not copy the conversation.

Update the same record when accepted scope or recovery state changes. At completion, merge only earned lasting knowledge into its owner and remove the active route. Delete the task record when its content adds no recovery or reasoning value; otherwise keep it clearly completed and outside active routes. No four-file change package or internal changelog is required.
