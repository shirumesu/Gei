---
name: consider
description: Use before implementation begins, when a user has an idea that needs design before code — clarifying scope, feasibility, approach, and boundaries. Use when the agent should recover project context, challenge ambiguity, research comparable solutions when they can affect the decision, define the full technical path, and stop until the user gives full-design approval. Not for tasks that are already clearly scoped and ready to implement.
---

# Consider

Turn an unclear idea into an explicit, approved design before implementation begins. Slow the work down at the beginning, recover the real project context, challenge weak assumptions, and produce a design that can be defended without guesswork.

## Core Principles

### User First

- If the user's request conflicts with producing a complete, defensible design, say which part you cannot accept and why, then continue only with the non-conflicting parts.
- You may refuse the user at any stage when continuing would preserve ambiguity, skip necessary design work, or produce a weak plan.
- The goal of this skill is not to help the user finish quickly. The goal is to collaborate with the user until the plan is explicit, complete, and approved.
- The user keeps full control over goals and decisions. Provide options, boundaries, and recommendations, not silent decisions on the user's behalf.

### Design First

- Spend most of the effort on design. The simpler the project looks, the more important it is to check whether hidden assumptions would waste the implementation.
- Every project must go through enough design discussion to make the key decisions explicit.
- Keep the design as broad and deep as the task truly requires, but do not expand it speculatively. Every added subsystem, abstraction, option, or future-proofing choice must be tied to a stated requirement, risk, constraint, or approved long-term direction.
- When approaches conflict, separate them and recommend one instead of blending incompatible assumptions into a compromise design.

### No Implementation Before Approval

- Do not take implementation action, scaffold, or write the full implementation until the user gives full-design approval.

### Ask Only When It Changes The Design

- Do not silently choose the user's goal, product direction, priority, system boundary, or success standard.
- Ask only for unresolved user-owned decisions that would materially change the design, scope, acceptance check, risk posture, or build order.
- Do not ask about facts that are researchable from local context, previous discussion, specs, code, logs, docs, or the user's current message. Inspect first, then ask only if the evidence is missing or contradictory.
- Do not repeat a question that has already been answered. Carry the prior answer forward, state it as context, and ask only about the new delta if something changed.
- Do not ask a question just to satisfy process. If there is no blocking user-owned decision, state the relevant assumptions and continue to alternatives or design.
- Do not present obviously wrong, incompatible, unavailable, or already rejected choices as options. If one credible direction remains, explain why and continue with it as a recommendation or assumption.
- If proceeding would require guessing a user-owned decision — including one hidden inside an assumption you are making — expose it and ask, or decompose the work first.
- When asking a blocking question, provide 2-3 credible options, explain why each option matters, recommend one option, and state the likely downside or risk. If fewer than two credible options exist, ask a direct question instead of manufacturing choices.
- Prefer a dedicated question tool when one is available instead of simulating the format in plain text.

### Decision Ownership

Before expanding an idea, classify each unresolved point:

1. **User-owned decision:** ask before continuing only if it is unresolved and would materially change the design.
2. **Researchable fact:** inspect local or external context before asking.
3. **Agent-owned detail:** decide later and disclose in the design.

A decision is user-owned when it affects the goal, scope, priority, user workflow, data boundary, risk tolerance, compatibility, success standard, or whether the agent may choose among alternatives. **NEVER** replace a user-owned decision with a reasonable assumption.

The agent may decide only low-cost, reversible details that follow from existing project conventions and do not change user-visible behavior, data handling, architecture, or long-term maintenance.

### Match The Scale

- Keep simple parts short.
- Use roughly 200-300 words for sections that are complex enough to need real explanation.

### Exit Rule

- The only valid end condition before handoff is full-design approval. There are no exceptions.

## Boundary

- Consider is for design, not implementation; do not write the full implementation here.
- Work on one bounded problem at a time.
- You may use examples, partial core code, local code fragments, implementation notes, or pseudocode to make the design concrete.
- After full-design approval, hand off through the lifecycle started by `using-gei`. Do not hard-code `memo` as the next step for every approved design.

## Process

### Phase 0: Start And Scope

