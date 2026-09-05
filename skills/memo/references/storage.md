# External Storage

Use `~/.agents/geispec`, overridden by `GEI_SPEC_HOME`. All Gei knowledge stays outside the source repository; do not add AGENTS.md, local spec folders, or ignore rules for it.

The Hook supplies the resolved checkout, knowledge directory, shared directory, and proposed metadata when absent. Its discovery is read-only. On the first evidence-backed write, create that `project.json` and a useful `INDEX.md` together. Create topic/note/task directories only with real content. Bootstrap autonomously once the current task establishes reliable purpose or agreements; leave unknowns out.

Project metadata uses schemaVersion 3, id, name, root, optional gitCommonDir, and optional aliases. Git subdirectories and linked worktrees use one identity derived from the common Git directory (the main root for a normal .git directory). Existing root-based ids remain valid. Non-Git directories use their exact root until metadata identifies a containing project. Nested Git repositories remain distinct.

For a moved project, update the existing manifest root/gitCommonDir and any intended aliases rather than copying the knowledge store. Shared worktree knowledge must not turn branch-specific observations into universal current facts; include a revision when it matters and check the active checkout.

Without a Hook, locate the configured store and match project.json roots/aliases to the current repository; read only manifests, not every project's documents. If the plugin runtime is available, call its exported `resolveProject(cwd)` from `hooks/knowledge.mjs` for the same result. In a skills-only installation, a new unique project directory may use a descriptive id matching its basename and a manifest with the repository root; Hook discovery can later match this metadata. Automatic injection requires the plugin Hooks.

Promote a note to Shared Context only when the reason and conditions apply across unrelated projects. Move the owner and repair links rather than duplicating it. Keep project relations as direct external topic links; a Group manifest is unnecessary.

If filesystem permissions block a write, use the host's normal approval mechanism. Semantic maintenance is already authorized; do not ask the user to reconfirm the content.
