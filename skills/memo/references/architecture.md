# Architecture

Use this reference when stable system structure, a critical flow, an interface boundary, a major decision, or the maintenance entry point for a class of change needs to be recorded.

`ARCHITECTURE.md` is the project-level map. It should let a future agent answer four questions quickly: what are the major parts, how does work or data move between them, which contracts must hold, and where should a change begin. It complements rather than replaces `IMPACTS.md`: Architecture explains the stable system; Impacts lists sparse downstream consequences that are easy to miss.

## Shape

Preserve these root sections when useful:

- **System Context**: actors, external systems, and the project boundary.
- **Containers And Components**: major deployable units or maintenance domains and their responsibilities.
- **Critical Flows**: only flows whose ordering or boundary matters.
- **Interfaces And Invariants**: public contracts, schemas, ownership, and cross-cutting rules.
- **Data And State**: durable state, ownership, and movement across boundaries.
- **Decisions And Risks**: links to accepted decision records and known structural risks.
- **Task Entry Map**: where to start for recurring change types.

Use Mermaid or small text diagrams when relationships are materially clearer than prose. Prefer exact paths, symbols, interfaces, and links to source evidence over copied implementation detail.

## Scaling

Keep one root `ARCHITECTURE.md` while it remains scannable. When it grows beyond a useful project map, keep the root as an index and add cohesive domain views under `architecture/<domain>.md`. Split by maintenance boundary, not mechanically by directory.

Record consequential accepted decisions as `architecture/decisions/NNNN-short-title.md`, starting from `templates/decision-record.md`. A decision record should state status, context, decision, consequences, and evidence. When a later decision replaces it, keep the old record as `Superseded` and link both directions instead of rewriting history. Start a cohesive domain view from `templates/architecture-view.md`. Do not create either artifact for routine reversible implementation choices.

## Maintenance

- Update Architecture in the same task when a verified change alters a documented boundary, critical flow, ownership rule, or maintenance route.
- Preserve accurate existing sections and diagrams; update only the smallest stale surface.
- Link a non-obvious downstream check from `IMPACTS.md` instead of expanding Architecture into a risk checklist.
- Put recent outcomes in `CHANGELOG.md`, operational lessons in Memory, and cross-session task state in `docs/`.
- Treat code, configuration, tests, schemas, and observed runtime behavior as higher-authority evidence.

Before finishing, verify that common changes still route to the correct entry points, diagrams match the implemented boundaries, and linked files exist.
