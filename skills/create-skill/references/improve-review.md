# Improving And Reviewing Skills

Use this workflow when the user provides an existing Skill, says a Skill behaved incorrectly, wants to incorporate new material, or asks for an audit.

Improvement and review use the same method: compare the Skill's current behavior against the intended recurring task, then make or recommend the smallest change that improves future agent behavior.

## 1. Establish The Target

Recover the intended behavior before judging the file.

Use the conversation, supplied examples, user feedback, and existing Skill files to identify:

- what the Skill is for
- when it should trigger
- when it should not trigger
- what output or behavior should improve
- what went wrong, if there was a failure

Do not start by expanding the Skill. Most fixes should make the Skill clearer or better organized, not bigger.

## 2. Review The Description

Check whether the frontmatter description can select the Skill correctly.

Look for:

- missing "when to use" information
- vague descriptions that match too many tasks
- overly narrow wording that misses real user phrasing
- workflow summaries that may tempt the agent to skip the body
- missing terms that users naturally use
- descriptions near or above the 1024-character limit

When optimizing, use realistic should-trigger and should-not-trigger examples. Generalize from failures instead of appending every observed phrase.

## 3. Review The Body

Check whether `SKILL.md` behaves like a Skill entry file.

Good signs:

- the root file has a clear overview and route
- core rules are few and consequential
- detailed branches are linked only when needed
- the workflow is operational enough to follow
- verification is explicit

Warning signs:

- it reads like a long prompt
- it explains common knowledge at length
- it mixes several unrelated tasks
- it hides trigger rules only in the body
- it repeats the same guidance in several places
- it adds rigid fields or checklists without a real failure mode

Create-time standards also apply during review. If a problem would have made a new Skill weaker, it is valid review feedback for an existing Skill.

## 4. Review Progressive Disclosure

Check whether content is in the right place.

Keep in `SKILL.md`:

- trigger-adjacent principles
- root workflow
- route map
- constraints that must always apply
- minimum acceptance

Move to `references/`:

- scenario, domain, framework, format, or option-specific workflows
- detailed style rules, schemas, API guides, policies, or example sets that are only needed for some requests
- complex review checklists that are only needed during review tasks
- variant-specific instructions

Do not move material solely because it is somewhat long. If every invocation needs the information, keep it in `SKILL.md` and make it concise. If `SKILL.md` is nearing or over roughly 500 lines, first decide whether the excess content is core, conditional, or evidence that the Skill should be split.

Keep scripts only when the operation is deterministic, repeated, and easier to verify with code than prose.

## 5. Improve From Evidence

If there is a concrete failure, map it to the smallest useful edit.

| Failure | Likely edit |
| --- | --- |
| Skill did not trigger | Rewrite description with better intent and trigger coverage |
| Skill triggered for adjacent work | Narrow description and add boundary language |
| Agent read the Skill but skipped an important step | Move the step earlier, make it part of the workflow, or add a verification gate |
| Agent followed the letter but not the intended behavior | Explain the reason behind the rule and add a concrete example |
| User supplies new understanding | Update the relevant trigger, workflow, examples, and validation case |
| Skill feels like a prompt dump | Compress the root file and move conditional scenario or lookup detail into references |

Avoid overfitting. Do not add a narrow rule unless it represents a recurring case, a known failure mode, or a stable user preference.

## 6. Output For Review-Only Requests

When the user asks only for review, lead with findings.

Use this shape:

- **Must fix:** problems likely to cause wrong triggering, wrong behavior, or failed validation.
- **Should improve:** changes that would make the Skill clearer or more maintainable.
- **Keep:** parts that are already working well.
- **Suggested validation:** the next behavior checks that would prove the fix.

Ground each finding in the file section or observed behavior. Do not rewrite the Skill unless the user asked for edits.

## 7. Output For Edit Requests

When the user asks you to improve the Skill, edit the smallest affected files and then validate.

After editing, report:

- what changed
- which failure or review finding it addresses
- what validation was run
- what remains uncertain, if anything
