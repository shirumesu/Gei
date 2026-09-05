# Migrate Existing Knowledge

Migrate the current project's useful knowledge autonomously when upgrading or when a legacy route is encountered. For an existing legacy store without INDEX.md, workspace allocation links the old entry files from a new minimal index. Hooks never inject legacy bodies or judge their content.

1. Inspect the old Overview and Memory index, then only the Architecture, Impacts, decisions, task records, or Group material needed to recover unique useful knowledge. Preserve current user agreements.
2. Write INDEX.md with concise background/agreements and topic routes. Fold overlapping architecture and impact claims into owning topics; move conditional decisions and pitfalls into their notes.
3. Check evidence, scope, and existing links. Keep meaningful cross-project knowledge through direct routes rather than rebuilding Groups. Convert shared MEMORY.md to context/INDEX.md and move useful shared notes to context/notes/; repair their routes.
4. Mark active handoffs explicitly. Stop routine internal Changelog maintenance; transfer only history that explains a still-useful decision.
5. Once each old source's unique content and incoming links are accounted for, remove obsolete files and empty scaffolding from active knowledge. Keep a verified migration snapshot outside the active store when needed; do not leave parallel old/current authorities. A project migration does not authorize rewriting unrelated projects. For an explicitly requested whole-store migration, establish the common layout first, migrate each project independently, then verify coverage and cross-project links before replacing old content.

Existing project.json ids may remain. Upgrade metadata to schemaVersion 3 when maintaining it; use the resolved repository root/common Git directory. A subdirectory's old standalone store is not automatically merged into the repository store: inspect it when it contains relevant prior work, then reconcile deliberately.
