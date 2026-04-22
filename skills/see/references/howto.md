# How To

Read this file after the root skill routes the task to `howto`.

The job is to give the user an executable path. Start with the official route, then add the main pitfalls, prerequisites, and the limits of any community workaround.

## Core Flow

1. Define the target action and environment.
   Identify what the user wants to do and on which platform, version, and dependency environment it must work.
2. Start with official docs, best practices, and formal guidance.
   Let the official path define the main route before adding forum posts or workaround threads.
3. Fill in the prerequisites.
   Include permissions, version requirements, platform differences, dependency components, network constraints, and region limits when they matter.
4. Add real failure reports, issues, forums, and experience posts where needed.
   Use them to expose pitfalls, missing steps, and realistic alternatives that the official docs may not cover well.
5. Separate the official route from the community workaround route.
   A workaround can be useful without becoming the recommended path.
6. Check version drift and platform differences.
   Old tutorials, stale issues, and outdated screenshots can easily point to a broken path.
7. Present the result as an executable explanation.
   Start with the recommended path, then add pitfalls, alternatives, and scope limits.

## Precision Levels

### Standard mode (`standard`)

- Give one executable main path.
- Explain the main pitfalls and the most important prerequisites.
- Optimize for the route the user can actually follow now.

### Strict mode (`strict`)

- Verify version, platform, and dependency conditions.
- Confirm the boundary of each workaround.
- If official docs and community experience conflict, keep the conflict visible and explain which side is stronger.

### Adversarial mode (`adversarial`)

- Actively check for outdated docs, dead steps, and old advice that conflicts with the current version.
- Assume a popular guide may contain at least one stale step and verify it directly.
- For widely copied old solutions, validate against the newest official material first.

## Answer-Specific Rules

- Give the recommended path first, then add the common pitfalls and alternatives.
- When steps depend on platform, version, permissions, or plan tier, keep that qualifier next to the step instead of burying it later.
- Do not present a community workaround as if it were the official recommendation.
- If only the direction is verified but not every step, say exactly which part still needs verification.

## Stop Conditions

Stop when all of these are true:

- the user has an executable main path
- the key prerequisites and main pitfalls are named
- the boundary between the official route and workaround routes is clear
- more searching would mostly repeat the same pitfalls without changing the recommendation
