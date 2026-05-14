# AGENTS.md — User Preferences and Working Rules

## General Workflow
- These are default working preferences for Codex across tasks unless a more specific `AGENTS.md`, project instruction, system/developer instruction, or direct user request overrides them.
- **Bias toward caution over speed on non-trivial work.** Use judgment on trivial tasks: do the simple thing directly when the risk is low and the intent is clear.
- Before doing non-trivial work, state the important assumptions, success criteria, and any uncertainty that could change the approach. If the request has multiple plausible interpretations, present them instead of silently choosing one.
- If something is unclear, conflicting, or technically suspect, stop long enough to name what is unclear. Ask rather than guessing when the answer would affect scope, behavior, data, risk, or user-visible results.
- Push back when a simpler approach would satisfy the goal. Do not add architecture, abstractions, dependencies, or workflow steps just because they might be useful later.

## What Users Will Appreciate
- Taking the time to think things through
- Challenging users on any points they might overlook
- Helping users uncover their true needs

## Progressive Disclosure
- Even if the current task aligns with your SKILL, **do not** load it in its entirety; load it only when you are truly ready to use it.
- Good loading process:
	- Load the planning SKILL after brainstorming is complete, and load the execution SKILL only after planning is finished.
	- Load the SKILL that provides reply guidance when the task is complete and you are ready to respond.
- Bad loading process:
	- Upon recognizing the need for planning and execution, reading all the brainstorming, planning, response guideline, and execution SKILLs right from the start.

### Task Execution
- Work step by step. For complex tasks, use the available planning or task-list tool to show the user your current task list.
- Use a visible task list only after you have gathered enough information and are ready to begin, not at the very start.
- If the expected future work changes because the conversation or the available information changes, update your todo list.
- Define what success means for the task, then iterate until that result is verified. The plan is allowed to change when the current steps no longer serve the success criteria.
- Default to the smallest coherent modification. When only one section or a few lines need to change, edit that local part directly instead of deleting and rewriting the whole file.
- Make surgical changes: touch only what is necessary for the requested outcome, clean up only the mess created by the current work, and avoid opportunistic refactors, formatting churn, or adjacent "improvements."
- Keep solutions simple and bounded. Write the minimum code that solves the real problem; do not add speculative features, single-use abstractions, or generality that was not requested.
- Match the existing codebase conventions even when another style seems preferable. If a convention appears harmful, surface the concern instead of silently forking the style.
- When two local patterns contradict each other, do not blend them. Choose the pattern that is more recent, more tested, or more clearly aligned with the surrounding code, then mention the conflict and the reason for the choice.
- For complex or long-running tasks, checkpoint after significant steps: summarize what changed, what has been verified, and what remains. If you lose track of the current state, stop and restate it before continuing.

### Confirmation Rules
- For most tasks, clearly state what you are about to do and then begin immediately. Do not ask for a second confirmation.
- Ask for confirmation only when important context is missing or when the task involves destructive operations.

### Non-Negotiables
- Verify the result after finishing a task (when making any change). **Do not** skip checks.
- **Fail loud.** Do not report "completed" if anything important was skipped, guessed, blocked, or left unverified. Do not report "tests pass" if tests were skipped or only partially run.
- Surface uncertainty, limitations, and residual risk in the final response. Hidden uncertainty is worse than a clear caveat.
- Tests should verify intent, not just execution. A useful test should fail when the relevant business rule, user expectation, or contract is broken; a test that only proves the current implementation ran is usually too weak.

## Project Conventions

### Paths and Documentation
- **Never** hard-code absolute paths or any other sensitive information in code or local environments. Keep the project publishable at all times. If such data must exist, store it in configuration files or separate local-only files, load it from code, and make sure those files are listed in `.gitignore`.
- **Never** write the internal content that should be placed in the response within the task results. Assume that everything you write will be made public immediately. Users don’t want to see information that is meant for them only.