# External Storage

Use `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. All Gei knowledge stays outside the source repository. Do not add AGENTS.md, local spec folders, or ignore rules for it.

The workspace Hook supplies the resolved checkout and project index, and never writes. Creating `INDEX.md`, and the ban on an empty index, are in [Memo Shape](../SKILL.md). Catalog rewrite and header markers: [topics](topics.md). Edit the header when the task establishes reliable purpose or agreements. Create topic, note, or task directories only with real content. Shared Context has its own read-only Hook and its own generated `context/INDEX.md`.

Knowledge lives in `projects/<project-name>`. The name comes from the main repository root for ordinary Git repositories and linked worktrees, the common Git directory for separate metadata or bare repositories, and the exact directory for non-Git workspaces. Nested repositories resolve their own names. Filesystem links resolve to their targets. Names use Unicode NFKC, lowercase, whitespace converted to hyphens, remaining characters outside Unicode letters/numbers/dot/underscore/hyphen replaced with hyphens, and leading/trailing punctuation trimmed. An empty result becomes `project`.

Equal normalized names intentionally share knowledge across machines and clones. Keep names consistent across machines. Give unrelated projects different names. Moving a checkout without changing its name needs no update. Renaming a project also requires renaming its knowledge directory and repairing incoming links. No UUID, path hash, `project.json`, or per-machine binding is needed. Legacy manifests are consulted only to discover knowledge that needs [migration](migrate.md). They no longer control identity.

Local storage is the default. Users can connect a private GitHub knowledge repository through the bundled CLI. Tools then read and commit remotely while Hooks use versioned INDEX caches. User configuration selects the repository once, and normalized project names select its knowledge paths. No separate agent push is required. Settings and cache live outside knowledge under `~/.agents/gei-state`, overridden by `GEI_SPEC_STATE`. See [tool access](tools.md) for setup or fallback. Shared knowledge must not turn branch- or environment-specific observations into universal facts. Include the relevant platform or revision and check the active checkout.

Without a Hook, locate the configured store and derive the same project name. If the plugin runtime is available, call its exported `resolveProject(cwd)` from `hooks/knowledge.mjs`. Its `legacyRoots` list identifies prior stores to reconcile before writing. In a skills-only installation, create the named directory and index only as needed. Automatic injection requires the plugin Hooks.

Promote a note to Shared Context only when the reason and conditions apply across unrelated projects. Move the owner and repair links rather than duplicating it. Keep project relations as direct external topic links. A Group manifest is unnecessary.

If filesystem permissions block a write, use the host's normal approval mechanism. Semantic maintenance is already authorized. Do not ask the user to reconfirm the content.
