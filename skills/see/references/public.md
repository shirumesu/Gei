# Public Opinion

Read this file after the root skill routes the task to `public-opinion`.

If the task depends on Jina access for Reddit, X/Twitter, or Xiaohongshu, read `references/tool.md` first and then continue here.

This branch is about user voices, platform feedback, and public discussion samples. It is not the same thing as fact-checking. User voices can prove that people are saying, reporting, or feeling something. They do not automatically prove that the underlying fact is established.

## Core Flow

1. Define the sampling scope first.
   Identify the topic, platforms, time range, and target user group. Without that boundary, a public-opinion summary drifts quickly.
2. Sample from platforms with dense original user voices.
   Examples include X, Reddit, Xiaohongshu, forums, comment sections, and product communities. Prefer original posts, long comments, and discussion threads over reposted summaries.
3. Cluster the main emotions, repeated experiences, and common complaints.
   Focus on repeated themes instead of only quoting the most dramatic examples.
4. Check the bias risks.
   Look for platform bias, sample bias, marketing noise, repost chains, copy loops, survivor bias, and emotional amplification.
5. Separate subjective user experience from verifiable fact.
   If a post contains an objective claim, keep it at the level of "user-reported claim" unless it is separately checked.
6. Use cross-platform sampling when the task needs stronger rigor.
   Check whether a loud viewpoint exists across platforms or mainly inside one echo chamber.

## Precision Adjustments

- `standard`: summarize the main sentiment clusters and representative voices while stating that the result is a sample observation, not population statistics.
- `strict`: sample across platforms, mark bias and time distribution, and test whether frequent viewpoints are broad or merely amplified.
- `adversarial`: seek opposing user groups and quieter counter-samples, then down-rank coordinated, marketing-driven, or heavily duplicated material.

## Answer-Specific Rules

- State the sample sources, platform scope, and time range clearly.
- State the bias risks and platform limits clearly.
- State clearly that user voices are not the same thing as factual proof.
- If the user starts treating the sample as a factual basis, move the key objective claim into the `fact-check` branch.

## Capability Matrix

Do not pretend that restricted-platform tooling already exists. State the current capability honestly.

| Capability | Current state | Notes |
| --- | --- | --- |
| Jina guidance | bundled | Load `references/tool.md` for known URLs on crawler-hostile platforms |
| Platform sampling scripts | not bundled | The repo ships guidance, not platform-specific wrappers |
| Restricted-platform reading | not bundled | Work only with what the current environment can actually access |
| Unified health or setup checks | not bundled | Treat network readers as ordinary web access, not installed tools |

## Stop Conditions

Stop when all of these are true:

- the main sentiment clusters and repeated viewpoints are stable
- the sample sources, time range, and bias risks are explained
- subjective user reports are separated from verifiable fact
- more sampling would mostly repeat the same voices instead of changing the overall observation
