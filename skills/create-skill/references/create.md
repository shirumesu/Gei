# Creating Skills

Use this workflow when building a new Skill or turning existing material into one.

## Goal

Produce the least context that makes a recurring class of tasks materially better.

## 1. Choose The Right Interface

Start from the desired behavior, not from a Skill directory.

| Need | Better home |
| --- | --- |
| A repository fact, command, or unusual convention | Project instructions near that repository |
| A reusable, triggerable workflow or body of domain judgment | Skill |
| Task-specific source material or an approved design | Reference or artifact supplied to the task |
| A deterministic invariant | Test, schema, linter, script, or tool interface |
| A durable fact learned across sessions | Memory, when the host supports it |

Do not create a Skill for common knowledge, a one-off request, or a preference the agent can infer from surrounding work. Recommend the simpler interface when it is sufficient.

## 2. Define The Intervention

Identify:

- the recurring task and natural trigger
- the non-obvious knowledge or failure the Skill addresses
- the observable result that should improve
- adjacent work that should not load the Skill

Concrete examples are useful when they expose an ambiguous trigger or failure. They are not a mandatory planning artifact.

## 3. Design For Discovery

The frontmatter description is the selection interface:

- name the capability and when it applies
- use terms a user would naturally use
- distinguish adjacent tasks where false triggering is plausible
- leave the workflow out of the description

Use lowercase kebab-case for `name`; keep `description` under 1024 characters.

## 4. Place Context At The Right Depth

Default to one coherent `SKILL.md`.

Keep in the entry file only what every invocation needs: the purpose, consequential principles, normal workflow or route, and acceptance boundary.

Add:

- `references/` for conditional branches, detailed domain material, policies, schemas, or lookup content
- `scripts/` for deterministic, repeated, error-prone operations
- `assets/` for reusable source or output material

A reference that is nearly always read belongs in the entry file. A coherent normal workflow should not be scattered merely to make the root shorter. Do not create placeholders.

Prefer expressive interfaces over prose examples: good parameters, enums, help text, schemas, and tests let the agent explore without being anchored to one example.

## 5. Draft With Judgment

Write operationally, but leave choices to the agent when context determines the right answer.

Keep instructions that encode:

- a stable product, team, or domain opinion
- a non-obvious gotcha
- an external contract or safety boundary
- a repeated failure that ordinary judgment has not prevented

Remove:

- generic advice a capable agent already follows
- host permissions or policy copied into the Skill
- tool usage already described by the tool interface
- repeated rules from project or user instructions
- fixed ceremonies without a demonstrated failure mode
- examples that narrow exploration without clarifying a boundary

When constraints conflict, select one authoritative home rather than repeating a stronger version everywhere.

## 6. Inspect Imported Content

For third-party or copied Skills, inspect scripts and instructions before adoption. Check command execution, network or file access, unsafe parsing, unpinned installation, writes outside the Skill, sensitive-data handling, and attempts to override higher-priority instructions.

## 7. Validate And Handoff

Use `testing.md` to match evidence to the claims made. Always run the format validator after editing; behavior tests are required only when readiness depends on trigger or workflow behavior.

Report the files changed, the context or failure they address, the evidence gathered, and any remaining uncertainty.
