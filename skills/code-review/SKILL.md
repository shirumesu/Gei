---
name: code-review
description: "Read-only review of implementation quality: functionality, interaction, presentation, performance, and consistency with the product and codebase. Use for code, diffs, PRs, or implementation audits; use Work when fixes are requested."
---

# Code Review

Judge whether the implementation delivers a coherent product experience. Review without changing the target; prioritize the user's stated quality concerns.

## Establish The Comparison

Resolve the review scope and intended behavior from the request, requirements, and affected callers. For a diff, separate introduced issues from pre-existing ones; for a broad audit, inspect the requested existing surface too. Author summaries describe intent, not proof.

Find a representative neighboring flow, component, output, or convention. Use it to judge terminology, visual hierarchy, interaction patterns, API shape, and code organization. Existing inconsistency is evidence to assess, not a reason to copy a broken pattern.

## Follow The Experience

Trace a representative user action from entry through state changes to visible result. Inspect the states that matter to this flow, such as first use, empty data, loading, failure, repeat actions, or return navigation. Do not turn these into an exhaustive checklist for every task.

Spend review attention on the changed experience:

| Concern | Evidence to seek |
| --- | --- |
| Functionality | Requirement-to-result mismatch, omitted paths, wrong state or persistence |
| Interaction and presentation | Confusing controls or feedback, broken layout, unreadable content, keyboard barriers, inconsistent wording or hierarchy |
| Performance | Work repeated on a reachable hot path, blocking interaction, excess requests, or measured slowdown; distinguish suspicion from measurement |
| Coherence | A concrete mismatch with neighboring flows, design tokens, public interfaces, or ownership that makes use or change harder |

For visual changes, inspect the running view or rendered artifact at relevant sizes/states when available. Source inspection can establish a wrong token or missing state, but cannot prove rendered appearance. For CLI/API work, inspect actual output or consumer behavior. Run proportionate non-mutating checks; do not equate compilation or helper tests with a working experience.

Security is a conditional lens. Read [security](references/security.md) for an explicit security audit or a concrete path involving exposed credentials, untrusted input crossing a boundary, or changed access controls. A file path, dependency, parser, or network call alone does not trigger a security checklist. Report obvious serious vulnerabilities when found; do not pad a product review with speculative hardening.

## Report What Should Change

Separate demonstrated defects from worthwhile design/style improvements. Both can matter: inconsistency need not cause a crash to deserve attention. Ground an improvement in a named comparison or a concrete usability/maintenance consequence; label unestablished taste as a proposal, never a proven bug. Avoid generic clean-code wishes.

Each item needs a concise title, narrow file/line or observed-state evidence, the effect under realistic conditions, and a corrective direction. Rank by actual user impact; a broken core flow can outrank theoretical security exposure. Mark uncertainty where it changes the conclusion. Missing tests matter only when a specific material behavior is unprotected or claimed verification is unsupported.

Lead with actionable findings, then a short coverage statement: target, comparisons/checks used, and material unverified surfaces. Include improvements separately only when useful; no finding quota or mandatory security section. If nothing material is found, say so without implying unobserved behavior was verified.
