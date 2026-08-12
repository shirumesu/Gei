---
name: consider
description: Use when an idea, feature, architecture choice, or workflow needs design before implementation because scope, feasibility, boundaries, or consequential tradeoffs are still unresolved. Not for clearly scoped, low-risk work that can be implemented directly.
---

# Consider

Turn consequential ambiguity into a defensible direction. Do enough design to make implementation safe; do not make discussion an end in itself.

## Boundary

- Use this Skill when an unresolved choice could materially change user behavior, data boundaries, architecture, migration cost, risk, or acceptance.
- For clear, low-risk, reversible work, state any useful assumption and proceed through the implementation workflow.
- Inspect researchable facts before asking the user. Ask only for decisions the user must own or facts that cannot be recovered safely.
- Do not implement the full solution while design is the requested deliverable. Small examples, prototypes, or probes are allowed when they are the cheapest way to resolve uncertainty.

## Workflow

1. **Recover context.** Read the smallest relevant code, tests, docs, history, or supplied references. If the project uses Gei specs and they matter, follow `references/read-spec.md`.
2. **Find the real decision.** State the desired end state, inherited constraints, unknowns, and what would make the decision wrong.
3. **Resolve uncertainty.** Research facts that could change the direction. Ask a concise question only when a missing user choice would materially alter the result.
4. **Compare real alternatives.** When more than one credible direction remains, explain the meaningful tradeoff and recommend one. Do not manufacture options.
5. **Design the target.** Cover scope, main boundaries or interfaces, failure behavior, migration or compatibility when relevant, and how success will be verified.
6. **Identify the cheapest proof.** Name the experiment, prototype, test, or evidence that would confirm or falsify the riskiest assumption.

Match depth to consequence. A local decision may need a paragraph; an architectural change may need a structured design and staged migration.

## Handoff

End with a clear recommendation, material assumptions, unresolved decisions, and acceptance evidence. Ask for approval only when implementation authority or a consequential user-owned decision is still missing; otherwise the design can hand off directly to execution.

When the user accepts a consequential decision or the design must survive a session boundary, preserve it through Memo in the lightest owning artifact. Record an unimplemented target as a task reference, structured change, or decision record, never as current Architecture. Implementation later reconciles the verified result into current-state documents.
