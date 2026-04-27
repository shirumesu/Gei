# Changelog

This file records public release notes for Gei.

## v0.2.2 - 2026-04-25

### Changed

- Refactored `Work\script\ship_scan` into a more maintainable structure, improved performance, reduced false positives, fixed display issues, and added `skills/work/scripts/README.md`.

### Fixed

- Updated `using-gei` so its description makes it clearer that it must be loaded before other Gei skills.

## v0.2.1 - 2026-04-23

### Changed

- Refined `consider` so it stops more clearly at the design stage before implementation.
- Split `memo` into event references and document contracts so the entry file only routes the current event.

### Fixed

- Improved `using-gei` routing so it distinguishes the user's final goal from supporting actions.
- Restored `see` in the full installation example.
- Updated `work` so spec document ownership stays with `memo`.

### Docs

- Added `consider/references/read-spec.md`.
- Completed the `v0.2.1` release notes.

## v0.2.0 - 2026-04-23

### Added

- Added `using-gei` as the top-level router for `design`, `consider`, `memo`, and `work`.
- Added `see` for comparison, fact-checking, topic exploration, how-to research, public-opinion sampling, and multi-source summaries.
- Added `see` tool guidance and a local health check script.
- Added an explicit archive path to `memo`.

### Changed

- Renamed `kickoff` to `consider`.
- Changed `work` into a router with separate lightweight and spec-driven execution flows.

### Fixed

- Fixed `memo` writing behavior for work files.
- Reduced false positives in the `work` ship check.

### Docs

- Updated installation guidance for `using-gei` and selective skill installation.

## v0.1.0 - 2026-04-21

### Added

- Published the first public release with `consider`, `memo`, `work`, and `design`.
- Added fetchable installation documentation at `docs/install.md`.
- Added tag-triggered GitHub Release packaging for `Gei.zip`.

### Docs

- Fixed the install entry to use the real remote `main` branch.

## v0.0.3 - 2026-04-21

### Added

- Added the tag-triggered GitHub Release workflow.
- Added `docs/install.md`.

### Docs

- Completed README installation guidance for installing multiple skills.

## v0.0.2 - 2026-04-21

### Added

- Added the `work` skill with execution, review, and ship gates.

## v0.0.1 - 2026-04-21

### Added

- Initialized the `spec/` system.
- Added the initial `consider` and `memo` project context.
