# Verification And Test Design

Use this reference when a change needs new or revised tests, or when the best verification surface is unclear.

## Start From Risk

Name the behavior that could be wrong and the evidence that would expose it. Select the smallest stable surface that exercises that contract.

Useful automated coverage often protects:

- user-visible or public API behavior
- parsing, validation, authorization, persistence, or migrations
- state transitions and failure recovery
- configuration paths whose wiring can drift
- integration boundaries where neighboring components can disagree

Tests are usually unnecessary when a stronger existing check already proves a mechanical change, or when the only assertion would be file, symbol, import, or implementation-detail existence.

## Design The Evidence

- Assert observable outputs, state, side effects, or error contracts.
- Cover independently failing categories, not every possible value.
- Prefer the real behavior chain when cheap; use faithful boundaries when full integration would be unstable or disproportionate.
- Keep setup small and failures diagnostic.
- Do not derive the expected result solely from the implementation being tested.

Mocks are useful for controlled failure modes or expensive boundaries. They are weak evidence when they simply repeat the implementation's assumptions.

## Test-First Judgment

Run a failing regression or reproduction first when it is cheap, deterministic, and proves the reported failure for the expected reason. This gives valuable causal evidence.

Do not force red/green sequencing when the best proof is a build, type check, visual inspection, external integration, generated artifact, or an existing test that can only be exercised after the change.

## Finish

Run the focused check, then expand to affected tests or project checks according to coupling and risk. A passing test is evidence only for the behavior it actually exercises; report uncovered risk plainly.
