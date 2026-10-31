---
name: deslop
description: "Polish the UI of an existing product that already has a design language: audit its screens for AI-generated tells (heavy weights on small text, decorative color, sparkle icons, repeated status, off-grid spacing), let the user pick fixes item by item, then apply only the picks and update the design docs. Use when the user asks to deslop, unslop, polish, or clean up screens of their own app; not for a from-scratch redesign or a marketing page."
---

# Deslop

Adapted from [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0. This version narrows it to products that already have a design language and replaces its single direction step with a per-item audit the user decides. Keep this credit in copies and adaptations.

A product that already has a theme, a font, and a page structure rarely needs a redesign. What makes it read as generated is a layer of small habits: every label bold, every icon its own color, the same status written three times, spacing typed by feel. Remove that layer and keep everything the owner chose. Richness belongs to content (covers, charts, real data); the chrome around it stays quiet.

## What Survives Contact with an Owner

These came from a full pass over a shipped app; the owner accepted or declined each item.

Usually accepted:
- Weight discipline: bold only for titles and section headings; small text (≤12px, and any CJK at that size) never bold; hierarchy from size and color.
- Repeated information removed: a status the group heading already states, a counter that repeats a rank, a badge that repeats a switch, a default state written out.
- Section-title icons in the secondary text color instead of one hue each; sparkle and decorative icons replaced with plain ones.
- Meaningless color in chrome made neutral: status dots on every healthy row, source labels colored like statuses, a filter chip with its own hue.
- Contrast fixes: accent colors (gold, coral) used as small text on light surfaces moved to a deeper ink of the same hue.
- Spacing and radii snapped to the existing scale; sibling cards share one padding and one radius.
- Seams between chrome regions smoothed (a sidebar that fades into the page on one edge but meets the title bar with a hard line).
- Icon-only buttons where the label repeats the icon and a tooltip can carry it.

Usually declined:
- Anything that contradicts a rule the owner wrote down (colored tags as brand vitality, a ✦ the spec asks for, playful random placeholder lines). Raise it once as "owner's call", default to keep, never recommend it.
- Removing a cue that reads instantly (rating stars) for theoretical purity.
- Replacing a selection treatment the owner likes with a different one. When a state is too loud, make the same treatment lighter first.
- Re-mapping the whole palette so "each accent means one thing" when only one part (icons) bothered the owner.
- Copy rewrites on pages whose wording the owner tuned; propose them, expect half to be declined.

## Run It

1. **Read the rules first.** The project's design docs, theme tokens, and memory outrank this skill. Note the bundled font weights (a font shipped with only 400 and 700 renders w500 as 400 and w600–w900 as 700), the spacing scale, radii, and any rule that names a specific treatment. Code is the source of truth where docs disagree.
2. **Look.** Render or screenshot the screens only if the user allows driving their screen; otherwise use screenshots in the repo plus the code. Do not build or launch over an instance the user is running.
3. **Audit.** Check every screen in scope against [signs.md](references/signs.md). Each finding: file:line, what the user sees in one sentence, the fix with exact values, visible or nitpick, and a recommendation (adopt / owner's call). Bundle all off-grid spacing on a page into one item. For more than two or three screens, spawn one read-only subagent per screen group with the [audit brief](references/audit-brief.md), then open the cited lines of every visible finding yourself before presenting; drop what the code contradicts.
4. **Let the user pick.** Present findings grouped by screen, each with adopt / leave / discuss. Where the host can publish a page, make it a pick list with a copy-out summary and tiny before/after strips for visible items; otherwise a numbered list. For the first screen of a project, or a change the owner must see to judge, build a mockup from the real tokens, the real font (subset it if it is large), and real content, with a before/after switch and numbered markers tied to the change list. Mark items that touch a shared component with what else changes. Wait for the picks; picks are per item and do not generalize.
5. **Apply only the picks.** Keep fields, page structure, and action positions. Split the work by file ownership, one writer per file, when parallelizing. Preserve the user's uncommitted work in touched files.
6. **Check once.** Run the analyzer or type check once, read the diff, and fix leftovers that contradict a pick (a status made neutral whose reason text is still colored, a sibling cell left at the old size).
7. **Record.** Update the design docs to the new rules in the same pass. Changelog and commit follow the project's conventions, after the user confirms the result.

## Gotchas

- An audit run from code alone misses visual seams; ask the user to glance at chrome edges after the first pass.
- Lighter beats different: a user who calls a highlight too loud usually wants it softer, not replaced.
- When an item is half-adopted (icons yes, palette no), apply only the half and say so in the docs.
- Items the user defers ("later") stay on your list; mention them at wrap-up instead of dropping them.
