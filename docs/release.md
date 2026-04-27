# Release

Gei uses a semi-automatic release flow.

## Version Bump Policy

The release workflow reads commit messages since the latest `v*` tag and chooses the highest required bump:

| Prefix or marker | Version impact |
| --- | --- |
| `feat` | patch |
| `fix` | patch |
| `perf` | patch |
| `minor` | minor |
| `major` | major |
| `Release-As: minor` in the commit body | minor |
| `Release-As: major` in the commit body | major |
| `Release-As: patch` in the commit body | patch |
| `docs` | no release by default |
| `chore` | no release by default |
| `test` | no release by default |
| `ci` | no release by default |
| `build` | no release by default |
| `refactor` | no release by default |
| `style` | no release by default |

Use `!` after the prefix or include `BREAKING CHANGE:` in the commit body to request a major release.

Gei intentionally treats normal `feat` commits as patch releases. Many skill changes add a small capability without changing the project-level feature set enough to justify a minor version.

Examples:

```text
feat: add release routing
fix: handle missing changelog entry
minor: add a new public skill
feat!: change skill archive layout
```

## Release Notes

The public source of release notes is `CHANGELOG.md`.

When a matching `## vX.Y.Z` entry exists, the workflow uses that entry for the GitHub Release.

When the changelog is missing or has no matching entry, the workflow generates default notes from commits since the previous tag and groups them by prefix.

## Push Flow

1. Commit changes using conventional prefixes.
2. Push `main`.
3. The workflow computes the next version from commits since the previous tag.
4. If no commit requires a release, the workflow exits without creating a tag.
5. If a release is needed, the workflow creates `vX.Y.Z`, builds `Gei.zip`, and creates the GitHub Release.

Manual tag pushes are still supported. In that case, the workflow packages and publishes the pushed tag.
