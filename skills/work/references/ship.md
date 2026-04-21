# Ship Reference

## Overview

Ship is the final mechanical release gate after implementation is complete.

It is not a design phase. It is not a brainstorming phase. It is a fixed validation pass that proves the current task is ready to hand back to the user for the final branch decision.

Use it from the main thread or from one ship agent.

## Boundaries

- Do not merge, push, or force push unless the user explicitly asks.
- Do not skip verification because the change looks small.
- Ask the user before continuing only when a destructive action, a major version bump, or a serious unresolved coverage gap is next.
- If the environment is missing declared tooling, bootstrap it automatically from the repo's documented setup path, then continue.

## Gate Order

Run the gate in this order.

### 1. Check branch and repo state

Confirm:

- current branch
- clean or expected worktree status
- no unrelated changes that would pollute release evidence

If the state is unexpectedly dirty, stop and report it.

### 2. Run the full verification set

Run the full unit test suite and any other required quality commands from the active spec-task.

If the environment is missing tooling:

1. find the documented bootstrap or install command in `spec/ARCHITECTURE.md`, the active `spec/docs/#NNN-work.md`, or `README.md`
2. run it automatically
3. rerun verification

Record the exact commands and observed outputs.

### 3. Scan for distribution blockers

Check for anything that would make the shipped result unsafe or non-portable.

At minimum:

- run `python skills/work/scripts/ship_scan.py .` to scan for hard-coded absolute paths
- search for likely secret leaks or unsafe local-only configuration
- check for machine-specific assumptions that other users cannot reproduce

If the repo has known secret files or fixture exceptions, apply the documented exclusions rather than skipping the scan.

### 4. Check spec parity

Compare the shipped state against the active `spec/docs/#NNN-work.md`.

Make sure:

- completed items are actually complete
- unchecked items are either finished or explicitly changed/deferred with a reason
- deferred work is reflected in `memo` and `spec/TODO.md`

Do not ship with silent drift between code and spec.

### 5. Check version alignment

Use the four-part version rule:

- `MAJOR.MINOR.PATCH.MICRO`

Default bump policy:

- `MAJOR`: breaking change or intentional compatibility break
- `MINOR`: new user-facing capability
- `PATCH`: backward-compatible fix or meaningful behavior correction
- `MICRO`: docs, tests, internal-only cleanup, or tiny maintenance change

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
- hand the next branch decision back to the user

Examples of next choices:

- merge into the main branch
- open or update a pull request
- keep the branch for more work

## Return Contract

Use this shape:

```text
Branch Status:
- branch: ...
- worktree: clean | dirty

Verification:
- command: ...
  output: ...

Safety Scan:
- absolute path scan: pass | fail
- secret/config scan: pass | fail
- notes: ...

Spec Parity:
- pass | fail
- notes: ...

Version:
- current: ...
- recommended: ...
- files/tag updated: ...

Release Status:
- green | blocked

Next User Choice:
- merge | PR | more fixes
```

If any gate is blocked, stop and report the exact blocker instead of softening it.
