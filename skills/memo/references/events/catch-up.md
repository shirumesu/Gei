# Catch-Up Event

Use this event when work already happened outside Memo and the facts must be captured before full reconciliation.

Catch-up prevents expensive reconstruction. It records enough evidence for a later formal update without forcing the agent to read the whole project immediately.

## Trigger

Trigger this event when any of these are true:

- The user says they completed work manually and did not update spec docs.
- The current session inherited code or document changes with unclear Memo coverage.
- There is not enough time or context to reconcile every affected spec file safely.
- A durable event likely happened, but the correct final destination is uncertain.

Do not use catch-up to avoid required ship, architecture, TODO, or memory updates when the target files and evidence are already clear.

## Required Reading

Read the smallest available evidence set:

1. The user's summary.
2. Changed file list or recent commit summary if available.
3. Existing `spec/INBOX.md` if it exists.
4. The target spec file only when needed to avoid duplicating an existing pending item.

Do not read the full repo or all spec documents just to create a catch-up note.

No document contract is required for pure catch-up capture. If you have enough evidence to update a canonical spec file, stop using catch-up and reroute to the formal event for that update.

## Target File

Use `spec/INBOX.md` for pending catch-up notes.

`INBOX.md` is a temporary capture surface. It is not a replacement for `ARCHITECTURE.md`, `TODO.md`, `MEMORY.md`, `CHANGELOG.md`, or active task specs.

## Entry Shape

Each entry must include:

- Date:
- Event:
- Evidence:
- Candidate destination:
- Needs reconciliation:
- Notes:

Keep entries short. Record facts and evidence, not analysis chains.

## Reconciliation Rule

Before ship, handoff, archive cleanup, or a deliberate Memo sync, each `INBOX.md` entry must be:

- moved into the correct spec file,
- converted into a TODO item,
- archived with a reason, or
- kept with an explicit reason and next reconciliation condition.

## Completion Check

Before finishing:

- `INBOX.md` contains only pending facts.
- Every entry has evidence and a candidate destination.
- No formal spec file was guessed into existence without enough context.
- The user can later ask Memo to reconcile the pending notes.
