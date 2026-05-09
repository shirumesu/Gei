# Catch-up Event

Use this event when work already happened outside Memo and must be captured before full reconciliation.

Catch-up is a temporary evidence capture. It should not become a second spec system.

## Trigger

Trigger this event when any of these are true:

- useful work already happened, but the intent or scope is unclear
- changed files exist without a usable `spec/current-work.md`
- the user asks to capture state before deciding how to reconcile it
- there is not enough evidence to safely update `ARCHITECTURE.md`, `CHANGELOG.md`, or a task spec

Do not use catch-up to avoid required ship, architecture, or changelog updates when the target files and evidence are already clear.

## Required Reading

Read only:

1. the user statement
2. the smallest changed-file list needed to understand the capture boundary
3. existing `spec/INBOX.md` if it exists

Do not read broad source files just to fill in a perfect history.

## Actions

Append a short entry to `spec/INBOX.md`:

```md
## YYYY-MM-DD - Short capture title

- Trigger:
- Known files:
- Known intent:
- Unknowns:
- Suggested next event: anchor reconciliation | architecture change | ship | task start
```

`INBOX.md` is a temporary capture surface. It is not a replacement for `ARCHITECTURE.md`, `CHANGELOG.md`, or active task specs.

## Completion Check

- The capture states what is known and unknown.
- The suggested next event is explicit.
- No canonical spec document was updated from uncertain evidence.
