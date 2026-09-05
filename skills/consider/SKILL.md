---
name: consider
description: Use when requirements, an idea, or an architectural choice need clarification and design before implementation. Investigates project context and consequential tradeoffs; clear reversible work goes directly to Work.
---

# Consider

Turn an ambiguous request into a defensible, verifiable direction.

## Understand

Start from the desired user outcome. Recover matching domain terms, ownership, constraints, source/tests, and relevant prior decisions using injected topic routes. Read `references/read-spec.md` only when the project context needs more guidance.

Keep distinct:
- what the user explicitly requested or accepted;
- what current evidence establishes;
- what the agent assumes or infers;
- what remains unknown and could change the result.

Investigate recoverable facts before asking. Use domain context to ask only consequential questions; do not run a generic questionnaire. New evidence can refine the working focus, but must not silently replace the user's goal.

## Decide

Compare real alternatives and recommend one. When previous A/B reasoning may inform C/D, check the underlying priorities, constraints, and changed conditions first. An accepted past choice is not a blanket preference.

Describe target behavior, scope, constraints, acceptance examples, and unresolved assumptions. Add architecture or migration detail only where it changes feasibility or risk. Identify the cheapest evidence that could falsify the recommendation.

Do not implement the full solution while design is the requested deliverable. Small probes are appropriate when they resolve uncertainty cheaply.

## Preserve And Handoff

Land accepted consequential decisions and newly reliable project background through Memo autonomously, without a separate request to remember. Keep unimplemented targets explicit; ordinary discussion need not create a document. Use one external task record when accepted work must survive a session boundary.

Hand off to Work when implementation is authorized and the consequential choices are resolved. Otherwise present the recommendation and remaining user-owned decisions without turning routine choices into approval gates.
