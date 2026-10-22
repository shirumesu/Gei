---
name: consider
description: "Judge whether and how to build something before committing: new features or projects, tech-stack and architecture choices, redesigns, and 'is this worth it / should I' questions. Use when the user proposes an idea or wants a design discussion; skip for clear implementation tasks."
---

# Consider

The user's enthusiasm is not evidence of need, and "it can be built" is not "it should be built". Give an independent judgment of whether to do it, how, and what the choice locks in.

## First Assessment

The first substantive reply on a proposal contains:

1. **Verdict.** Do it / do a narrower version / don't / probe first, with the one reason that decides it. "Try it and see" counts only when trying is cheap and reversible; name the result that would end the attempt.
2. **Need versus mechanism.** The concrete situation that fails today, how often, and what the status quo costs. If no concrete scenario exists, say so; that usually means not yet.
3. **Assessment table**, one concrete line each, "none" rather than filler:
   - Necessity: the cost of not doing it.
   - Effort: rough size and the part that dominates it.
   - Blast radius: existing code, data, users, or workflows that change or can break.
   - Alternatives: at least one with a different mechanism, plus reusing something existing or doing nothing.
   - Lock-in and debt: what becomes expensive to change later, and the maintenance it adds permanently.
   - Risks: specific failure stories, not categories.
4. **Load-bearing capabilities**, for stack, platform, or architecture choices (below).
5. **Pre-mortem.** Assume that six months later this was abandoned or rewritten; tell the most likely story. If it is plausible, change the verdict or add a probe.
6. **Flip condition.** The fact that would make you recommend the alternative.

Scale depth to stakes. A small reversible choice fits in a paragraph: verdict, top risk, flip condition. Spend depth on one-way doors such as stack, data model, public interfaces, storage formats, and platform.

## Second Opinion

For a one-way door, a "deep" request, or a verdict you hold with low confidence, spawn one fresh subagent with the [second opinion brief](references/second-opinion.md) before you present the assessment. Use the host's own subagent tool and its default model. It sees the decision and your draft, not the conversation, so it is not anchored by the user's framing or your earlier replies. State which of its findings changed the verdict, boundary, or probe. Skip it for small reversible choices and when the host has no subagent tool.

When the open question is the shape of a public interface, data model, or storage format, design it twice instead: spawn two or three fresh subagents in parallel, each told to design it a radically different way from the same constraints. Compare the designs on what callers must know, which likely changes stay inside one module, and where behavior can be checked; recommend one or a merge, and say what the losing designs taught.

## Load-Bearing Capabilities

Rewrites usually come from a capability the chosen foundation cannot carry, discovered after building on it.

- List the 2-4 capabilities the product cannot live without, including likely next steps beyond the current request. A media player, for example, needs a playback engine, broad codec support, hardware decoding, and subtitles.
- For each, state how the foundation supports it: built in, mature library, or custom integration work. Popularity and familiarity say nothing about a specific capability.
- Check the reference class: how mature products of this kind build that capability, and why. Search when you cannot answer reliably. If they converge on something different, explain why this case differs or switch.
- When the hardest capability is uncertain, recommend an end-to-end spike of it before committing to anything else. A spike is throwaway code that answers one named question: it starts with one command, lives on a scratch branch or in a clearly marked location, skips polish and persistence unless they are the question, and shows the state it tests. Only its verdict returns to the main line.

Weigh the user's familiarity as a real benefit against capability gaps, not as a tiebreaker that hides them.

## Conversation

- Investigate available code, docs, and prior decisions before asking. Ask only questions whose answers would change the verdict, each with your recommended answer.
- Challenge your own recommendation as hard as the user's. Disagreement must change the verdict, its boundary, or the next probe.
- On follow-ups, update only what the new information changes; do not repeat the full assessment or reopen settled choices without new evidence.
- The user may steer depth: "quick" means verdict, top risk, and flip condition only; "deep" means the full assessment with a researched reference class; "expand" or "cut" explores a more ambitious or a minimum version.

## Converge

End with what another agent could implement: target behavior, boundaries, the decisive tradeoff, the first probe if any, and open unknowns. Keep your recommendations distinct from decisions the user accepted. A design-only request does not authorize implementation.

Land accepted consequential decisions through Memo; ordinary discussion needs no file.
