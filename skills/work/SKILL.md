---
name: work
description: "Use for coding execution: implementation, bug fixing, tests, builds, refactors, Git diagnosis, releases, and other code-changing work. Guides an evidence-driven implementation loop without requiring TDD, persistent plans, or release ceremony by default."
---

# Work

Implement the requested outcome and gather evidence that it works.

## Working Model

- Recover only the context that could change the implementation. Treat code, configuration, tests, and observed behavior as higher-fidelity references than summaries.
- Let the task's risk and uncertainty determine planning, checkpoints, tests, and review depth.
- Preserve user-owned changes and keep the modification coherent. Do not let a small diff preserve the wrong abstraction when a cleaner in-scope change is justified.
- Use project-native commands, conventions, and release policy before generic guidance.
- A plan, persistent spec, subagent, commit, or test-first loop is useful only when it improves coordination, recovery, or evidence.

## Execution Loop

1. **Define success.** Resolve the target, user-visible result, material constraints, and the evidence that could prove or disprove completion.
2. **Inspect the path.** Read the smallest relevant code and supporting context. For a bug, reproduce or trace to the first broken contract before editing when practical.
3. **Choose the next coherent change.** If a consequential design choice remains unresolved, use `consider` or ask the user; otherwise decide reversible implementation details from project context.
4. **Implement.** Make the change, including cleanup made necessary by the chosen design, without widening into unrelated work.
5. **Verify.** Run the cheapest high-signal check first, then broader affected checks when coupling or release risk justifies them.
6. **Review the result.** Inspect the diff and behavior for scope drift, incomplete paths, accidental user-change overlap, and unsupported claims.
7. **Report.** State what changed, the verification and result, and any limitation or residual risk.

Repeat the loop when evidence exposes another in-scope issue. Stop and surface the blocker when progress requires missing authority, unavailable external state, or a user-owned decision that would materially change the result.

## Verification

Choose evidence that distinguishes correct from incorrect behavior. Prefer observable contracts over implementation shape.

Read `references/testcraft.md` when test design is consequential or unclear. A regression test is especially useful when it is stable, maintainable, and protects behavior that could fail silently. Test-first is optional: prefer it when the failing case is cheap and reliable to reproduce; otherwise use the strongest practical check at the earliest useful point.

Do not add a weak test merely to demonstrate that work occurred. Builds, type checks, linters, direct runtime probes, screenshots, or focused inspection may be stronger evidence for some changes.

If the relevant baseline was already failing, distinguish pre-existing failures from regressions introduced by the work.

## Plans, Specs, And Git

Use an in-conversation plan for coordination when helpful. Create or update a durable task reference only when the user asks, the work must survive handoff or session loss, or the repository already requires one.

Treat existing specs, tests, code, mockups, schemas, and artifacts as references; do not restate them into a new Markdown plan by default.

`memo` owns the Gei spec contracts and non-trivial spec maintenance. After completing and verifying changelog-worthy work, Work appends one concise typed entry under `spec/CHANGELOG.md` `## Unreleased`; this narrow close action does not require invoking Memo. If the task changes durable architecture, routing, module boundaries, or cold-start project context, hand the corresponding `ARCHITECTURE.md` or `OVERVIEW.md` update to Memo in the same task. Memory and durable task-reference updates remain conditional.

Create commits or other checkpoints when requested or when they provide real recovery value and are authorized. Never include unrelated user changes.

## Release Work

For versioning, packaging, deployment, publication, or other release actions, read `references/ship.md`. Release is an execution goal, not a second lifecycle: follow repository policy, confirm only missing authority or ambiguous high-impact targets, and verify the actual artifact or remote state after acting.
