# Testing Skills

Use this workflow when validating a new or changed Skill.

Testing should prove agent behavior, not only file validity. A syntactically valid Skill can still fail to trigger, over-trigger, or produce no improvement over ordinary prompting.

## 1. Choose The Validation Level

Use the lightest level that can honestly support the claim.

| Level | Use when | Check |
| --- | --- | --- |
| Format | any Skill file was created or edited | run `scripts/quick_validate.py` |
| Behavior | simple personal Skill or small edit | run 1-3 realistic prompts with the Skill |
| Baseline comparison | the Skill is meant to improve quality or consistency | compare with-skill output to without-skill or old-skill output |
| Pressure test | the Skill enforces discipline or could be rationalized away | test realistic scenarios with time, authority, sunk-cost, or shortcut pressure |

Do not use strict evaluation rituals for every small Skill. Do not skip behavior checks when claiming the Skill works.

## 2. Run Format Validation

From the skill directory or repository root:

```bash
python scripts/quick_validate.py <path-to-skill>
```

This catches mechanical issues only:

- missing `SKILL.md`
- invalid frontmatter
- missing `name` or `description`
- invalid `name`
- overlong or unsafe `description`
- broken local markdown links
- obvious placeholders

It does not prove the Skill is useful.

## 3. Test With Fresh Agents

Prefer fresh-agent or subagent checks for behavior. The point is to see whether another agent can use the Skill without inheriting the current conversation's hidden context.

With-skill prompt shape:

```text
Use the Skill at <skill-path> to complete this task:
<realistic user prompt>

Save or report the output that a normal user would care about.
```

Baseline prompt shape:

```text
Complete this task without using the Skill:
<same realistic user prompt>

Save or report the output that a normal user would care about.
```

For an existing Skill improvement, compare the revised Skill against the old version or a saved snapshot when that is practical.

## 4. Test Trigger Behavior

Prepare realistic examples:

- should-trigger prompts that represent the Skill's real work
- should-not-trigger prompts that are adjacent but should use a different workflow

Ask a fresh agent which Skill it would use and why, or run the prompts in an environment where Skill selection can be observed.

Do not rely on a local script to simulate agent trigger judgment unless the environment provides a real Skill-selection API.

## 5. Pressure-Test Discipline Skills

Use pressure tests only when the Skill is meant to enforce a rule that agents may rationalize away.

Good pressure scenarios combine several forces:

- deadline or emergency
- prior sunk cost
- authority instruction to skip process
- user pressure for speed
- apparent confidence that the shortcut will work

Record the exact rationalization when the agent violates the Skill. Use that wording to improve the Skill, then test again.

## 6. Record Results

For each test, capture:

- prompt
- expected behavior
- actual behavior
- whether the Skill was used correctly
- failure or improvement needed

Passing means the output demonstrates the intended behavior, not merely that the agent mentioned the Skill or repeated its rules.

## 7. Stop Rule

Stop testing when the evidence matches the Skill's risk level:

- simple Skill: format validation plus realistic behavior check
- important workflow Skill: with-skill behavior beats baseline on the intended failure mode
- discipline Skill: pressure tests no longer produce new rationalizations

If validation is skipped or incomplete, say that plainly.
