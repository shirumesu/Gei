# Changelog Contract

`spec/CHANGELOG.md` records recent verified outcomes and provides the internal basis for checkpoints and releases. It is not a live task plan.

Prefer the repository's public changelog, release notes, issues, or native planning system when those are the actual project contract.

## Shape

Keep an `## Unreleased` section for accepted entries awaiting a checkpoint or release. Group entries by the repository's existing categories; otherwise use a small conventional set such as `feat`, `fix`, `docs`, or `chore`.

Work appends one concise typed entry after completing and verifying a changelog-worthy change. This narrow append does not require loading Memo. Changelog-worthy work includes durable `feat`, `fix`, `perf`, meaningful `refactor`, public documentation, workflow, architecture, release, or rollback outcomes. Skip failed attempts, routine formatting, generated churn, and transient diagnostics.

An entry should state the durable outcome and why it matters. Do not include raw logs, commit inventories, internal reasoning, or routine verification detail.

At an explicit release or checkpoint:

1. choose the version or checkpoint name from project policy
2. move relevant `Unreleased` entries into that section
3. summarize the outcome without duplicating the entries
4. leave a fresh `Unreleased` section

## Boundaries

- Memo owns the contract, structure, version transitions, and compaction.
- Work owns only the single verified-outcome append described above.
- A task reference, session plan, and public changelog are separate interfaces; do not duplicate them without a real recovery or release need.
- Do not invent time or entry-count thresholds for compaction. Compact when retrieval or release preparation benefits.
- Verify entries against repository evidence and accepted decisions.

## Acceptance

- Every changelog-worthy verified outcome since the last release is represented once.
- Entries describe durable outcomes and use the project's versioning scheme.
- Released and unreleased work are not mixed.
- No hidden task lifecycle or duplicate tracker was introduced.