- Decide whether the request is one bounded problem before exploring details.
- Ask or decompose first when the real goal, success standard, priority, key constraint, product direction, technical boundary, or build order is unclear.
- If the request contains several independent subsystems, split it into subprojects first. Explain how they relate, recommend the build order, and ask which subproject to design first.
- Give each subproject its own design, approval, plan, and implementation cycle.

**Exit only when:**

- The task is one bounded problem, or the user has selected the first subproject.
- The agent is not about to choose the goal, scope, priority, product direction, technical boundary, or build order silently.

**Good example:** "Build a platform with chat, file storage, billing, and analytics." First decompose it into chat, storage, billing, and analytics subprojects. Explain dependencies and ask which subproject to design first.

**Bad example:** Ask detailed questions about chat retention, invoice tax rules, storage quotas, and analytics dashboards in one round.

### Phase 1: Context Recovery

- Check whether the project already has clear Spec documents.
  - Yes: follow `consider/references/read-spec.md` to recover context.
  - No: if the project is not empty, inspect the files, documents, and recent commits.
- Check researchable local facts before asking the user.
- Do not propose a design that conflicts with existing architecture, conventions, or durable project constraints unless the user explicitly wants that change.

**Exit only when:**

- Existing project constraints are known enough to avoid an incompatible design.
- Researchable local facts have been checked before asking the user to decide.

### Phase 2: Clarification When Needed

Ask questions only when unresolved user-owned decisions, risks, ambiguities, or hidden requirements would materially change the design. If context recovery and prior discussion already answer the relevant decisions, do not run a clarification round; carry the answers forward and continue. If a question is needed, ask exactly one blocking question at a time, then **STOP** and wait for the response.

The request must be clear enough to include:

- **What:** what should be built, changed, or decided.
- **Why:** who needs it, what pain exists, what remains unresolved, and why it matters now.
- **How:** examples of how it should work, using code fragments, local core logic, direct explanation, or pseudocode instead of full code.
- **Success:** how the user will judge that the result is good enough.

When asking, apply the option rules from Ask Only When It Changes The Design: 2-3 credible options with a recommendation and downside, and no manufactured, incompatible, or already rejected choices. Do not ask "Can you clarify?" by itself.

**Exit only when:**

- The user's goal, constraints, and success standard can be stated without guessing.
- All blocking user-owned decisions are answered or explicitly deferred by the user.
- Remaining uncertainty can be safely carried into alternatives or design.

### Phase 3: Feasibility And Alternatives

Use comparable products and similar implementations to test whether the design is realistic. Search externally before writing the proposal when outside facts can materially change the design, such as product behavior, framework choice, platform constraints, integration style, compliance expectations, or user-facing workflow norms.

For local workflow, Skill, prompt, template, or spec wording changes, inspect the local context first. Search the web only when it would change a real design decision; do not make external research a ritual for text-only local workflow design.

- Study mainstream commercial or closed-source products, open-source projects, and similar implementations.
- Inspect their feature set, visual presentation, usage pattern, chosen technical stack, public implementation details, and concrete implementation shape.
- Research only the design topics that affect the current decision: product behavior, framework choice, integration style, storage model, security boundary, deployment shape, verification method, or other material design choices.
- Scope the research to the specific design being considered. Do not research full-system architecture for a simple feature unless that architecture would affect the decision.
- If visible replacement products already cover the user's real need, show them with links so the user can judge whether to build anything.

When the design can reasonably go in multiple directions, present 2-3 approaches with tradeoffs and your recommendation. The user is choosing a direction here, **not** approving implementation. Ask which approach to use, then **STOP**.

Before presenting a full design, notice which decisions actually shape the result. Present a real fork that would change the design as options under the same Core Principles option rules; keep minor, reversible details as assumptions or implementation notes instead of making the user approve noise.

**Exit only when:**

- Feasibility has been checked enough for the design scale.
- Incompatible approaches have been separated.
- The user has approved one direction, or only one direction is credible and that assumption has been stated.

### Phase 4: Design

Present the full design. Clarify the complete technical path, explicit boundaries, unit responsibilities, risks, failure behavior, and verification method.

The design must define:

- What will be built or changed.
- What is explicitly out of scope.
- Which approach was selected and why.
- The main units, their purpose, inputs, outputs, dependencies, and interfaces.
- User workflow and system behavior, including failure cases.
- Data handling, compatibility constraints, and rollback cost when relevant.
- Test and verification method, including known edge cases.
- Whether the demand is temporary or durable over the next 6-12 months.

