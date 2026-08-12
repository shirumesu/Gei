# Changelog

`CHANGELOG.md` is the Project's concise history of verified, durable outcomes. It keeps recent changes visible across sessions and provides the internal basis for release or checkpoint notes. It is not a live task plan, session transcript, commit inventory, or replacement for the repository's public release notes.

## Unreleased

Keep `## Unreleased` first. Add one user- or maintainer-meaningful outcome after the change is complete and verified. Use the project's established categories; otherwise use the conventional headings `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`, creating only headings that have entries.

An entry should say what durable behavior changed and why it matters. Skip failed attempts, routine formatting, generated churn, raw verification logs, and facts already captured more clearly by a linked native changelog. When a repository-native changelog is authoritative, keep the GeiSpec entry focused on agent-relevant architecture, workflow, or recovery context and link outward instead of duplicating release prose.

Work may perform this one narrow append without loading the rest of Memo. Memo owns structure, correction, compaction, and release/checkpoint transitions.

## Releases And Checkpoints

For an explicit release or checkpoint:

1. verify the included outcomes against repository or release evidence
2. move the relevant Unreleased entries under `## <version-or-checkpoint> - YYYY-MM-DD`
3. keep the conventional categories that contain entries
4. leave a fresh `## Unreleased` section
5. reconcile `OVERVIEW.md` and `ARCHITECTURE.md` only where the release made them stale

Do not invent versions or dates. Preserve the repository's versioning and release policy when one exists.
