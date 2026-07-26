# Reading Project Context

Use this reference when a design decision depends on an existing Gei `spec/` system.

1. Start from `spec/OVERVIEW.md` or its injected copy.
2. Read `spec/ARCHITECTURE.md` only when structure, boundaries, routing, or data flow matters.
3. Read the relevant task reference or recent changelog section only when it may constrain the decision.
4. Read linked memory entries only when their summaries identify a non-obvious applicable constraint.
5. Verify important claims against code, tests, configuration, and Git history.

Do not bulk-read `spec/docs/` or `spec/memory/`. Existing code, tests, schemas, mockups, and artifacts may be better design references than a Markdown summary.

Consider reads project context; it does not update `spec/`. Use Memo only when durable documentation is part of the requested outcome or an explicit handoff requires it.
