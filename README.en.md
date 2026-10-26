<p align="center"><img width="160" src="assets/icon.png" alt="Gei icon" /></p>

# Gei ~ 芸

English | [简体中文](README.md)

Gei provides small task Skills for Codex and Claude Code, plus project knowledge stored outside the repository. Hooks inject compact background and retrieval routes. Agents read by domain and autonomously preserve conditional decisions, reusable pitfalls, and necessary handoffs. Projects need no new AGENTS.md or Spec directory.

## Skills

| Skill | Final objective |
| --- | --- |
| consider | Independently judge whether and how to build something and what the choice locks in: necessity, effort, blast radius, alternatives, debt, load-bearing capabilities, and a pre-mortem |
| memo | Maintain external background, domain routes, decisions, lessons, and handoffs |
| diagnose | Find the root cause before fixing a bug: get one command that reproduces the symptom, state the cause in one sentence, show the same command fail before and pass after the fix, and check for the same mistake elsewhere; adds no tests |
| inspect | Have a fresh subagent check a change against the user's own words: missing or wrong requirements, unrequested additions, and removable design; user-invoked only |

Gei keeps only what models do not do on their own or know but often skip: external project knowledge, proposal evaluation that resists simply extending the user's idea, reproduce-first debugging, and a request-fidelity review not shaped by the author's intent. Each asks for output that can be checked, not an attitude. Implementation, bug-finding review (`/code-review`, `/review`), and research are left to the model and host built-ins; personal coding preferences belong in user-level AGENTS.md/CLAUDE.md. Ordinary context reads need no Memo load.

## External Project Knowledge

Storage defaults to `~/.agents/geispec`; override with `GEI_SPEC_HOME`. Knowledge is organized by project name without identity metadata. Session start only reads; the first durable `spec_edit` creates `INDEX.md` and any other files as useful knowledge is earned:

```text
projects/<project-name>/
  INDEX.md
  topics/<domain>/
    README.md
    notes/<decision-or-pitfall>.md
  tasks/<task>.md
context/
  INDEX.md
  notes/<cross-project-lesson>.md
```

- **INDEX**: short background, confirmed working agreements, and business-term routes to domains; the startup entry point.
- **Topic**: domain terms, ownership, consequential constraints, and routes to code, tests, native docs, and relevant notes.
- **Note**: conclusion/status, applicability, actual tradeoffs or verified cause, reconsideration conditions, and evidence. One owner per fact; other locations keep retrieval cues only.
- **Task**: accepted work requiring cross-session recovery; remove active routes when complete.
- **Context**: only lessons whose conditions apply across unrelated projects. Project scope remains the default.

Follow the Hook-injected INDEX directly to the matching domain, then relevant notes or code; no preliminary INDEX tool read is needed. Read INDEX only when its content is missing, clipped, needs refreshing, or an index edit needs a revision. Search by business concepts, symptoms, and evaluation criteria. Expand only for concrete dependencies; search project evidence when knowledge is absent. Split a large domain by responsibility rather than keeping a corpus-wide inventory.

When old A/B reasoning informs C/D, check whether priorities and constraints still hold and explain material differences. Distinguish user confirmation, agent inference, accepted unimplemented targets, and verified implementation.

## Autonomous Maintenance

When work establishes reliable background, an accepted consequential decision, a verified reusable pitfall, stale knowledge/routes, or necessary handoff, the agent writes the external update within the task without asking separately whether to remember it. Host filesystem permissions still apply.

Routine changes require neither a note nor an internal Changelog or whole-store audit. Link existing authorities and add only knowledge that changes understanding or decisions. See [Memo](skills/memo/SKILL.md).

Each knowledge document remains one Markdown file. Except for `INDEX.md`, `spec_edit` requires YAML frontmatter with `type` (`facts`, `decisions`, `runbooks`, `log`, or `tasks`) and a one-line `description`. `tasks` also requires `status` (`todo`, `doing`, `blocked`, or `done`). `sources` remains an optional list of checkout-relative paths. Write these fields with ordinary create/replace. create rejects a similar title, description, or path in the same project and returns the existing paths. Reads start at line 1 and line numbers stay physical. There is no separate lifecycle field.

