# Reading Project Context

Use this reference when a design decision depends on existing GeiSpec context.

1. Start from the injected Project Overview and any meaningful Group Overview.
2. Read Project `ARCHITECTURE.md` when the decision depends on system structure, critical flows, interfaces, accepted decisions, or maintenance boundaries.
3. Read Project `IMPACTS.md` only when the decision may affect another component, interface, process, or artifact.
4. Read Group `IMPACTS.md` only when the decision may affect another member Project.
5. Use the injected Project Changelog when recent verified outcomes may change the decision; read the full `CHANGELOG.md` only when older release or checkpoint history matters.
6. Read linked memory entries only when their summaries identify a non-obvious applicable constraint.
7. Read a task reference only when it directly owns accepted decisions or recovery context for the request.
8. Verify important claims against code, tests, configuration, and Git history.

Do not bulk-read `docs/`, `memory/`, sibling Projects, or every Group. Existing code, tests, schemas, mockups, and artifacts may be better design references than a Markdown summary.

Consider reads project context; it does not update Spec. Use Memo only when durable documentation is part of the requested outcome or a required handoff.
