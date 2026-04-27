# Ship Reference

## Overview

Ship is the final release gate after implementation is complete.

It is not a design phase. It is not a brainstorming phase. It validates the current task, then handles release actions such as merge, tag, push, pull request, or release handoff when the user's release request calls for them.

Use it from the main thread, or from one ship agent when the user explicitly approved delegation for the release.

## Boundaries

- Do not create a new branch just because the task is being released.
- Merge, tag, push, and pull request actions belong to Ship, not Light or Work. Perform them only when the user asked for that release action or explicitly confirms the target during the ship gate.
- Do not skip verification because the change looks small.
- Ask the user before continuing when the release target is ambiguous, a destructive action is next, a force push is next, a major version bump is next, or a serious unresolved coverage gap remains.
- If the environment is missing declared tooling, bootstrap it automatically from the repo's documented setup path, then continue.

## Gate Order

Run the gate in this order.

### 1. Check branch and repo state

Confirm:

- current branch
- local branch count
- upstream or remote target when one exists
- clean or expected worktree status
- no unrelated changes that would pollute release evidence

If the state is unexpectedly dirty, stop and report it.

If there is only one local branch, treat the current branch as the release branch and continue from that branch. Do not create another branch.

If there are multiple branches, identify the likely release target from the user's request, branch naming, upstream tracking, or repo docs. If the target is still ambiguous, ask before merge, tag, or push.

### 2. Run the full verification set

Run the full unit test suite and any other required quality commands from the active spec-backed task, repo docs, package scripts, or established project commands.

If the environment is missing tooling:

1. find the documented bootstrap or install command in the active spec context when present, or in `README.md` and repo-native docs otherwise
2. run it automatically
3. rerun verification

Record the exact commands and observed outputs.

### 3. Scan for distribution blockers

Check for anything that would make the shipped result unsafe or non-portable.

At minimum:

- run `python skills/work/scripts/ship_scan.py {project_root_path}` to scan absolute paths and any junk files that may not have been excluded by `.gitignore`.
- search for likely secret leaks or unsafe local-only configuration
- check for machine-specific assumptions that other users cannot reproduce

If the repo has known secret files or fixture exceptions, apply the documented exclusions rather than skipping the scan.

### 4. Check spec parity when present

If the task is spec-backed, compare the shipped state against the active spec-task context recovered through Memo.

Make sure:

- completed items are actually complete
- unchecked items are either finished or explicitly changed/deferred with a reason
- deferred work is reflected through Memo when the user approved or the spec-backed task requires that update

Do not ship with silent drift between code and spec.

If there is no active spec-backed task, mark spec parity as `not applicable` and continue. Do not create spec documents from Ship.

### 5. Check version alignment

Use SemVer tags:

- `vMAJOR.MINOR.PATCH`

Default bump policy:

- `MAJOR`: breaking change or intentional compatibility break
- `MINOR`: new project-level capability that deserves a visible feature-line release
- `PATCH`: backward-compatible fix, meaningful behavior correction, user-visible `perf`, or small `feat`
- no release by default: `docs`, `chore`, `test`, `ci`, `build`, and `style`

Confirm the chosen version is consistent across:

- git tag
- version files
- package metadata
- docs or changelog entries that expose the version

If the repo has no version files, say so explicitly and recommend the tag action only.

### 6. Return the release decision to the user

At the end of ship:

- say the task is complete if and only if the gate is green
- show the evidence
- complete the requested release action when it was explicitly requested and the target is unambiguous
- otherwise hand the next release decision back to the user

Examples of next choices:

- merge into the release branch
- tag the release
- push the release branch or tag
- merge into the main branch
- open or update a pull request
- keep the branch for more work

## Return Contract

Use this shape:

```text
Branch Status:
- branch: ...
- local branches: one | multiple
- release target: ...
- worktree: clean | dirty

Verification:
- command: ...
  output: ...

Safety Scan:
- absolute path scan: pass | fail
- secret/config scan: pass | fail
- notes: ...

Spec Parity:
- pass | fail | not applicable
- notes: ...

Version:
- current: ...
- recommended: ...
- files/tag updated: ...

Release Status:
- green | blocked

Next User Choice:
- merge | tag | push | PR | more fixes
```

If any gate is blocked, stop and report the exact blocker instead of softening it.
