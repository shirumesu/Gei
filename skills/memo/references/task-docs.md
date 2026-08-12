# Change Specs And Task References

Use the lightest durable shape that preserves information the current conversation cannot safely carry.

## Task Reference

Use `docs/<topic>.md` only when an accepted task must survive a session boundary or be handed to another agent/person. Start from `templates/task-reference.md` and preserve Goal, Accepted Decisions, Constraints, Recovery Route, Open Questions, and Verification. Prefer links to code, schemas, artifacts, issues, or sources over copied content.

## Structured Change

Use `changes/<short-name>/` when a consequential feature or migration benefits from keeping four concerns distinct:

- `proposal.md`: why this change is needed, scope, and explicit non-goals
- `requirements.md`: observable behavior and acceptance scenarios
- `design.md`: implementation approach, interfaces, architecture delta, risks, and accepted decisions
- `tasks.md`: the smallest ordered execution and verification checklist needed for coordination

Start from the matching files under `templates/change/`. Omit a file when it adds no information; a structured change is not a mandatory phase gate. Existing native RFC, issue, design-doc, or spec conventions take precedence.

After implementation is verified, merge durable current facts into the owning Overview, Architecture/domain view, decision record, or Impacts route; add the concise outcome to Changelog; then delete the change package or move it to `changes/archive/YYYY-MM-DD-<short-name>/` only when its rationale or audit history remains valuable.

Do not create either shape for routine work, use `tasks.md` as a second tracker, copy source detail into requirements, or let completed change artifacts become the only description of the current system.
