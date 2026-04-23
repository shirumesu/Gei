# Review Reference

## Overview

This reference is for review work coordinated by `work`.

One reviewer performs the full audit when a review agent is used. Do not fan out into separate Eng, Design, and DX reviewers unless the main thread explicitly asks for that cost.

Switch roles internally and move through the passes in order.

The main thread owns Memo coordination. Review consumes the active task context it receives; it does not define `spec/` read order or maintain spec documents.

## Modes

### Audit Mode

Default mode. Stay read-only.

- inspect plan, code, tests, and task fit
- report findings
- assign confidence
- produce a Lake Score

Do not edit business code in this mode.

### Fix Mode

Only enter this mode when the main thread explicitly supplies an approved fix list.

- fix only the approved findings
- keep the fix set small
- rerun affected verification
- return the new evidence and the updated Lake Score

## Required Inputs

Read these before reviewing:

1. the active task context provided by the main thread
2. the changed files
3. the current test output
4. any prior review notes passed by the main thread

If the task has UI, also read the relevant screenshots, mockups, or rendered artifacts.

## Pass Order

Run the passes in this order. Do not skip a pass just because the change looks small.

### Pass 1: CEO Pass

Act like the owner who must live with the blast radius.

Check:

- does this change solve a real task requirement, or add avoidable surface area?
- what breaks in the worst case?
- how many systems, users, or operators does the failure hit?
- is the change reversible?
- is the design boring by default, or did it spend innovation where the task did not need it?
- would an exhausted operator at 3 a.m. understand how to recover?

### Pass 2: Eng Pass

Act like the engineer who must debug the result under pressure.

Check:

- correctness against the active task context
- invariants, edge cases, and rollback path
- state handling, locking, retry, and release behavior where relevant
- test coverage depth and whether the new tests would have failed before the fix
- hidden coupling, dead branches, or accidental complexity

If the logic is non-trivial, produce or request a small ASCII diagram for the flow.

### Pass 3: Design Pass

Run this pass when the task changes UI, CLI UX, workflows, wording, or other user-facing interaction.

Act like the first-person user moving through the experience.

Use:

- **Narration mode:** describe what the user sees first, second, and third
- **Trunk test:** can the user tell what this is, where they are, and what they can do?
- **Storyboard check:** what is the experience in the first 5 seconds, the first 5 minutes, and after repeated use?

Reject flat, generic, obviously machine-made presentation. Call out AI-slop patterns such as decorative purple gradients, template-like three-column icon grids, or weak visual hierarchy.

### Pass 4: DX Pass

Run this pass only when the change creates or modifies something other developers must use directly, such as a public API, CLI, plugin, SDK, template, scaffold, or extension surface.

Check:

- can another developer reach a working first result quickly?
- do errors explain what happened, why it happened, and how to fix it?
- are defaults production-capable rather than toy examples?
- are escape hatches available where opinionated defaults exist?
- is there a clear "magical moment" early in the flow?

## Finding Rules

Every finding must include:

- severity
- why it matters
- evidence
- confidence from 1 to 10

If confidence is below 7, mark the finding as `pending confirmation`.

Focus on general, material issues. Do not fill the report with style-only trivia.

## Lake Score

End every pass set with a Lake Score from 0 to 100.

Use it as a completeness score for the current task state:

- `90-100`: ready to ship after routine confirmation
- `75-89`: solid but still has fix-now issues
- `50-74`: multiple material gaps remain
- `0-49`: not close to merge or ship

When you return in Fix Mode, update the Lake Score after re-verification.

## Return Contract

Use this shape:

```text
Mode:
- Audit | Fix

Findings:
1. [severity] title
   why: ...
   evidence: ...
   confidence: 1-10
   status: confirmed | pending confirmation

Fix-Now Set:
- finding ids or none

Deferable Set:
- finding ids or none

Lake Score:
- NN/100

Re-review Notes:
- what still needs another pass, if anything
```

In Audit Mode, remain read-only. In Fix Mode, do not touch anything outside the approved fix list.