**Good design:** Configuration sync feature -> use symbolic links so different applications share one configuration source. Store the source configuration in this project. Support only manual switching and one-way sync from this project's source configuration into target applications. If a switch fails, show a failure toast. Do not read configuration values back from target applications.

**Bad design:** It does not define target applications, technology, UI, boundaries, system impact, rollback cost, failure cases, or unsupported behavior.

Before approval, self-review:

- Could someone with no context explain each part without drifting?
- Are there placeholders, contradictions, or ignored details from earlier discussion?
- Would the three most important remaining questions still change the design decisively?
- Can success be verified concretely?

Pressure-test the design before asking for approval. Look for likely user objections, scope drift, mechanical misreads by future agents, unjustified complexity, hidden coupling, missing failure behavior, and vague verification. This is thinking work, not a response template: in the response, focus on the points that change the design, require a user decision, or would materially affect implementation.

For instruction, skill, template, prompt, spec, or agent-workflow designs, focus on the behavior the wording should reliably produce. Consider intended behavior, non-goals, likely over-application or under-application, interaction with existing rules, examples, and user burden when they matter. Avoid adding rigid required fields unless the absence of that field caused a real failure or is likely to cause repeated failure.

If self-review finds a blocking hole, ask the next blocking question or revise the design. Do not continue to approval.

**Exit only when:**

- The full design is explicit and internally consistent.
- No unresolved user-owned decision is hidden inside the design.
- The design is ready to be approved or rejected as a whole.

### Phase 5: Approval

Request approval for the complete design as its own step. Do not combine final approval with implementation steps, file edits, scaffolding, commits, or handoff.

Before asking, label the design:

- **User-decided:** decisions the user explicitly made.
- **Agent-recommended:** recommendations the agent is proposing for approval.
- **Assumptions:** facts or defaults being assumed.
- **Deferred:** decisions intentionally left for implementation, with why they are safe to defer.
- **Out of scope:** behavior that will not be built in this cycle.
- **Acceptance check:** how the user and the agent will verify success.

Ask a final approval question that is only about the complete design:

```text
Do you approve this complete design for implementation?
```

Only full-design approval allows handoff. Full-design approval means the user clearly approves the complete labeled design, including scope, exclusions, selected approach, risks, and acceptance checks.

**Valid full approval examples:**

- "I approve this complete design."
- "Use this full design and proceed."
- "This design is approved; start implementation."

**NOT full approval:**

- "This part is fine."
- "The direction is right."
- "Sounds reasonable."
- "Let's consider it."
- "Yes" after a narrow clarification question.
- Choosing one alternative in Phase 3.
- Approving a mockup, example, or single section only.

When the user gives partial approval, acknowledge the approved part, update or continue the design, and stay in the current phase. **NEVER** treat partial approval as permission to implement.

After a full design has been presented, classify follow-up discussion by impact. If the user finds a new problem, rejects a part, or opens a new discussion point, return to the relevant earlier phase and focus only on that point until it is resolved. Do not repeat the full final design in every reply.

When a follow-up revises one assumption, wording choice, section, rule, boundary, or example, keep the discussion focused on that point, state the exact delta, and say whether the rest of the design still stands. Ask any needed local approval for that delta first. Present the complete revised design and ask for full-design approval only after the new discussion point is resolved, when the change affects the goal, scope, selected approach, architecture, success standard, acceptance check, or the user asks for the complete revised design.

**Exit only when:**

- The user explicitly approves the complete labeled design.
- The approval is not merely agreement with one point, one section, one option, or one recommendation.

### Phase 6: Handoff

Enter this phase only after full-design approval.

Start with a visible transition sentence:

```text
Approved design received. I am now leaving `consider` and returning to the Gei lifecycle for the next step.
```

Hand off only these items:

- The complete approved design.
- The intended next objective: durable planning, implementation, or no implementation.
- Any known constraints that the next skill must preserve.

Do **not** decide the next skill's internal workflow here. Do **not** create implementation plans, file anchors, commits, scaffolding, or edits inside `consider`.

After this point, follow `using-gei` lifecycle routing and load the next skill only when needed. Do not introduce new design decisions during handoff. If a new user-owned decision appears, return to Phase 2, Phase 3, or Phase 4.
