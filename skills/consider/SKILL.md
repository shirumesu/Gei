---
name: consider
description: Use before any creative work begins, when a user has an idea, wants help brainstorming, needs to clarify scope or feasibility, or needs an approved design before implementation. Use when Codex should recover project context, challenge ambiguity, research comparable solutions, define the full technical path and boundaries, and stop until the user explicitly approves the design.
---

# Consider

Turn an unclear idea into an explicit, approved design before implementation begins.

This skill exists to slow the work down at the beginning, recover the real project context, challenge weak assumptions, and produce a design that can be defended without guesswork.

## Core Principles

### User First

- If the user's request conflicts with any part of this skill, say which part you are ignoring and why, then continue with the user's request for every non-conflicting part.
- The user keeps full control. Your goal is to provide options, boundaries, and recommendations, not to silently design on the user's behalf.

### Design First

- Spend roughly 80% of the effort on design. The simpler the project looks, the more likely hidden assumptions can waste the work.
- Every project must go through design first. Even a simple project should still go through enough design discussion to make the key decisions explicit.

### No Implementation Before Approval

- Do not take any implementation action until the user explicitly approves the design.
- Do not leak into execution, scaffolding, or full implementation while still inside Consider.

### Match The Scale

- Keep simple parts short.
- Use roughly 200-300 words for sections that are complex enough to need real explanation.

### Ask One Question At A Time

- Ask only one multiple-choice question at a time.
- Explain the recommended option and why it is recommended.
- State the likely downside or risk.
- Prefer a dedicated question tool when one is available instead of simulating the format in plain text.

### Exit Rule

- The only valid end condition is explicit user approval of the design. There are no exceptions.

## Boundary

- Consider is for design, not implementation.
- Work on one bounded problem at a time. If the request actually combines multiple independent systems, decompose it first.
- You may use examples, partial core code, local code fragments, implementation notes, or pseudocode to make the design concrete.
- Do not write the full implementation here.
- After approval, continue only through the user-selected mode: implementation in the current thread, delegated execution, plan persistence, or a handoff prompt for a new thread.

## Process

### 0. Precondition

- Check whether the `memo` skill exists in the environment. Do not tell the user about this check. If it exists, continue.
### 1. Explore context

- Check whether the project already has clear Spec documents.
  - Yes: follow `consider/references/read-spec.md` to recover context
  - No: if the project is not empty, inspect the files, documents, and recent commits
### 2. Explore boundaries

Think and ask questions so the user is forced to clarify any risk, ambiguity, or hidden requirement in the request.

**Passing standard:**

The user's request must be expanded until it is clear and detailed enough to include at least:

- **What:** a clear, explicit, and complete idea of what should be built
- **Why:** who the user is, why they need it, whether the current workflow already has pain points, what is still unresolved for them, and whether the feature is important
- **How:** examples for how it should work, using code fragments, local core logic, direct explanation, or pseudocode instead of full code

If the user is not yet clear about the exact implementation shape, do not block here. Carry the uncertainty into step 4 and refine it there.

- **Good example:** The user often uses several similar applications whose configuration items are already known to be compatible. They want a feature that can sync configuration across those applications, and the accepted values, key names, and operating behavior of each target application are already confirmed to match, so no special compatibility layer is needed.
- **Bad example:** "I want a configuration sync feature."

**Common patterns:**

- The user ran into a problem and wants the most direct possible fix
  - Apply YAGNI: implement only when the requirement is clear and important enough now. Do not build early for future possibilities.
  - Assume you only have three chances to change the system. If the feature cannot fit within those three chances, explain the impact and offer a reduced core unit for the user to choose.
  - You may tell the user that you believe the feature is unnecessary. If the design still seems necessary, look for a more elegant solution.
- The user has a good idea, but it is still unvalidated
  - Check whether implementation will be hard. Reading the target environment counts as part of context exploration.
- The user wants a feature but does not know how it should be built, so they unconsciously skipped design
  - Provide the design and get approval.
