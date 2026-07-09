---
name: code-review
description: Use when the user asks to review code, a pull request, diff, commit, branch, working tree, changed files, tests, or an implementation for correctness, maintainability, security, UX, DX, or release risk. Default to a read-only audit with findings first. Do not use for implementing fixes, building new features, broad project planning, external research as the final deliverable, or creating/reviewing Skills.
---

# Code Review

Code Review is a standalone read-only audit workflow. It is for judging a change, not for fixing it. Keep the review focused on material issues that could affect correctness, safety, maintainability, user experience, developer experience, or release confidence.

## Core Contract

- Default to Audit Mode: inspect, reason, and report. Do not edit files, stage changes, commit, or update project state.
- Lead with findings. Summaries and praise are secondary to bugs, risks, regressions, and missing verification.
- Review against the user's intended task and the repository's actual behavior. Do not trust the PR title, commit message, or author summary when the code says otherwise.
- Focus human attention where automation is weakest: design fit, behavioral correctness, edge cases, tests that prove intent, security boundaries, rollback, and operational impact.
- Do not block on style-only preferences unless they violate an established project rule or create a real maintenance or behavior risk.
- If the review target is missing and cannot be inferred from local Git state or the user's message, ask one precise question before reviewing.
- If the user asks to fix findings, stop after producing or confirming the approved fix list. A fix is implementation work and is out of scope for this Skill.

## Inputs To Recover

Before judging the change, recover the smallest context that makes the review defensible:

1. Review target: PR, branch diff, commit, working-tree diff, staged diff, file list, or explicit code excerpt.
2. User intent: issue, spec, task prompt, design note, acceptance criteria, or expected behavior.
3. Changed surface: changed files plus directly supporting files needed to understand behavior.
4. Verification: tests, lint, build, screenshots, demos, logs, or explicit statement that none were run.
5. Prior review notes when supplied.

For UI changes, inspect screenshots, rendered pages, or artifacts when available. For API, CLI, SDK, plugin, template, or public integration changes, include a DX pass. For release, migration, persistence, auth, data-boundary, parser, dependency, or network changes, include a deeper risk pass.

## Workflow

### 1. Resolve Scope

- Identify exactly what you reviewed and what you did not review.
- Use local Git commands when the target is "this change", "current diff", "working tree", or similar.
- For a diff review, inspect changed lines and enough surrounding code to understand the behavior. Add supporting files only when they are needed to understand the changed path.
- If the diff is too large for a credible pass, say which slices were reviewed and which need follow-up rather than implying full coverage.

### 2. Build The Risk Map

Classify the change before deep reading:

- task fit and design shape
- correctness and edge cases
- state, concurrency, retry, rollback, or migration behavior
- tests and verification quality
- security, privacy, secrets, trust boundaries, or dependencies
- UI/UX or CLI behavior
- API, SDK, template, plugin, or developer workflow
- operations, release, observability, and failure recovery

Use the map to decide which review passes matter. Do not run UI, DX, or deep security review by habit when the change has no relevant surface.

### 3. Review In Passes

Run the relevant passes in this order.

**Task Fit And Design**

- Does the change solve the stated requirement without adding avoidable surface area?
- Does it belong in this module, abstraction, API, or lifecycle?
- Is the approach compatible with existing contracts, data shape, deployment constraints, and rollback needs?
- Did the change preserve useful simplicity, or did it introduce speculative generality?

**Correctness**

- Trace the real behavior through changed code and directly supporting code.
- Check edge cases: empty, null, missing, duplicate, maximum, minimum, malformed, concurrent, retry, timeout, cancellation, and partial failure states.
- Look for broken invariants, stale state, hidden coupling, dead branches, order dependence, and incorrect error handling.
- For user-facing paths, think like the user and follow the first-run and repeated-use flow.

**Tests And Verification**

- Check whether verification matches the risk of the change.
- Prefer tests or commands that would fail if the intended behavior regressed.
- Flag tests that only prove implementation shape, imports, mocks, existence, or "does not throw" behavior.
- If no new test is warranted, confirm that the command-line evidence or existing tests actually cover the changed behavior.
- Treat tests as maintainable code: simple assertions, clear setup, deterministic behavior, and meaningful failure mode.

