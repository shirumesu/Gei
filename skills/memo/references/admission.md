# What To Record

Record a statement only when it will change a later action, and code, git, or docs do not already contain it. Update the existing owner. No write is a successful outcome.

User-requested documentation stays the deliverable. This gate does not withhold it.

## facts

Record the environment, who owns an account, an external limit, and a pitfall that was hit.

Do not record a fact that grep can recover from code. Do not record temporary state. Do not record process.

These are temporary state or process, not knowledge:

- git push or sync status (pushed or not)
- ahead/behind `origin` or other branch-tracking status
- Unreleased used as a living source-status field ("still Unreleased", "not released yet")
- local checkout has X / remote lacks X (or the reverse) as a standing fact
- whether an installed or plugin-cache copy has been upgraded

Keep a mechanism note about release tooling when it changes how agents ship. A CHANGELOG Unreleased extraction trap is tool behavior. It is not a "source is still Unreleased" status field.

## decisions

Record the situation, why the choice was made, how to apply it, and what not to do.

Do not record the discussion. A rejected option is one line: `rejected X because Y`. Write that line in the document's language. Do not invent discarded alternatives.

Provenance, reversal, and scope of a preference: [notes](notes.md).

## runbooks

Record a repeated operation whose steps are not obvious.

Do not record a one-off. Do not record a step that `--help` explains. Do not record standard git or pull-request flow.

## tasks

Record work that is in progress or still to do. Include acceptance criteria and `status` (`todo`, `doing`, or `blocked`).

When the work is done, copy conclusions that still change future behavior into a decision or a fact. Then delete the task in the same `spec_edit` batch. Do not set `status: done` and leave the file. Do not move the task into `log`.

`status: done` remains a valid field so an old file still opens. The catalog lists a task only while the file exists. Do not use `done` as the completion step.

A final answer, a git commit, or a quiet period does not prove the work is done. Uncertain work stays `doing` or `blocked`.

## log

A log is scratch. On a weekly tidy, distill statements that still change future behavior into facts or decisions, then delete the log. Do not file a finished task here.

## Never record

- secrets or credentials
- chit-chat
- content already clear in a pull request or commit
- a one-off verification result
- restated general knowledge

## description

`description` is one sentence. It says what the document covers and when to read it. INDEX copies this sentence onto the catalog line. Write it so a later agent can decide whether to open the file.
