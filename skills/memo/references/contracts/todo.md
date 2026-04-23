# TODO Contract

Use this contract when creating or updating `spec/TODO.md`.

## Responsibility

`TODO.md` is the live work ledger. It tracks accepted work, backlog ideas, active work, and recently completed items.

## Required Sections

Maintain these sections exactly unless the repo already has a stable equivalent:

- `Backlog`
- `TODO`
- `In Progress`
- `Done`

## Item Format

Use stable TODO ids:

```md
- `#TOD-001` [P3] Short description. Context: why it matters. Links: #001 or none
```

For active work:

```md
- `#TOD-003` [P0] Short description. Started by: #001. Notes: current state
```

For completed work:

```md
- `#TOD-004` [Done] Short description. Closed by: [#001](docs/#001-work.md)
```

## State Rules

- `Backlog` holds ideas that are useful but not scheduled.
- `TODO` holds accepted work that is not active yet.
- `In Progress` holds only currently active work.
- `Done` holds completed items with the spec or changelog reference that closed them.
- During archive cleanup, move older closed items out of `Done` and into `spec/archive/TODO.md`.

Within `TODO`, use priorities `P0` through `P4`.

Do not keep the same item in two sections.

## Write Rules

- Write each item as one concrete unit of work.
- Include id, priority where applicable, reason, and owning spec link when possible.
- Do not hide multiple tasks inside one sentence.
- Do not create TODOs for speculative cleanup without a reason.
- Preserve the repo's existing numbering pattern if one already exists.

## Completion Check

- IDs are unique.
- Items appear in exactly one state section.
- `Done` items include close-out references.
- Deferred items explain why they were deferred.
