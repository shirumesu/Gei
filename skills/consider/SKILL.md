---
name: consider
description: Use before any creative work begins, when a user has an idea, wants help brainstorming, needs to clarify scope or feasibility, or needs an approved design before implementation. Use when Codex should recover project context, challenge ambiguity, research comparable solutions, define the full technical path and boundaries, and stop until the user explicitly approves the design.
---

# Consider

Turn an unclear idea into an explicit, approved design before implementation begins. Slow the work down at the beginning, recover the real project context, challenge weak assumptions, and produce a design that can be defended without guesswork.

## Core Principles

### User First

- If the user's request conflicts with any part of this skill, say which part you are ignoring and why, then continue with the user's request for every non-conflicting part.
- The user keeps full control. Provide options, boundaries, and recommendations, not silent decisions on the user's behalf.

### Design First

- Spend roughly 80% of the effort on design. The simpler the project looks, the more likely hidden assumptions can waste the work.
- Every project must go through enough design discussion to make the key decisions explicit.

### No Implementation Before Approval

- Do not take implementation action, scaffold, or write the full implementation until the user explicitly approves the design.

### Ask Before Deciding

- Do not silently choose the user's goal, product direction, priority, system boundary, or success standard.
- If a meaningful decision depends on an assumption you are making, expose the assumption and ask before continuing.
- If the request is ambiguous, complex, or likely inaccurate, ask a question or decompose the work before proposing a full design.
- Even when the user asks for a plan or solution, ask first if a missing answer would materially change the result.
- Ask only one question at a time.
- When the answer should be a choice, provide 2-3 options, explain the tradeoffs, recommend one option, and state the likely downside or risk.
- Prefer a dedicated question tool when one is available instead of simulating the format in plain text.

### Match The Scale

- Keep simple parts short.
- Use roughly 200-300 words for sections that are complex enough to need real explanation.

### Exit Rule

- The only valid end condition is explicit user approval of the design. There are no exceptions.

## Boundary

- Consider is for design, not implementation; do not write the full implementation here.
- Work on one bounded problem at a time.
- You may use examples, partial core code, local code fragments, implementation notes, or pseudocode to make the design concrete.
- After approval, continue only through the user-selected mode: implementation in the current thread, delegated execution, plan persistence, or a handoff prompt for a new thread.

## Process

### 0. Precondition

- Check whether the `memo` skill exists in the environment. Do not tell the user about this check. If it exists, continue.

### 1. Scope gate

Before exploring details, decide whether the request is one bounded problem. Ask or decompose first if any of these are true:

- The user's real goal, success standard, or priority is unclear
- The request contains several independent subsystems
- The request can reasonably be solved in several incompatible ways
- A key constraint is missing and would materially change the design
- You are about to choose a product direction, technical boundary, or build order on the user's behalf

If the request is too large, do not refine details inside the oversized project. Split it into smaller subprojects first, then continue the Consider process for the first approved subproject. When decomposition is required:

- Identify the independent subprojects
- Explain how they relate, recommend the build order, and ask which subproject to design first
- Give each subproject its own design, approval, plan, and implementation cycle

- **Good example:** "Build a platform with chat, file storage, billing, and analytics." First decompose it into separate chat, storage, billing, and analytics subprojects. Explain their dependencies and recommend which one to design first.
- **Bad example:** Ask detailed questions about chat retention, invoice tax rules, storage quotas, and analytics dashboards in one round.

### 2. Explore context

- Check whether the project already has clear Spec documents.
  - Yes: follow `consider/references/read-spec.md` to recover context
  - No: if the project is not empty, inspect the files, documents, and recent commits

### 3. Explore boundaries

Think and ask questions so the user clarifies any risk, ambiguity, or hidden requirement.

**Passing standard:**

The user's request must be expanded until it is clear and detailed enough to include at least:

- **What:** a clear, explicit, and complete idea of what should be built
- **Why:** who the user is, why they need it, whether the current workflow already has pain points, what is still unresolved for them, and whether the feature is important
- **How:** examples for how it should work, using code fragments, local core logic, direct explanation, or pseudocode instead of full code

If the user is not yet clear about the exact implementation shape, carry the uncertainty into step 5 and refine it there.

- **Good example:** The user often uses several similar applications whose configuration items are already known to be compatible. They want a feature that can sync configuration across those applications, and the accepted values, key names, and operating behavior of each target application are already confirmed to match, so no special compatibility layer is needed.
- **Bad example:** "I want a configuration sync feature."

**Common patterns:**

- The user ran into a problem and wants the most direct possible fix
  - Apply YAGNI: implement only when the requirement is clear and important enough now. Do not build early for future possibilities.
  - Assume you only have three chances to change the system. If the feature cannot fit, explain the impact, offer a reduced core unit, or say that the feature seems unnecessary.