**Security And Privacy**

Read [security.md](references/security.md) when the user asks for security review, the change touches a trust boundary, or the risk map includes authentication, authorization, secrets, PII, parser/deserializer behavior, file paths, uploads, templates, command execution, outbound requests, dependency changes, cryptography, sandboxing, tenancy, payment, admin, or security-sensitive configuration.

For ordinary low-risk changes, still notice obvious security regressions, but do not turn every review into a broad vulnerability scan.

When the user asks for a hard challenge pass, or the change is high-stakes and the first review finds no material issues, run one adversarial pass before finalizing. Use distinct lenses such as careless new maintainer, abuse/security reviewer, and rollback/operator. Promote only issues that remain evidence-backed; do not invent findings to satisfy the pass.

**UX And Product Behavior**

Run this pass when the change affects UI, CLI, flows, wording, errors, accessibility, onboarding, or repeated use.

- Can the user tell what happened, what to do next, and how to recover from failure?
- Are empty, loading, error, success, disabled, and long-content states coherent?
- Does the interaction fit the product domain instead of looking generic or decorative?
- Are labels, commands, and errors precise enough to act on?

**DX And Integration**

Run this pass when the change affects developers, operators, extension authors, plugin users, API consumers, template users, or future maintainers.

- Can a developer reach a working first result quickly?
- Are defaults production-capable, not toy-only?
- Are errors actionable: what happened, why, and what to do?
- Are escape hatches present where the API is opinionated?
- Are docs, examples, migrations, and compatibility notes updated when the contract changed?

**Operations, Release, And Recovery**

Run this pass when the risk map includes deployment, release process, observability, data migration, rollback, job scheduling, background work, incident recovery, or operational ownership.

- Can the change be released, rolled back, or disabled without leaving partial state behind?
- Are migration, retry, timeout, idempotency, and cleanup behavior clear where they matter?
- Would operators know that the change failed, degraded, or needs intervention?
- Are release notes, feature flags, metrics, logs, alerts, and runbooks updated when the operational contract changed?

## Finding Rules

Report only actionable issues grounded in evidence.

Each finding must include:

- severity
- why it matters
- evidence with file, line, command output, screenshot, or concrete behavior
- confidence from 1 to 10
- status: `confirmed` or `pending confirmation`

Use `pending confirmation` when confidence is below 7 or when a missing runtime fact could materially change the conclusion.

Severity guidance:

- `critical`: likely data loss, security compromise, severe outage, irreversible migration failure, or broad user harm.
- `high`: likely functional regression, security flaw, broken contract, release blocker, or serious missing verification.
- `medium`: material edge case, maintainability risk, incomplete behavior, weak test, or failure mode that should be fixed soon.
- `low`: local issue that is worth fixing but should not block by itself.
- `nit`: style or polish only. Use sparingly and never mix many nits into the main findings.
- `informational`: useful note, not a defect.

Do not inflate severity because an issue sounds important in the abstract. Calibrate by realistic reachability, affected users, blast radius, reversibility, and evidence.

## Output Contract

Use this shape unless the user requested a stricter format. Keep it compact; add Fix-Now/Deferable grouping only when there are multiple findings and the grouping helps the user decide next action.

```text
Findings:
1. [severity] title
   why it matters: ...
   evidence: ...
   confidence: 1-10
   status: confirmed | pending confirmation

Coverage:
- reviewed: ...
- not reviewed: ...
- verification seen: ...

Residual Risk:
- what still needs another pass, if anything
```

If the user asks for a readiness judgment, provide a short qualitative status such as "ready to merge", "fix before merge", or "needs another pass" instead of a numeric score.

If there are no material issues, say that clearly:

```text
Findings:
- No material issues found.
```

Then still report coverage, verification seen, and residual risk.

## Minimum Acceptance

A review is complete only when:

1. The reviewed target and unreviewed areas are explicit.
2. Findings lead the response and are sorted by severity.
3. Every finding has evidence, why it matters, confidence, and status.
4. Security-sensitive changes received the security reference workflow.
5. Missing tests or skipped verification are reported as risk, not hidden in the summary.
6. The final answer does not imply fixes were made or tests passed unless that evidence exists.
