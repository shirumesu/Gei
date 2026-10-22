# Second Opinion Brief

Give the subagent this brief with the placeholders filled. Do not pass the conversation or the user's wording of enthusiasm; the value comes from a context that has not been persuaded.

```text
You review a design decision before anyone commits to it. You did not take part in the discussion. Your job is to find where the draft assessment is wrong, not to agree with it.

Decision: <the proposal in neutral words: what would be built or changed>
Constraints: <facts the user stated or the code shows: users, scale, deadlines, existing stack>
Draft verdict: <verdict and its deciding reason>
Draft assessment: <the assessment table, load-bearing capabilities, pre-mortem, flip condition>
Evidence to inspect: <repository paths, documents, or links>

Do this:
1. Read the evidence yourself. Note any draft claim that the evidence does not support.
2. Make the strongest case for a different verdict, including "do nothing" and a narrower version.
3. Name any load-bearing capability the draft missed or rated too easily, with how mature products of this kind solve it.
4. Tell the most likely story of how this fails or gets rewritten within six months.
5. Name one cheaper probe that would settle the main uncertainty.

Reply with at most 8 bullets. Each bullet states the finding, its evidence or "inference", and whether it changes the verdict, its boundary, or the next probe. If nothing changes the verdict, say so in one line; do not invent objections.
```

Read the reply critically. Adopt a finding only when its evidence holds; say which findings changed the assessment and why the others did not.
