# Signs

Each line pairs a sign with its usual fix. Values are defaults; the project's own scale wins. Adapted from unslop's signs list (Damir Sokolovsky, CC BY 4.0), filtered to what applies to an existing product.

## Type

- Bold on small text, especially CJK at 12px or less: strokes clot and mixed with Latin it looks like a second font → regular; let size and color carry hierarchy. Short number or Latin-only badges may stay bold.
- w500/w600/w800 in code when the bundled font has only 400 and 700 → write the weight that actually renders (400 or 700) so code and screen agree.
- The selected item of a list, tab, or segmented control turns bold, so its width jumps → keep the weight; the fill or thumb marks selection.
- Several sizes for one role (13 on one page, 12.5 on another) → snap to the scale.
- Uppercase English labels in a non-English UI (a season written `2026 FALL`) → the UI language.
- Numbers that line up (times, sizes, counts) without tabular figures → tabular figures.

## Color

- Section-title icons each in a different accent → secondary text color.
- A status dot or badge on every healthy row, repeating a switch or the default → only exceptions get color; keep the space so names align.
- Source, platform, or type labels in the same hue as a status → neutral, so they cannot be read as a state.
- One filter chip or control with its own selected color → theme default.
- Accent used as small text on a light surface (gold, coral, sky) under 4.5:1 → a deeper ink of the same hue.
- Hard-coded colors tuned for one theme (a darkened gold that vanishes on dark) → a theme role.
- An accent brought into a surface that is deliberately neutral (brand green on a dark video overlay) → that surface's own ink.
- A selected state that outshines the content → the same treatment, lighter.
- Several hues on tags with no meaning → neutral, unless the owner's rules assign color to them; then it is the owner's call.

## Icons

- Sparkle icons (✦, auto_awesome) on anything AI, new, or "today" → a plain icon that says what it is, or none.
- Icons in many sizes on one page → one size inside buttons, one for inline icon buttons.
- Mixed icon families (rounded next to outlined) → the family the page already uses.
- An icon plus a label that repeats it, in a tight header → icon only with a tooltip that carries the label and its states.

## Copy

- The same fact stated two or three times on one screen (rank in the badge and in a counter, "cached" in the group, the item, and each row) → keep the one nearest where it is needed.
- Default states written out ("completed" on every finished row, "enabled" on every healthy source) → show only exceptions.
- Metadata strung with " · " → separate elements, or two spaces where a single line is required.
- Trailing periods on one-sentence hints and labels; exclamation marks → none.
- Vague prompts ("click to log in") → name what happens ("Log in to Bangumi").

## Spacing and Details

- Values off the scale (6, 10, 14, 18, 22 on a 4px grid) → nearest step; 2px nudges inside small controls are fine.
- Sibling panels with different paddings → the panel default; keep a deliberately tighter side (a header ending in a button) and say so.
- Sibling overlays or cards in one row with different radii or materials → one radius and one material for the row; small menus may stay smaller.
- Inner radius larger than outer minus padding → nested radius.
- A hard edge where two chrome regions meet while the other edges fade → the same fade on that edge.
- A dead band under one column while the neighbor runs to the bottom → let the content fill it (bigger items, a fitted height), not a new block.

## Motion

- Looping or decorative animation on something that is not live → static.
- Animated layout properties (width, height, top) → transform and opacity.
- Purposeful feedback (hover lift on posters, gesture hints on media buttons) → keep.
