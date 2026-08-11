# Release Work

Use this reference for versioning, packaging, deployment, publishing, tags, release branches, or other actions that create an external release state.

## 1. Recover The Release Contract

Read the repository's release docs, scripts, CI, version files, and recent release history. Determine:

- the requested target and action
- the artifact or remote state that will change
- the project's versioning and validation policy
- rollback or recovery cost

Do not infer a release target from branch count or invent a generic SemVer policy when the repository has its own contract.

## 2. Check Readiness

Inspect the relevant worktree, diff, dependencies, and credentials or permissions. Choose verification according to the changed surface and release risk; a full suite is required only when project policy or blast radius justifies it.

Build or inspect the distributable artifact when packaging can differ from the source tree. Check secrets, local paths, ignored files, generated outputs, and metadata on the actual distribution surface as relevant.

`scripts/ship_scan.py` is an optional diagnostic for absolute paths and junk candidates. Its scope and exit behavior do not make it a complete release, secret, or security gate; use it only when that narrow scan adds value.

Resolve blockers before creating external state. Ask the user only when the target, authority, or irreversible consequence remains materially ambiguous.

## 3. Execute The Authorized Action

When the user has requested a clear release action, complete it using the repository's normal tools. Keep version files, tags, package metadata, and release notes aligned when the project exposes them.

Do not silently add adjacent actions such as merging, tagging, pushing, publishing, or deploying when they were not part of the authorized goal.

## 4. Verify The Result

Inspect the actual outcome: artifact contents, package registry, deployment status, Git remote, tag, release page, or other authoritative external state.

Report:

- action and target
- verification performed and result
- resulting version, artifact, URL, or remote state when applicable
- any remaining limitation, rollback concern, or follow-up decision

Do not call a release complete based only on a successful local command when the requested outcome is external.

Before closing a GeiSpec-backed release, use Memo only when the release changed durable background, a cross-surface impact route, or a non-obvious operational lesson. Update the owning `OVERVIEW.md`, `IMPACTS.md`, or memory entry; keep release history in the repository's native changelog or release notes.
