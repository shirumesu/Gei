# Memory Entry Contract

A memory entry is one Markdown file under `spec/memory/` documenting one operational pattern or lesson learned.

## File name

- Lowercase kebab-case
- Describes the pattern: `config-save.md`, `auth-service.md`, `module-timing-dependency.md`

## Front matter

```yaml
---
name: {same-as-filename-without-extension}
description: One-line summary, used in MEMORY.md index
metadata:
  type: project | feedback | reference
---
```

## Body structure

- First paragraph: factual statement of what to do
- **Why:** section: context, when discovered, what problem it solves
- **How to apply:** section: concrete guidance
- Link related memories with `[[other-memory-name]]`

## Content principles

Write facts, not filler. Include diagnostic commands or reproducible tests when relevant. Be concise but complete.

**Good memory:**
```markdown
---
name: config-save
description: Always use ConfigSave method for all configuration persistence
metadata:
  type: project
---

When saving configuration changes, always use the `ConfigSave` method from `lib/config/save.ts`.

**Why:** Direct file writes bypass validation hooks that check config schema, notification to dependent modules, and the atomic write + backup mechanism. This caused data corruption in issue #42.

**How to apply:** Replace any `fs.writeFile` to config files with `ConfigSave(configKey, value)`. The method handles validation, backup, and notification automatically.
```

**Bad memory:**
```markdown
Be careful with configs. Use the right method.
```

## Examples

See existing memory entries for reference style. Claude's own memory system at `~/.claude/projects/{project}/memory/` uses a similar format with `type: user | feedback | project | reference`.

## Maintenance

- Update a memory when the pattern changes or is replaced
- Delete a memory when the code it references is removed
- Keep memories focused on one pattern each
