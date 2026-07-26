---
name: code-review
description: Use when the final deliverable is a read-only review of code, a pull request, diff, commit, branch, working tree, tests, or an implementation. Focuses on evidence-backed bugs, regressions, risks, and missing verification. Use Work when the requested outcome includes implementing fixes.
---

# Code Review

Audit a change without editing it. Lead with material findings; summary and praise are secondary.

## Contract

- Review the actual code and behavior against the user's intent. PR titles, commit messages, and author summaries are context, not proof.
- Focus on issues that affect correctness, security, maintainability, UX, DX, release confidence, or recovery.
- Ignore style preferences unless they violate an established convention or create concrete risk.
- State the reviewed scope and any material surface you could not inspect.
- Do not invent findings to make the review look useful.

## Workflow

1. **Resolve the target and intent.** Infer ordinary Git scopes such as the current diff when safe; ask only if the target is genuinely ambiguous.
2. **Map the changed behavior.** Inspect changed files and the smallest supporting code needed to trace real inputs, state, outputs, and failure paths.
3. **Choose relevant risk lenses.** Consider task fit, correctness, state and recovery, tests, security, user experience, developer integration, and operations only where the changed surface warrants them.
4. **Check verification.** Review tests, commands, screenshots, logs, or artifacts for whether they could actually expose the regression at issue. Run read-only checks when useful and authorized by the review request.
5. **Report evidence-backed findings.** Sort by realistic impact and make the corrective direction clear without implementing it.

For authentication, authorization, secrets, PII, parsing, file paths, uploads, command execution, outbound requests, dependencies, cryptography, sandboxing, tenancy, payments, or other trust boundaries, read `references/security.md`.

## Finding Standard

Each finding should state:

- a concise severity and title
- the concrete behavior or risk
- evidence at the narrowest useful file/line, command, screenshot, or observed path
- why it matters and, when not obvious, the condition needed to reproduce it

Use qualitative severity based on reachability, blast radius, reversibility, and user impact. Mark uncertainty directly when a missing runtime fact could change the finding; do not manufacture numeric precision.

Do not report a hypothetical family of problems without tracing the relevant path. Missing tests are findings only when they leave material behavior unprotected or the claimed verification unsupported.

## Output

Lead with findings in severity order. Then give compact coverage:

- reviewed target and supporting surface
- verification seen or run
- unreviewed areas and residual risk

If there are no material findings, say so plainly, then report coverage and residual risk. Do not imply fixes were made or checks passed without evidence.
