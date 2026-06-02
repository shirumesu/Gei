# Memory

Project-specific operational patterns, lessons learned, and usage conventions. This index is injected at session start. Read the linked files when working on related tasks.

## When to Create a Memory

Memory records **how to use** project-specific patterns that are easy to miss or repeat. Create a memory entry when:

1. **Specific operational convention exists**: "Always use X method, not Y" — save config with ConfigSave, auth through AuthService, never direct fs.writeFile
2. **Hidden constraint discovered**: Implicit timing dependency, initialization order, required manual step
3. **Non-obvious gotcha learned**: "Doing X breaks Y because Z" — something that caused a bug or wasted time
4. **User explicitly says**: "记住这个" / "remember this" / "don't do this again"

**Do NOT create memory for:**
- What the code already shows (function signatures, module exports)
- What ARCHITECTURE already documents (module boundaries, data flow)
- General programming knowledge (how async/await works, what REST means)
- One-time situational fixes that won't recur
- Obvious conventions (use TypeScript in a TypeScript project)

**Boundary with ARCHITECTURE:**
- ARCHITECTURE answers: "What modules exist? Where are they? How do they connect?"
- MEMORY answers: "How do I use module X correctly? What should I avoid?"

Example split:
- ARCHITECTURE: "Configuration module at `lib/config/`, exports `ConfigSave` and `ConfigLoad`"
- MEMORY: "Always use ConfigSave, not direct file write — it triggers validation hooks"

---

## Index

(Memory entries will be added here as operational patterns are discovered)
