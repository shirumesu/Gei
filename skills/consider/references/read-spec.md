# Reading Project Context

Use this reference when a design decision depends on existing GeiSpec context.

1. Start from the injected Project Overview and any meaningful Group Overview.
2. Read Project `IMPACTS.md` only when the decision may affect another component, interface, process, or artifact.
3. Read Group `IMPACTS.md` only when the decision may affect another member Project.
4. Read linked memory entries only when their summaries identify a non-obvious applicable constraint.
5. Read a task reference only when it directly owns accepted decisions or recovery context for the request.
6. Verify important claims against code, tests, configuration, and Git history.

Do not bulk-read `docs/`, `memory/`, sibling Projects, or every Group. Existing code, tests, schemas, mockups, and artifacts may be better design references than a Markdown summary.

Consider reads project context; it does not update Spec. Use Memo only when durable documentation is part of the requested outcome or a required handoff.
