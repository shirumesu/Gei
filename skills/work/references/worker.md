# Worker Reference

## Overview

This reference is for execution workers dispatched by `work`.

Your job is to finish one assigned phase from the active task context provided by the main thread, prove it with tests, and hand clean evidence back to the main thread.

Do not take over orchestration. Do not drift into unrelated repo archaeology.

The main thread owns Memo coordination. Do not create, repair, or maintain `spec/` documents unless the prompt explicitly assigns a Memo-backed document update.

## Default Read Set

Start with the minimum context:

1. the main thread prompt
2. the active task context provided by the main thread
3. the exact files and tests named in the prompt

The plan usually already narrowed the phase enough. Do not read the whole project just to feel safer.

If the assigned phase truly needs more context:

1. read the smallest additional file set that can answer the question
2. prefer interface files, nearby tests, and direct dependencies
3. if the phase is still blocked, stop and report the missing context to the main thread

## Iron Law

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

If you write code before the test, delete it and restart from RED.

No exceptions:

- do not keep it as reference
- do not adapt it while writing tests
- do not leave placeholder logic behind

## Atomic TDD Loop

Run one small loop at a time.

### RED

Write the failing test first.

- Put the test where the plan says it belongs.
- Name the behavior precisely.
- Prefer real behavior over mocked trivia.

Then run the targeted command and confirm the test fails for the expected reason.

If the test passes immediately, you are not testing the intended change yet.

### GREEN

Write the smallest code change that makes the failing test pass.

- do not add side features
- do not refactor unrelated code
- do not "improve" the design early

Run the targeted test again and confirm it passes.

### REFACTOR

Only after GREEN may you improve structure.

- remove duplication
- improve naming
- extract helpers only when they simplify the current change

Re-run the targeted test and any broader verification required by the plan.

## Debugging Defense

If something fails in a way you did not expect, do not guess.

Use this order:

1. Reproduce the failure.
2. Record the exact error, stack trace, or diff.
3. State one concrete hypothesis.
4. Run the smallest command that can confirm or reject that hypothesis.
5. Apply the fix only after the hypothesis is supported.
6. Re-run targeted verification, then broader verification.

Do not stack speculative fixes.

## Working Boundaries

- Stay inside the assigned phase.
- Do not widen scope without asking.
- Do not add `TODO`, `TBD`, fallback stubs, or dead branches.
- Do not commit unless the main thread explicitly asks.
- Do not rewrite durable docs unless the prompt explicitly assigns them.
- If the plan is stale or impossible, stop and explain exactly why.

## Execution Ledger

Maintain a small step ledger in your own work notes or final handoff.

- Mark a step `In Progress` while working it.
- Mark it `Verified` only after you cite the exact command and the observed output.

The main thread should be able to see how you know the phase is done.

## Return Contract

Return a compact handoff with these fields:

```text
Status:
- done | blocked

Execution Ledger:
- [In Progress/Verified] step
  command: ...
  output: ...

Files Changed:
- path

Tests:
- test added first: yes | no
- targeted command: ...
- broader verification: ...

Spec Drift Or Blockers:
- none | exact issue

Notes For Main Thread:
- anything the next phase must know
```

If `test added first` is `no`, the phase is not complete.
