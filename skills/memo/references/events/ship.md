# Release Or Checkpoint Documentation

Use this event when preparing internal release notes or a durable checkpoint.

1. Read the repository's release policy and `../contracts/changelog.md`.
2. Verify the shipped or checkpointed outcome against code, tests, artifacts, Git, or the authoritative external release state.
3. Reconcile verified outcomes since the previous release, then compress `## Unreleased` into the new version or checkpoint section and leave a fresh `## Unreleased`.
4. Audit `OVERVIEW.md` and `ARCHITECTURE.md` against the release state. Update stale cold-start facts, routing, module boundaries, data flow, or impact guidance.
5. Update memory only for a remaining non-obvious operational rule or project gotcha; remove entries made obsolete by the release.

Do not use Memo to perform the release action itself; Work owns release execution. Major architecture facts should normally be updated when they change rather than deferred until release; the ship pass is a reconciliation backstop.

Report the document changed, the outcome recorded, and any evidence gap that prevents an accurate record.
