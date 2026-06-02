# Event: Memory Write

## Trigger

Use this event when:

- During work/consider/memo execution, a pattern worth remembering is discovered
- User explicitly says "记住这个" or "remember this"
- Same issue encountered for the second time

## Required Reading

1. This file
2. `contracts/memory.md` — memory entry format

## Actions

1. Check: does this fit memory criteria in `spec/MEMORY.md`?
   - Specific operational convention? Hidden constraint? Non-obvious gotcha? User request?
   - NOT: code-evident facts, general knowledge, one-time situations, ARCHITECTURE content
2. If yes, create `spec/memory/{name}.md` following the memory contract
3. Append one line to `spec/MEMORY.md` index under the appropriate section:
   ```markdown
   - [{Title}](memory/{name}.md) — {short description}
   ```
4. Do NOT read other memory files unless directly related

## When NOT to Create Memory

- The pattern is already documented in ARCHITECTURE (module boundaries, data flow)
- The code itself makes the pattern obvious (exported function signatures)
- It's general programming knowledge unrelated to this project
- It's a one-time fix that won't recur
- It's an obvious convention (use the project's primary language)

## Boundary with ARCHITECTURE

- **ARCHITECTURE** documents: "What modules exist? Where are they? How do they connect?"
- **MEMORY** documents: "How do I use module X correctly? What should I avoid?"

If unsure, err on the side of not creating a memory. Only record patterns that are genuinely easy to miss or repeat.

## Self-Check

Before writing a memory entry:

1. Would this pattern be missed by reading the code alone?
2. Could this mistake realistically happen again?
3. Is this project-specific, or general knowledge?
4. Is this already in ARCHITECTURE or code comments?

Only proceed if answers are: yes, yes, project-specific, no.
