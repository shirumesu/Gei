# Compare

Read this file after the root skill routes the task to `compare`.

The core job here is not "find the loudest opinion." Define the comparison dimensions first, then determine which differences are actually supported by evidence.

## Core Flow

1. State the comparison question clearly.
   Name what is being compared, for which use case, and whether the output is difference mapping, a recommendation, or both.
2. Define the comparison dimensions before collecting material.
   Prefer user-specified dimensions. If the user did not give any, choose the smallest shared dimension set that is still sufficient for the task.
3. Confirm that the candidates are actually comparable.
   Check category, version, region, pricing tier, and target user. If they are not truly comparable, say so instead of forcing a direct ranking.
4. Start with official material.
   For pricing, features, compatibility, release dates, tier differences, and policy terms, prefer official pages, formal documentation, or original specifications first.
5. Add independent tests, real-world usage, and third-party observations where needed.
   Use these when official material does not answer performance, maintenance cost, usability, or real deployment behavior.
6. Extract common ground and meaningful differences.
   Separate "both support it but differently", "only one supports it", and "both claim support but the evidence tiers differ".
7. If the conclusion depends on weights or scenario, say so directly.
   Do not pretend there is one universal winner when the answer is really scenario-dependent.

## Precision Levels

### Standard mode (`standard`)

- Use the mainstream comparison dimensions.
- Collect official material for each candidate.
- Add one or a few representative independent tests or usage observations for the key dimensions.
- Stop when the answer is stable and new material is mostly repeating the same strengths and weaknesses.

### Strict mode (`strict`)

- Cross-check the key dimensions.
- Verify version, region, pricing tier, trial limits, and scope of applicability.
- Trace decision-critical differences toward primary support where possible.
- If official claims and independent tests disagree, keep the conflict visible instead of smoothing it away.

### Adversarial mode (`adversarial`)

- Actively seek evidence that cuts against the likely ranking.
- Look for boundary cases, failure cases, low-rating reasons, and reverse recommendations.
- Check for listicles or rankings that simply mirror each other.
- If one option looks like the obvious winner, deliberately search for the cases where it is not.

## Answer-Specific Rules

- Tell the user which dimensions are driving the comparison before or alongside the conclusion.
- If the weighting comes from your judgment rather than the user, say that it is a task-specific weighting assumption.
- If the answer depends on budget, region, team size, tech stack, or usage intensity, keep those conditions close to the conclusion.
- If the evidence is clearly asymmetric on one dimension, say so directly instead of implying equal support.

## Stop Conditions

Stop when all of these are true:

- the key comparison dimensions have direct support or a clearly named evidence gap
- the comparability question is resolved
- the conclusion is stable, or stable enough to split by scenario
- more searching would mostly repeat the same tradeoffs without changing the ranking logic or scope