`spec_check` returns a bounded worklist of broken references, duplicate prose, and source drift (a listed source's last git commit is newer than the document, or the source path is missing). Age and an empty list never delete knowledge. See [knowledge maintenance](docs/maintenance.md) for the signals and deletion recovery.

## Hooks And Reading Budgets

Two independent SessionStart Hooks supply project context and shared conditions without writing knowledge. When a project has no INDEX, the Hook only says to create one on the first durable write, so scratch directories leave no empty projects. Hooks do not depend on execution order. Topic bodies, notes, and history remain on demand; users need not author AGENTS.md.

### Post-Session Maintenance

On by default. During a session, Hooks only record each user prompt and the agent's final reply per turn (tens of milliseconds, no output, never an extra turn). When the session ends, stays idle for 15 minutes, or grows long, a Hook starts a detached worker. It runs the current host headless (`claude -p` / `codex exec`) with the session's model and reviews the whole session by the Memo standard: it judges final outcomes, records user corrections and working preferences, and completes due maintenance checks. The in-session agent writes knowledge only on explicit request. Unfinished work is retried at the next SessionStart, which also shows a one-line summary of background writes.

The design follows the mem0 and OpenViking Claude Code/Codex plugins: record Hook input instead of parsing host transcripts, queue files plus a detached worker, and catch-up at startup. Run `spec background off` to return to in-session maintenance. Records and logs live under `memo/` in the Spec state directory and are deleted after processing; `hooks/memo_worker.mjs --status` shows the queue and `--session ID --dry-run` shows what would be sent.

Complete outputs are capped at 4 KiB for workspace context, and 1.5 KiB for shared conditions. Project/Shared INDEX bodies allow at most 3/1 KiB, with paths counted against the whole-output budget. Limits measure UTF-8 bytes, preserve complete lines, and identify clipped sources. Splitting Hooks does not authorize injecting the whole knowledge store.

Ordinary Git repositories, subdirectories, and linked worktrees use the main repository directory name. Separate Git metadata and bare repositories use the common Git directory name; nested repositories and non-Git directories resolve their own names. Names are normalized to lowercase and portable characters; see [storage](skills/memo/references/storage.md) for the complete rule. Equal names intentionally share knowledge. Give unrelated projects different names. Moving a checkout requires no configuration; renaming it requires updating the knowledge directory and incoming links.

Local use needs no account. Optionally connect a private GitHub knowledge repository: matching project names and the same repository binding let tools read and save remote knowledge without a separate agent push. Hooks use versioned INDEX caches, briefly check expired entries, and label offline cache use. Preserve platform and branch conditions when sharing observations across machines.

## Spec Tools And Controls

The plugin bundles a local stdio MCP server; no hosted server is needed. `spec_read`, `spec_search`, `spec_edit`, and `spec_status` access either backend. Edits support exact text replacement and multi-file batches with base-revision checks to prevent concurrent overwrites. Markdown and its directory structure remain unchanged. Use the tools for active maintenance instead of directly editing the shared directory or running independent Git synchronization.

```shell
node <gei>/bin/gei.mjs spec status
node <gei>/bin/gei.mjs spec disable
node <gei>/bin/gei.mjs spec enable
node <gei>/bin/gei.mjs spec connect github --repo owner/private-knowledge
node <gei>/bin/gei.mjs spec use local
```

Connect and switch commands preview first; add `--apply` to execute. Add `--create` to create a private repository. Switching to local backs up previous local content. Disabling Spec retains data and other Skills. GitHub mode can read cached documents offline but never creates a writable local fork or upload queue. See [usage](docs/spec.md) for authentication, bindings, complete refresh, and the Skills-only CLI, and [tool design](docs/spec-tools.md) for interface evidence. Installation does not add a global `gei` command.

Before upgrading a path-hash store, [migrate](skills/memo/references/migrate.md) its content into named directories and repair links. Hooks report matching legacy copies for migration, preserving their files rather than silently allocating empty knowledge or choosing one machine's version.

When a legacy store has no INDEX, the Hook lists its old entry files without creating an index. Agents follow [migration guidance](skills/memo/references/migrate.md), then remove obsolete files and placeholders from active knowledge. Keep any required migration snapshot outside the active store.

## Installation

Ask an agent to fetch and execute the [installation guide](docs/install.md):

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

Alternatively install and enable Gei through the host's plugin marketplace. Hosts using only the [Skills archive](https://github.com/shirumesu/gei/releases/latest) can invoke Skills but do not receive plugin Hook injection automatically. Installation does not alter AGENTS.md, CLAUDE.md, or unrelated settings.

## Release History

Public release history lives in [CHANGELOG.md](CHANGELOG.md).

## Acknowledgments

References: [superpowers](https://github.com/obra/superpowers), [gstack](https://github.com/garrytan/gstack), [Waza](https://github.com/tw93/waza).
