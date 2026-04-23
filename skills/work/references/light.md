# Work Light

## Overview

Work Light owns the everyday production loop for coding tasks that do not require the spec-aware heavy flow.

Its job is to inspect the task for feasibility, recover only the context needed to act, implement in the main thread, verify the result, review the change, and run release checks when the task actually needs shipping.

This reference is for the main thread. Stay in one thread by default. Do not require `spec/`, `#NNN-work.md`, durable planning docs, or delegated worker/review flows in this mode. A task may remain light even when the project has `spec/`.

## Entry Gate

Before execution, confirm all of the following:

1. The user goal is specific enough to execute, or can be made specific from the repo and the current conversation.
2. The likely files, modules, commands, or surfaces affected by the task are identified.
3. You know how the result will be verified before you start coding.
4. If the task touches release, versioning, or deployment operations, note that extra release confirmation will be required.

If a blocking requirement is still unclear after a small context read, stop and ask one precise question. Do not force the task into a heavier planning flow by default.

## Iron Laws

- **Prefer a failing test first.** If the repo already has a usable test harness and the behavior can be tested cleanly, write the failing test before code. If the task is docs, config, release work, or the repo has no practical test path for this change, define the smallest concrete verification first and state why.
- Do not leave `TODO`, `TBD`, placeholder branches, or half-implemented logic in production code.
- Do not guess through unclear instructions, missing interfaces, or missing dependencies. Stop and surface the blocker.
- Do not claim "done", "fixed", or "verified" without command evidence in the current conversation.

## Spec Boundary

Light does not create, initialize, read-order, or maintain `spec/` by default.

If the work reveals information that may belong in durable project memory, such as a routing change, required command, TODO movement, architecture change, shipped outcome, or repeatable pitfall, tell the user exactly what you noticed and ask whether they want it recorded through `memo`.

If the user says yes, invoke `memo` and follow Memo's event rules. If the user says no or does not answer before the current task can finish safely, complete the light task without spec changes and mention the unrecorded durable note in the handoff.

## Default Loop

Follow this loop unless the task itself clearly requires a different order.

0. **Recover context**
   Read the user request, the current project state, and only the smallest local file set needed to act. Prefer nearby code, related tests, and current task files over broad repo archaeology.
1. **Check feasibility and blast radius**
   Confirm what the task is changing, what it might break, and what a successful result looks like. If the task is underspecified, repair that gap with a short local execution plan before coding.
2. **Define verification first**
   Decide the exact proof path before implementation. Use a failing automated test first when practical. Otherwise use the smallest concrete check that can prove the task, such as a reproduction command, targeted script, build step, snapshot, or manual path with observable output.
3. **Implement in the main thread**
   Make the smallest coherent change set that satisfies the task. Do not split the task unless the user explicitly wants that extra coordination cost. Do not widen scope just because adjacent cleanup looks tempting.
4. **Run targeted verification**
   Run the proof path from step 2 and confirm the result matches the intended change. If the failure is unexpected, debug from one concrete hypothesis at a time instead of stacking speculative fixes.
5. **Run affected verification**
   Expand verification only as far as the change requires. Run affected tests, lint, build, typecheck, or reproduction steps based on the real blast radius instead of habit.
6. **Review in the main thread**
   Review the result before closing:
   - task-fit review: did the change solve the requested problem without drift?
   - code-quality review: is the implementation minimal, coherent, and free of obvious waste?
   - UX or DX review: if the task changes user-facing or developer-facing behavior, is the flow understandable and practical?
7. **Fix review findings**
   Fix the issues that must land now, then re-run the affected verification. If something is worth noting but not worth fixing in this task, state it clearly instead of silently carrying it.
8. **Enter the release step when needed**
   If the task includes versioning, packaging, deployment, publication, or explicit release handoff, use `skills/work/references/ship.md` and move into the final release gate.

## Stop Conditions

Stop execution immediately when any of these is true:

- the goal is still unclear after minimal context recovery
- the next change cannot be executed with the current interfaces, dependencies, or permissions
- verification keeps failing and the root cause is still unknown
- the task expands beyond the original blast radius and needs re-scoping

Do not improvise around these conditions.

## Completion Gate

Do not treat the task as complete until all of the following are true:

1. Every planned item is `Done` or `Changed` with a reason.
2. The targeted verification passed.
3. The broader affected verification passed when the blast radius required it.
4. The main thread completed its own task-fit and code-quality review.
5. Release checks ran and passed if the task was a release task.
6. The next decision is handed back to the user with clear evidence.
