# Initialize Spec Context

Use this event when the user wants a Gei `spec/` layout created or repaired.

Read `../spec-system.md` and only the contracts for documents that will be created.

## Interface

```text
python skills/memo/scripts/init-spec.py <project-path> [--dry-run] [--add-gitignore]
```

The script creates missing core documents and directories while preserving existing files. It never initializes Git or overwrites documents. `--add-gitignore` is explicit because version-control policy belongs to the project.

## Workflow

1. Use `--dry-run` to inspect the planned creates and preserved files when the target is not empty.
2. Run initialization with only the options the user or project policy authorizes.
3. Seed `OVERVIEW.md` and `ARCHITECTURE.md` from the smallest useful repository context.
4. Keep `MEMORY.md` as an index; do not invent entries.
5. Create a task reference only when a separate explicit handoff or recovery need justifies it.

Initialization provides navigation, not a project encyclopedia. Verify created files, links, and any `.gitignore` change before reporting the result.
