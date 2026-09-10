# Migrate Existing Knowledge

Migrate the current project's useful knowledge autonomously when upgrading or when a legacy route is encountered. For an existing legacy store without INDEX.md, workspace allocation links the old entry files from a new minimal index. Hooks never inject legacy bodies or judge their content.

## Path-Hash Stores

Before switching an existing installation to project names, use `resolveProject(cwd)` to find its canonical `specRoot` and matching `legacyRoots`. Startup reports a migration requirement while matching legacy directories remain, even when the named destination already exists; it does not silently choose one copy or overwrite either side. Legacy metadata from another OS is a discovery hint, not a local path to execute or bind.

Preserve a snapshot outside the active store. Reconcile useful content into `projects/<project-name>` using [merge](merge.md) for divergent copies and environment-specific claims. Keep INDEX compact and repair incoming links, including cross-project routes that contain the old directory name.

Once the content and links are verified, remove obsolete `project.json` metadata from the destination and move the old directories outside `projects`. Do not leave active aliases or duplicate stores. Restart the updated Hook and verify it reads the intended index. A project rename uses the same content/link checks. Do not migrate unrelated projects without scope to do so.

## Five-File And Group Stores

1. Inspect the old Overview and Memory index, then only the Architecture, Impacts, decisions, task records, or Group material needed to recover unique useful knowledge. Preserve current user agreements.
2. Write INDEX.md with concise background/agreements and topic routes. Fold overlapping architecture and impact claims into owning topics; move conditional decisions and pitfalls into their notes.
3. Check evidence, scope, and existing links. Keep meaningful cross-project knowledge through direct routes rather than rebuilding Groups. Convert shared MEMORY.md to context/INDEX.md and move useful shared notes to context/notes/; repair their routes.
4. Mark active handoffs explicitly. Stop routine internal Changelog maintenance; transfer only history that explains a still-useful decision.
5. Once each old source's unique content and incoming links are accounted for, remove obsolete files and empty scaffolding from active knowledge. Keep a verified migration snapshot outside the active store when needed; do not leave parallel old/current authorities. A project migration does not authorize rewriting unrelated projects. For an explicitly requested whole-store migration, establish the common layout first, migrate each project independently, then verify coverage and cross-project links before replacing old content.

A subdirectory's old standalone store is not automatically merged into the repository store: inspect it when it contains relevant prior work, then reconcile deliberately. Finish with the named directory layout above, without identity manifests.
