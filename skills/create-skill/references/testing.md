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

From the `skills/create-skill/` directory:

```bash
python scripts/quick_validate.py <path-to-skill>
```

From the repository root:

```bash
python skills/create-skill/scripts/quick_validate.py <path-to-skill>
```

This catches mechanical issues only:

- missing `SKILL.md`
- invalid frontmatter
- missing `name` or `description`
- invalid `name`
- overlong or unsafe `description`
- broken local markdown links in `SKILL.md` and reference Markdown files
- obvious placeholders

It does not prove the Skill is useful.

If the Skill has Python scripts, also smoke-test the entrypoints:

```bash
python skills/create-skill/scripts/smoke_skill_scripts.py <path-to-skill>
```

This is intentionally narrow: it verifies shipped script entrypoints can show help without broken imports or startup errors. It does not replace behavior tests.

## 3. Test With Fresh Agents

Prefer fresh-agent or subagent checks for behavior. The point is to see whether another agent can use the Skill without inheriting the current conversation's hidden context.

Use an interactive subagent probe when the Skill is meant to guide multi-step judgment, not just produce one artifact. This works well for Work-style, planning, review, testing, and discipline Skills where the agent should ask for missing context before deciding.

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

Interactive subagent probe shape:

1. Start one fresh subagent per realistic instance. Do not reuse the same agent across cases.
2. Give only the Skill summary, a realistic user request, and minimal project context such as an overview. Ask what success means, what could be affected, and what information it needs next.
3. Wait for the subagent's reply. Do not include the later exploration facts in the first message; many agents will answer only the final instruction when overloaded.
4. Provide invented but coherent follow-up facts such as relevant architecture notes, observed behavior chains, existing tests, constraints, and a minimal reproduction.
5. Ask for the final decision or output the Skill should guide: for example which tests to write, what not to test, red/green verification, routing choice, or handoff plan.
6. Judge whether the agent followed the Skill's intended behavior. Record specific misses; do not silently fix the Skill during the test run.

Use two or three cases for meaningful workflow changes: one straightforward case that should pass cleanly, and one edge or pressure case that could expose overreach, under-coverage, or premature action.

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
