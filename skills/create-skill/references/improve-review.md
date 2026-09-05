# Improving And Reviewing Skills

Use this workflow when an existing Skill needs review, right-sizing, or changed behavior.

Improvement is context engineering, not instruction accumulation. Compare the current behavior with the intended intervention, then delete, relocate, or clarify the least context needed.

## 1. Recover The Intended Intervention

Identify:

- what the Skill is for
- when it should and should not trigger
- the non-obvious knowledge or failure it addresses
- what evidence would show that it helps

If the Skill has no meaningful intervention beyond generic competent behavior, recommend deleting it or reducing it to a reference, tool, test, or project instruction.

## 2. Audit Context Cost

Classify each section before rewriting:

| Content | Action |
| --- | --- |
| Stable domain knowledge, product opinion, gotcha, or external contract | Keep |
| Detail needed only in a subset of invocations | Move behind a direct reference |
| Deterministic rule or operation | Enforce with a test, schema, script, or tool |
| General capability or agent judgment | Delete |
| Host, tool, project, or user instruction already authoritative elsewhere | Delete the duplicate |
| Several overlapping authorities | Choose one owner and link or route to it |
| Example that reveals a real boundary | Keep the smallest useful example |
| Example that merely demonstrates ordinary usage | Delete |

Do not preserve a rule merely because older models once needed it. Keep it only when current evidence, a durable preference, or the task's risk justifies its cost.

## 3. Review Selection

Check the frontmatter against realistic user intent:

- Does it say both what the Skill does and when it applies?
- Is it broad enough for natural phrasing but narrow enough to avoid adjacent work?
- Does it summarize the workflow so fully that an agent may skip the body?
- Does it duplicate a higher-level router's job?

Generalize from trigger failures; do not append every observed phrase.

## 4. Review Structure And Interfaces

Keep the normal path coherent in `SKILL.md`. Move only conditional or lookup-style material to references. Merge references that are always read together; remove unreachable ones.

Prefer self-describing scripts and tools over prose instructions about how to operate them. Normal CLI entrypoints should support `--help`, and deterministic checks should be executable rather than asserted.

Split a Skill only when it contains distinct triggerable responsibilities, not merely because it is long. Length is a symptom; mixed ownership and unconditional context are the actual problems.

## 5. Change From Evidence

Map observed problems to the smallest durable correction:

- wrong selection → revise the description or router boundary
- missed consequential step → make it part of the normal path or executable acceptance
- literal compliance with the wrong outcome → state the governing reason and restore judgment
- prompt pileup → delete generic rules and consolidate authority
- conditional overload → add a direct route to the relevant reference
- repeated mechanical mistake → improve the interface or deterministic check

Avoid adding narrow rules for one-off incidents.

## 6. Present The Result

For review-only requests, lead with:

- **Must fix:** likely wrong selection, behavior, conflict, or failed validation
- **Simplify:** context that can be deleted, consolidated, or deferred
- **Keep:** distinctive guidance that earns its cost
- **Suggested validation:** evidence that would resolve remaining uncertainty

For edit requests, change the affected authority and any directly coupled router or reference. Then use `testing.md` and report what changed, why, what was verified, and what remains uncertain.

## Maintenance Impact

Treat a Skill edit as an interface change, not an isolated Markdown patch:

| Change | Also reconcile |
| --- | --- |
| Name, description, trigger, or ownership boundary | Folder/frontmatter, higher-level router, adjacent Skill boundaries, UI metadata, and public capability lists |
| Normal workflow or acceptance boundary | Root `SKILL.md`, directly coupled references, and behavior checks that claim the old result |
| Conditional branch or domain detail | Its direct route from `SKILL.md`; merge or remove references that are always read together or no longer reachable |
| Script, schema, tool, or asset interface | Calling instructions, `--help` or schema surface, focused tests, and examples that encode the old interface |
| Removed or renamed resource | Every local link, route, validator expectation, package manifest, and distribution surface |

Keep history in repository release notes or version control, not inside the Skill. Rewrite current guidance, delete obsolete rules and fixtures, and verify no duplicate authority remains. Record easy-to-miss project consequences in the owning external topic or existing native documentation; consumer Skills should not learn this repository's layout.
