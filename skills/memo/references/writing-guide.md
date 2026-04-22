# Writing Guide

## Goal

Write project memory like a precise engineer handing work to another precise engineer.

The text should read as calm, direct, and useful. It should not sound excited, vague, inflated, or machine-generated.

## Baseline

- Write in English.
- Use plain, direct sentences.
- Use active voice when the actor matters.
- Name the file, command, function, constraint, or hazard instead of gesturing at it.
- Prefer exact facts over broad claims.

## Tone

Keep the tone restrained.

Good:

- "The queue worker retries network failures three times."
- "This task defers OAuth provider support to `#TOD-014`."

Bad:

- "This robust workflow dramatically streamlines retries."
- "The system thoughtfully handles failures in a scalable way."

## Word Choice

Prefer simple words over inflated ones.

Replace:

- `leverage` -> `use`
- `utilize` -> `use`
- `robust` -> `reliable` or the exact property
- `streamline` -> `simplify`
- `paradigm` -> `model` or `approach`
- `ecosystem` -> `project`, `tooling`, or the exact field
- `deep dive` -> `analysis`

Cut empty intensifiers:

- `really`
- `very`
- `extremely`
- `fundamentally`
- `clearly`
- `obviously`
- `significantly`

If the sentence still works after removing the word, keep it removed.

## Sentence Patterns To Avoid

Avoid formulaic structures that make AI writing obvious.

Do not write:

- "The question is not X. The question is Y."
- "This is not just A. It is B."
- "Here is the thing."
- "Let's break this down."
- "In conclusion."
- punchline fragments such as "Quietly. Efficiently. Reliably."

State the point directly instead.

## Specificity Rule

Replace abstract claims with concrete facts.

Weak:

- "The architecture is flexible."

Better:

- "The API layer depends on interfaces in `src/core/` rather than concrete adapters."

Weak:

- "The task improved performance."

Better:

- "The importer now batches writes in groups of 500 rows."

## Structure

Use headings and bullets only when they help scanning.

Prefer:

- short sections
- sentence-based bullets
- stable section order across documents

Avoid:

- bold-first bullets for every line
- repeated summaries
- long introductions before the actual point

## Document-Specific Guidance

### `ARCHITECTURE.md`

- Start with system purpose and top-level map.
- Use ASCII diagrams for important flows or state changes.
- Record invariants, interfaces, and structural risks.
- Keep commentary factual. Do not sell the design.

### `TODO.md`

- Write each item as a concrete unit of work.
- Include id, priority, and a short reason.
- Link to the owning spec doc when possible.
- Do not hide multiple tasks inside one sentence.
- Treat `Done` as a short-lived close-out section. Move older completed items into `spec/archive/TODO.md` during archive cleanup.

### `MEMORY.md`

- Record only repeatable pitfalls, rejected directions, and version-specific hazards.
- Keep only entries that are reusable across multiple tasks, files, or sessions.
- Name the trigger, the failure, and the safe pattern that avoids it next time.
- Include the relevant file path, command, error text, or spec id when known.
- Skip ordinary progress notes, one-off file-local instructions, and full decision histories.
- When an entry looks too local or too stale to keep active, surface it to the user as an archive candidate instead of silently treating it as durable memory.

### `CHANGELOG.md`

- Record outcome first, then impact.
- Reference the spec doc and resolved TODO ids.
- Prefer user-visible or architecture-visible language.
- Do not copy commit messages line by line.
- Keep only the latest five version entries in the active file. Move older entries into `spec/archive/CHANGELOG.md` without changing their meaning.

### `spec/archive/*.md`

- Preserve ids, dates, and source references.
- Keep archived wording close to the original text.
- Add a short archive note only when the reason for removal is not obvious.
- Organize the file so old entries stay easy to find.

### `spec/docs/#NNN-work.md`

- Keep the first section about context, goals, and chosen direction.
- Keep the later section about execution, if present, concrete and testable.
- Maintain consistent ids, filenames, and linked TODO items.

## Quick Editing Checks

Before saving, check:

1. Does each paragraph do one job?
2. Can any vague adjective be replaced with a fact?
3. Did any sentence announce structure instead of delivering content?
4. Are ids, file paths, and commands exact?
5. Did you leave any filler such as `TBD`, `later`, or `appropriate`?
6. Would each active `MEMORY.md` entry still help on another similar task, or should it move to archive instead?

If the answer to any check is yes, rewrite the line.
