# Durable Task Reference

Create a task reference only when accepted work must survive session loss, handoff, or a long interruption. Task size alone is not sufficient.

## Minimum Content

- goal and user-visible success
- accepted decisions and material constraints
- unresolved questions that genuinely block or alter the work
- relevant code, tests, schemas, mockups, artifacts, or external references
- verification needed for handoff

Add implementation sections only when they improve recovery. Do not require a universal Section/Phase/Task hierarchy, file inventory, progress percentage, or repeated description of referenced artifacts.

## Maintenance

Keep the document aligned with accepted decisions. Record a deviation when it changes the target, constraint, or recovery path; do not turn the file into a diary of commands and completed microsteps.

When the work finishes, preserve only what remains useful for audit or handoff. Delete or archive the reference according to project policy; do not promote it automatically into architecture or memory.

## Acceptance

- The reference has real cross-session or handoff value.
- A future agent can identify the goal, constraints, relevant evidence, and next decision.
- Repository sources of truth are linked rather than copied.
- Provisional ideas are labeled and secrets or private scratch content are absent.
