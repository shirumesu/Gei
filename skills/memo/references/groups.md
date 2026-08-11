# Groups

A Group is a shared Spec scope for related but independently rooted Projects, such as frontend/backend/API repositories or multiple mods for one game.

Create a Group intentionally at `<GeiSpec home>/groups/<group-id>/` from `templates/group/`, rendering its id and name placeholders. `group.json` is the single membership source and contains `id`, `name`, and members shaped as `{ "project": "<project-id>", "role": "<role>" }`. Do not duplicate membership into Project manifests.

An active Group must record at least a shared purpose and useful project boundaries in `OVERVIEW.md`; remove `gei:empty` when doing so. A bare scaffold remains valid but its empty Overview and Memory are not injected.

Ownership rules:

- One working directory only -> Project.
- Multiple members of one Group -> that Group.
- Unrelated projects generally -> Shared Context.
- When content broadens, move it; do not maintain copies in every member.

Projects may belong to multiple Groups. There is no implicit precedence between Groups; resolve contradictory shared records from current evidence or an explicit user decision, then correct the stale Group.

Hooks inject meaningful Group Overview and Memory independently. They expose member roots and Spec roots for on-demand sibling reads, but never inject every sibling Project document automatically.