- The user has a good idea, but it is still unvalidated
  - Check whether implementation will be hard. Reading the target environment counts as part of context exploration.
- The user wants a feature but does not know how it should be built, so they unconsciously skipped design
  - Ask enough to confirm the user's goal, constraints, and preferred direction before providing the design for approval.

### 4. Explore feasibility

Use comparable products and similar implementations to test whether the design is realistic. When external context is needed, search mature commercial products and open-source projects.

- Study their visual presentation, usage pattern, chosen technical stack, and concrete implementation shape.
- Stop only when information, not memory, proves you understand the mainstream architecture and implementation pattern for this problem.
- Do not research full-system architecture for a simple feature. If local context is enough, say why and continue.
- Research a full product or architecture only when the user's choice depends on product shape, technical stack, or long-term system direction.

  - **Good example:** Building a login page -> study how comparable products present the page visually, what buttons they include, how they communicate with the backend, and how they protect passwords.
  - **Bad example:** Building a login page -> study the entire site architecture, explore every other page, investigate all user permissions, and read the full user rules. Even if the project truly lacks those parts, do not expand into them unless the user explicitly asked. Treat them as future TODOs instead.

**Compare against the request:**

- If the user's request already has visible replacement products, show them to the user with links so they can judge whether those products already cover the real need.

### 5. Detailed design rules

Clarify the full design: the complete technical path, explicit boundaries, and possible risks or failures.

- **Good design:** Configuration sync feature -> use symbolic links so different applications share one configuration source. Store the source configuration in this project. When the user switches configuration, update the target application's config file through the symbolic link automatically. Present the switching control as a Segmented Control UI. Use shadcn/ui for the interface style. Support only manual switching. Support only one-way sync from this project's source configuration into the target applications. If a switch fails, show failure toast at the bottom-right of the interface. In the current version, only maintain this project's source configurations and switch symbolic links between them. Do not support reading configuration values back from the target applications.

- **Bad design:**
  - It does not define which applications need to be synced
  - It does not define the implementation technology
  - It does not define the UI
  - It does not define the boundaries
  - It does not define system-scale impact, rollback cost, or failure and attack angles such as prerequisite collapse
  - It does not define possible failure cases

**Unit boundaries:**

- Break the system into units with clear purpose, inputs, outputs, dependencies, and explicit interfaces.
- Each unit should answer: what it does, how it is used, and what it depends on.
- A user of the unit should understand its responsibility without reading internals, and internals should change without breaking consumers.
- Treat large files, mixed responsibilities, or unclear dependencies as signs that the boundary needs improvement.

**Consider long-term usefulness:**

- Is this demand temporary or durable? If the system runs for 6-12 months, will this become a discarded workaround or something the project should keep?

**Validate architectural consistency:**

- Check that the design still fits the project's existing architecture and conventions.
- Do not let the discussion drift into a design that cannot be integrated, such as switching from SQL to file storage when the system is already built around SQL, unless the user explicitly wants that architectural change.

### 6. Self-review

Review the information and check this list:

- Is the design explicit enough that someone with no context, domain knowledge, or technical background could explain each part without drifting?
- Is the test and verification method explicit, including at least some known edge cases?
- Are there still placeholders, ambiguity, or contradictions introduced by later discussion?
- Can the result be verified in a concrete and measurable way, such as with test files or other quantifiable checks?

**Expand the discussion when needed:**

- Was anything previously unclear, later mentioned, and then ignored?
- If you had to ask the three most important remaining questions, would the answers still change the design decisively?
- If either answer is yes, first list the current full design, point out the likely holes, and ask whether the user wants to continue discussing.

### 7. Request approval

When the discussion is already sufficient and further discussion is unlikely to change the design much, present the explicit design, ask for approval, and ask how the user wants to continue. Do this in one round, not two.

**Continue in the current thread:** enter implementation based on the approved design, or stay in the current thread and delegate work with subagents.

**Continue in a new thread:** persist the plan by writing a Plan file, or provide a clean prompt for the user to use in a new thread.

### 8. Continue the task

After approval and after the user chooses a mode, continue according to that choice:

**Enter implementation:** tell the user that you are now entering implementation, rescan for any skill that should now be loaded, reread the matching skills once, and continue the task.

**Subagent delegation / handoff prompt:**

- The prompt must describe the design, list every step clearly, and include detailed example code where needed.
- Assume the new agent is weak, has no context, and can only complete mechanical tasks; the prompt must let that agent execute accurately.

**Write a Plan file:**

- Read the `memo` skill and maintain the system documents according to its guidance
