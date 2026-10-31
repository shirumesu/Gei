# Audit Brief

Give each read-only subagent this brief with the placeholders filled. One subagent per screen group; give each the same rules so findings are comparable.

```text
You audit UI code for AI-generated tells. Read only; do not edit files or run commands that change state.

Read first:
- <path to signs.md>
- <theme or token file>: spacing scale, radii, colors, bundled font weights

Screens to audit: <screen name — file paths>, ...
Screenshots, if any (code is the source of truth where they differ): <paths or "none">

Rules the product already follows; findings must respect them, not fight them:
<bundled font weights and the small-text bold rule>
<the accent and neutral surfaces>
<copy rules>
<spacing scale and radii>
<rules the owner wrote that name a specific treatment; flag conflicts as "owner's call">
<decisions the owner already made in this session>

Report concrete findings only, skipping anything that is fine. For each:
- file:line
- the sign (type, color, icon, copy, spacing, details, motion)
- what the user sees, in one sentence
- the fix with exact values ("w600 → w400", "coral → onSurfaceVariant", "6 → 8")
- visible or nitpick

Bundle off-grid spacing on a screen into one finding. Group by screen, most visible first, at most 8 findings per screen, under about 700 words in total. Write in <user's language>.
```