### 3. Explore feasibility

Observe comparable products. Search the web for similar implementations, including mature commercial products and open-source projects.

- Study their visual presentation, usage pattern, chosen technical stack, and concrete implementation shape.
- Stop only when your information, not your memory, is enough to prove that you understand the mainstream architecture and implementation pattern for this problem.
- Minimum principle: if the request is only a simple feature, do not research full-system architecture.

  - **Good example:** Building a login page -> study how comparable products present the page visually, what buttons they include, how they communicate with the backend, and how they protect passwords.
  - **Bad example:** Building a login page -> study the entire site architecture, explore every other page, investigate all user permissions, and read the full user rules. Even if the project truly lacks those parts, do not expand into them unless the user explicitly asked. Treat them as future TODOs instead.

**Compare against the request:**

- If the user's request already has visible replacement products, show them to the user with links so they can judge whether those products already cover the real need.
### 4. Detailed design rules

Clarify the full design in more detail:

- Define the complete technical path
- Define the explicit boundaries
- Define possible risks and failures

- **Good design:** Configuration sync feature -> use symbolic links so different applications share one configuration source. Store the source configuration in this project. When the user switches configuration, update the target application's config file through the symbolic link automatically. Present the switching control as a Segmented Control UI. Use shadcn/ui for the interface style. Support only manual switching. Support only one-way sync from this project's source configuration into the target applications. If a switch fails, show failure toast at the bottom-right of the interface. In the current version, only maintain this project's source configurations and switch symbolic links between them. Do not support reading configuration values back from the target applications.

- **Bad design:**
  - It does not define which applications need to be synced
  - It does not define the implementation technology
  - It does not define the UI
  - It does not define the boundaries
  - It does not define system-scale impact, rollback cost, or failure and attack angles such as prerequisite collapse
  - It does not define possible failure cases

**Consider long-term usefulness:**

- Is this demand temporary or durable?
- Assume the system keeps running for 6-12 months. Will this become a temporary workaround that gets discarded, or is it something the project should keep?

**Validate architectural consistency:**

- Check that the design still fits the project's existing architecture and conventions.
- Do not let the discussion drift into a design that cannot be integrated, such as switching from SQL to file storage when the system is already built around SQL, unless the user explicitly wants that architectural change.
### 5. Self-review

Review the information and check this list:

- Is the design now explicit enough that even someone with no context, no domain knowledge, and no technical background could still explain each specific part without drifting?
- Is the test and verification method explicit, including at least some known edge cases?
- Are there still placeholders, ambiguity, or contradictions introduced by later discussion?
- Can the result be verified in a concrete and measurable way, such as with test files or other quantifiable checks?

**Expand the discussion when needed:**

- Was anything previously unclear, later mentioned, and then ignored?
- If you had to ask the three most important remaining questions, would the answers still change the design decisively?

If either answer is yes, first list the current full design, point out the likely holes, and ask whether the user wants to continue discussing.
### 6. Request approval

When the discussion is already sufficient and further discussion is unlikely to change the design much, present the explicit design, ask for approval, and ask how the user wants to continue. Do this in one round, not two.

**Continue in the current thread:**

- Keep going in the current thread based on the approved design and enter implementation
- Stay in the current thread and delegate work with subagents

**Continue in a new thread:**

- Persist the plan by writing a Plan file
- Provide a clean prompt for the user to use in a new thread
### 7. Continue the task

After approval and after the user chooses a mode, continue according to that choice:

**Enter implementation:**

- Tell the user that you are now entering implementation
- Rescan the environment for any skill that should now be loaded
- Reread the matching skills once
- Continue the task

**Subagent delegation / handoff prompt:**

- The prompt must describe the design in detail and list every step clearly, with detailed example code where needed.
- Assume the new agent is weak, has no context, and can only complete mechanical tasks.
- The prompt must let that agent execute accurately.

**Write a Plan file:**

- Read the `memo` skill and maintain the system documents according to its guidance