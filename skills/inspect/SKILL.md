---
name: inspect
description: "Check a change against what the user asked for: missing or wrongly built requirements, unrequested additions, and removable design, reviewed by a fresh subagent. User-invoked; bug finding stays with the host's own review."
disable-model-invocation: true
---

# Inspect

The agent that wrote a change reads it through its own intent. A reviewer that sees only the request and the diff notices what the author cannot: a requirement quietly dropped, an option nobody asked for, a fallback that guards against nothing. Host reviews (`/code-review`, `/review`) look for bugs; Inspect checks fidelity and size.

## Steps

1. **Scope.** Use the ref the user gives (`git diff <ref>...HEAD` plus uncommitted changes). Otherwise review all uncommitted changes, including untracked files, plus local commits not on the upstream. Stop if the diff is empty.
2. **Request.** Quote, verbatim and in order, every user message that defines or changes the task, plus linked issues or specs and decisions the user accepted. Do not summarize into your own design: a reviewer given your reading inherits it.
3. **Standards.** List paths only: the user-level instruction files that exist (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`) and the repository's AGENTS.md, CLAUDE.md, CONTRIBUTING.md, or style guides.
4. **Review.** Spawn one fresh subagent with the [brief](references/brief.md), using the host's subagent tool and default model. Do not pass the conversation. Without a subagent tool, work the brief yourself and say the review was not independent.
5. **Verify.** Open each cited file:line. Drop findings that the code or the request contradicts, and say how many you dropped.

Inspect is report-only. Edit nothing unless the user then asks for fixes.

## Report

Three sections, each possibly "none": **Missing or wrong**, **Not asked for**, **Removable**, then standards breaches if any. Each finding gives file:line, the quoted request line or rule it concerns, and the concrete effect. End with one line naming the worst finding, or "matches the request". A clean result is a valid result.
