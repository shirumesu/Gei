# Testing Skills

Use this workflow when validating a new or changed Skill.

Test the claim the Skill makes. Do not turn validation into a fixed ceremony.

## 1. State The Claim

Examples:

- the package is structurally valid
- the description selects the right tasks
- conditional material loads only when relevant
- the workflow changes an observed behavior
- a safety or discipline boundary survives pressure

Choose the cheapest evidence that could falsify that claim.

## 2. Run Format Validation

From the repository root:

```bash
python skills/create-skill/scripts/quick_validate.py <path-to-skill>
```

This checks frontmatter, required fields, naming, description limits, local Markdown links, and obvious placeholders. It does not prove the Skill is useful.

If the Skill has Python scripts, smoke-test its entrypoints:

```bash
python skills/create-skill/scripts/smoke_skill_scripts.py <path-to-skill>
```

This verifies that normal entrypoints can show help without broken imports or startup errors. Add focused script tests when behavior is deterministic.

## 3. Match Evidence To Behavior

| Claim | Suitable check |
| --- | --- |
| Correct trigger boundary | A few realistic should-trigger and adjacent should-not-trigger prompts |
| Clear self-contained workflow | A fresh agent using only the Skill and minimal task context |
| Improvement over an existing Skill | Revised versus old behavior on the known failure |
| Improvement over ordinary judgment | With-Skill versus without-Skill comparison |
| Resistance to shortcut pressure | A realistic pressure case |
| Deterministic artifact or operation | Script, schema, fixture, or unit test |

Behavior checks are not automatically required for wording, links, or internal reorganization when no behavioral claim is made. Conversely, format validation alone cannot support a claim about triggering or task quality.

## 4. Keep Behavior Checks Clean

When using agents, prevent hidden conversation context from doing the Skill's work:

- use a fresh agent when independence matters
- provide the Skill and only the task context a normal invocation would have
- keep comparison prompts equivalent
- judge the user-visible decision or artifact, not whether the agent quoted the Skill

Use pressure tests only for boundaries that agents may plausibly rationalize away. Use baseline comparisons only when the claim is that the Skill improves on ordinary judgment.

## 5. Record And Stop

Capture the prompt or fixture, expected behavior, actual behavior, and any specific miss. Keep this lightweight unless the results need to be reproduced later.

Stop when the evidence supports the stated claim at the task's risk level. Do not keep testing to satisfy a target count.

If validation is skipped or incomplete, say that plainly.
