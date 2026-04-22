# Fact Check

Read this file after the root skill routes the task to `fact-check`.

The goal is not to pile up links. The goal is to decide how far the claim is actually supported and where the support stops.

## Core Flow

1. Rewrite the target claim into a testable statement.
   Do not keep vague, emotional, or overly compressed phrasing when a clearer statement can be tested directly.
2. Break the claim into subclaims.
   A large claim often bundles existence, rollout status, availability, eligibility, defaults, and scope into one sentence.
3. Define what would support the claim.
   Identify what would count as real support before collecting a stack of paraphrases.
4. Define what would falsify or narrow the claim.
   Region limits, staged rollouts, plan restrictions, subset availability, and outdated versions often narrow a claim even when they do not fully falsify it.
5. Search for support and contradiction in parallel.
   Do not commit to one side first and then search only for confirming material.
6. Check the key qualifiers.
   Date, region, version, plan tier, user segment, rollout scope, and prerequisites are common claim boundaries.
7. Assign a verdict and explain why.
   When necessary, assign verdicts to subclaims first and then summarize them into the overall verdict.

## Verdict Labels

Prefer these verdict labels:

- `supported`
- `partly supported`
- `insufficient evidence`
- `contested`
- `falsified`

These labels are not decoration. They should reflect the evidence state, not just the tone of the answer.

## Precision Levels

### Standard mode (`standard`)

- Cross-check the core claim across multiple sources.
- Collect the key material that directly supports or challenges the claim.
- Keep any remaining uncertainty explicit if it does not change the main verdict.

### Strict mode (`strict`)

- Trace important points toward primary sources where possible.
- Check whether the critical qualifiers are actually satisfied.
- Run at least one reverse check against the most easily missed part of the claim.
- If the support is mostly second-hand, do not assign an overconfident verdict.

### Adversarial mode (`adversarial`)

- Actively seek counterexamples and failure cases.
- Check whether the authority chain is genuine or just another secondary summary.
- Identify mirrored paraphrases, circular sourcing, recycled screenshots, and marketing copy presented as announcements.
- Try to break the claim first. Increase confidence only after the counterevidence pass fails to break it.

## Answer-Specific Rules

- Give the verdict first, then explain the basis.
- State the exact claim that was tested. Do not make the reader infer which sentence you evaluated.
- If only part of the claim holds, use `partly supported` and name which part holds and which part narrows or fails.
- If the evidence conflicts and the conflict cannot yet be resolved, prefer `contested`.
- If the evidence is sparse, stale, or too second-hand, say `insufficient evidence` directly.

## Stop Conditions

Stop when all of these are true:

- the claim is decomposed clearly enough
- the search covered both support and contradiction
- the key qualifiers were checked
- the overall verdict is stable and would not change from a few more same-tier repeats
- the answer already separates facts, inferences, and open uncertainty
