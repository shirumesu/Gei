# Migrate Existing Knowledge

Migrate the current project's useful knowledge autonomously when upgrading or when a legacy route is encountered. Hooks list legacy files only when INDEX.md is absent; they do not inject old content, rewrite files, or judge decisions.

1. Inspect the old Overview and Memory index, then only the Architecture, Impacts, decisions, task records, or Group material needed to recover unique useful knowledge. Preserve current user agreements.
2. Write INDEX.md with concise background/agreements and topic routes. Fold overlapping architecture and impact claims into owning topics; move conditional decisions and pitfalls into their notes.
3. Check evidence, scope, and existing links. Keep meaningful cross-project knowledge through direct routes rather than rebuilding Groups. Convert shared MEMORY.md to a small context/INDEX.md when relevant; unique original notes can remain linked until moved.
4. Mark active handoffs explicitly. Stop routine internal Changelog maintenance; transfer only history that explains a still-useful decision.
5. Once each old source's unique content and incoming links are accounted for, remove it or retain it as clearly non-current history. Never bulk-delete an unreviewed store. Migration does not authorize rewriting every other project's knowledge.

Existing project.json ids may remain. Upgrade metadata to schemaVersion 3 when maintaining it; use the resolved repository root/common Git directory. A subdirectory's old standalone store is not automatically merged into the repository store: inspect it when it contains relevant prior work, then reconcile deliberately.
