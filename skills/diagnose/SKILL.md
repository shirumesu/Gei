---
name: diagnose
description: "Find a bug's root cause before fixing it. Use before the first edit whenever the user reports wrong output, an error, a crash, a regression, slowness, or a fix that did not work, even when the fix looks obvious; not for code review or new features."
---

# Diagnose

A fix applied before the cause is known moves the bug instead of removing it. Each step ends in something you can show; do not move on without it.

## 1. A Command That Fails

Before forming a theory, get one command that reproduces the user's exact symptom. Run it and show the invocation and its output, with secrets redacted. Look for, roughly in this order: an existing check that already fails; a CLI call with a fixture input; a request against the running service; a headless-browser script; a throwaway script that calls the failing path directly; a replay of a captured payload; a loop over many inputs; `git bisect run` between a known-good and a bad state.

- It must fail on this bug: the user's symptom, not a nearby failure, and not merely "runs without error".
- Make it fast and repeatable: narrow the scope, pin time and random seeds. For an intermittent bug, raise the failure rate with loops, parallel runs, or stress until runs can be compared.
- Keep it out of the project's test suite: an inline command or a script in a temporary directory. Do not add or rewrite tests unless the user asks; agent-written tests tend to restate the implementation and catch nothing.
- When you cannot build one, stop. Say what you tried and ask for what is missing: access to the environment, a redacted log or capture, or permission for temporary instrumentation. When only the user's machine reproduces it, give them one read-only command that prints the environment and the disputed state, to run and paste back.

Then shrink the reproduction while it still fails, until every remaining input is needed.

## 2. One-Sentence Root Cause

Write down two to four plausible causes, each with the result it predicts ("if X, then changing Y makes the command pass"). Test them one variable at a time, cheapest distinguishing probe first. Each temporary log answers one yes/no question and carries a unique tag such as `[DBG-a4f2]`.

Do not edit product code until you can write:

> Root cause: <file:line, function, or condition> because <evidence from a probe>.

The cause must explain every observed symptom, including ones the reporter calls unrelated. When a probe contradicts a hypothesis, drop it; do not keep it because the code looks suspicious.

- Regression from a known-good version: read `git diff <good>..HEAD` on the suspect paths first, and bisect when that is not enough. Do not stash, reset, or check out over the user's uncommitted work; use a temporary worktree.
- Slowness: measure a baseline before changing anything, and report before and after numbers.
- Toolchain, OS, network, or service symptoms: measure that lower layer directly before blaming the application.

## 3. Fix and Prove

Fix the cause within the scope the user authorized. Run the step 1 command again and show it pass. The proof is the same command failing before and passing after; a check you have only seen pass proves nothing. Watch for a pass that never reached the failing path, and for an assertion that some output is absent when that output was never produced.

## 4. Same Mistake Elsewhere

Name the mistake's signature (the call, pattern, missing guard, or input boundary) and search the repository for it, skipping generated and vendored files. For each match, state: same bug (fix it when within scope, otherwise list it), safe (why), or unsure.

## Stop Rules

- Same symptom after a fix, or the urge to "just try" something: the hypothesis is unfinished. Return to step 2.
- Three hypotheses ruled out: stop. Report the symptom, each hypothesis with how it was ruled out, the evidence collected, and what is still unknown, then ask how to proceed.
- A tool or MCP call fails: find out why before switching to another tool.

## Common Traps

| Situation | Check first |
| --- | --- |
| The code changed but the output did not | Persisted output, caches, or build artifacts written by the old code |
| Fix had no effect | Whether the edited copy is the one that runs (duplicates, installed copies, generated mirrors) |
| Works one way, fails another | The exact entry point the user used: file open, deep link, cold start, CLI versus app |
| Breaks after toggling a mode, fine after restart | The state recompute path of the toggle |
| Passes locally, fails in CI | Runtime versions, environment variables, time zone, before the code |
| The user's observation and the log disagree | Trust the observation; the log is missing the failing path |

## Finish

Investigation requests ("why", "investigate", "看看") end at the root cause with evidence; fix only when asked. Remove tagged logs (search for the tag) and throwaway scripts, then report:

```text
Root cause:  <cause, file:line>
Fix:         <change, file:line>
Proof:       <command>: failed before, passes after
Elsewhere:   <N matches checked: fixed / listed / none>
```
