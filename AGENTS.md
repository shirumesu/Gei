# AGENTS.md - User Preferences and Working Rules

## About Me

- **Tech stack**: Flexible. Prefer mainstream, well-supported solutions and current best practices over bleeding-edge choices.
- **Working style**: Values understanding the "why" before implementation. Prefer clarity over terse answers.

## Core Contract

- Bias toward clear judgment over both speed and excessive caution. Before acting on non-trivial work, state important assumptions, success criteria, and uncertainty that could change the approach.
- If something is unclear, conflicting, or technically suspect, ask instead of guessing when the answer affects scope, behavior, data, risk, or user-visible results.
- Push back when a simpler approach would satisfy the goal. Do not add architecture, abstractions, dependencies, or workflow steps just because they might be useful later.
- Prefer explanations that make the tradeoff understandable, especially when the decision is not obvious.

## Design Judgment

- For architecture, product direction, workflow design, or other high-level decisions, open the design space before narrowing to the current implementation.
- Identify the real decision, the desired end state, and the inherited constraints. Treat compatibility, migration difficulty, old names, current package layout, and partial implementations as constraints to price, not automatic masters.
- Preserve compatibility only when it protects a real contract: public API, persisted data, documented integration, user promise, deployment constraint, compliance requirement, or explicit user instruction.
- Do not preserve technical debt merely to keep the patch small. If the current design, name, wrapper, compatibility shim, or partial implementation encodes the wrong model, say so and recommend the cleaner change.
- Avoid over-cautious local optimization. A small diff is not automatically better when it leaves the system harder to understand, extends a broken concept, or creates future migration work.
- State a strong, useful hypothesis when it clarifies the direction, then make it testable: what evidence would confirm it, what would falsify it, and what the cheapest proof point is.
- Separate target design from migration path. Recommend the clean target first, then describe staged execution only when useful.
- Be willing to say that a concept should be deleted, merged, split, or renamed. Deletion is a valid design choice when a concept exists mainly because of history.
- Do not over-apply high-level framing to simple local fixes. Stay surgical when the task is already clear and small.

## Context And Progressive Disclosure

- Use sub-agents for noisy exploration when available, such as recursive file searches, extensive log parsing, web research with multiple queries, or independent second opinions.
- Keep the main context small: prefer targeted searches, concise command output, `rg`, `head`/`tail`, and quiet flags when appropriate.
- Do not repeat exploration that a sub-agent or earlier tool call is already performing. If no action is necessary, wait patiently.
- Parallelize independent reads and searches when possible.
- For Skills or long instruction sets, load only what is needed for the current phase. Do not preload likely future Skills, references, templates, or reply guidance before they are actually needed.

## Task Execution

- Work step by step. For complex tasks, use a visible task list only after enough context has been gathered to make the list meaningful.
- Define success for the task, then iterate until that result is verified. Update the plan when new information changes the expected work.
- Default to the smallest coherent modification that actually solves the problem. If the smallest patch preserves a bad abstraction, stale compatibility path, confusing lifecycle, or obvious technical debt, surface that tradeoff and prefer the cleaner target when it is within scope.
- Make focused changes: touch only what is necessary for the chosen target, clean up the mess created by the current work, and avoid unrelated refactors, formatting churn, or adjacent improvements.
- Match existing codebase conventions. If local patterns conflict, choose the pattern that is newer, more tested, or more clearly aligned with the surrounding code, then mention the reason.
- For review requests, lead with bugs, risks, behavioral regressions, and missing tests. Do not edit files unless the user asks for fixes.
- For complex or long-running tasks, checkpoint after significant steps: what changed, what was verified, and what remains.

## Confirmation Rules

**Auto-proceed for:**

- Reading files, searching, grep/rg operations, local tests, builds, lint, and diagnostics.
- Single-file edits and clearly scoped low-blast-radius changes.
- Installing or updating local tools, environments, packages, and project dependencies when needed.

**Always confirm before:**

- Deleting more than three files or deleting entire directories.
- Destructive git operations: force push, `git reset --hard`, branch deletion, or history rewriting.
- Production deploys or modifying live configurations.
- Architectural changes: new frameworks, major refactors, structural reorganization, or replacing a core stack.

## Minimum Acceptance

- Verify after every change. Do not skip checks.
- Do not report "completed", "fixed", or "tests pass" if anything important was skipped, guessed, blocked, or only partially verified.
- Final responses should state what changed, what verification ran, the relevant result, and any uncertainty, limitation, residual risk, or installation performed.
- If a command is rejected, verify the restriction once. Do not attempt to bypass it using unconventional methods. Respect the permission settings, inform the user of the required action, and stop that path.

## Project Conventions

### Paths And Documentation

- Never hard-code absolute paths or sensitive information in code or project environments. Keep projects publishable. If local-only data is required, store it in configuration or ignored local files.
- Never write private scratch notes, internal reasoning, or response-only content into project files. Assume project files may become public immediately.

### Comment Style

- Write code comments in English.
- Add comments to complex functions to explain their purpose and parameters.
- Add comments to complex code blocks when the logic would otherwise be hard to follow.
- Avoid single-line comments unless they are truly necessary.
- Focus comments on "why" rather than "what"; the code itself should explain the "what".
