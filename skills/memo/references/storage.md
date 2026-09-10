# External Storage

Use `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. All Gei knowledge stays outside the source repository; do not add AGENTS.md, local spec folders, or ignore rules for it.

The workspace Hook supplies the resolved checkout and knowledge directory, creating only a missing `INDEX.md` on session start. This allocation does not invent project knowledge. Enrich the index autonomously when the task establishes reliable purpose or agreements. Create topic/note/task directories only with real content. Shared Context has its own read-only Hook.

Knowledge lives in `projects/<project-name>`. The name comes from the main repository root for ordinary Git repositories and linked worktrees, the common Git directory for separate metadata or bare repositories, and the exact directory for non-Git workspaces. Nested repositories resolve their own names. Filesystem links resolve to their targets. Names use Unicode NFKC, lowercase, whitespace converted to hyphens, remaining characters outside Unicode letters/numbers/dot/underscore/hyphen replaced with hyphens, and leading/trailing punctuation trimmed; an empty result becomes `project`.

Equal normalized names intentionally share knowledge across machines and clones. Keep names consistent across machines; give unrelated projects different names. Moving a checkout without changing its name needs no update; renaming a project also requires renaming its knowledge directory and repairing incoming links. No UUID, path hash, `project.json`, or per-machine binding is needed. Legacy manifests are consulted only to discover knowledge that needs [migration](migrate.md); they no longer control identity.

The external store can be a separate private Git repository. Pulling its content makes it available to matching project names without path configuration; code and knowledge repositories still require their own synchronization. Hooks do not fetch, commit, or push. Shared knowledge must not turn branch- or environment-specific observations into universal facts; include the relevant platform/revision and check the active checkout.

Without a Hook, locate the configured store and derive the same project name. If the plugin runtime is available, call its exported `resolveProject(cwd)` from `hooks/knowledge.mjs`; its `legacyRoots` list identifies prior stores to reconcile before writing. In a skills-only installation, create the named directory and index only as needed. Automatic injection requires the plugin Hooks.

Promote a note to Shared Context only when the reason and conditions apply across unrelated projects. Move the owner and repair links rather than duplicating it. Keep project relations as direct external topic links; a Group manifest is unnecessary.

If filesystem permissions block a write, use the host's normal approval mechanism. Semantic maintenance is already authorized; do not ask the user to reconfirm the content.
