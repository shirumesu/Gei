# Topics And Retrieval

INDEX has a short hand-written header and a generated catalog. The header holds purpose and only recurring project-specific working agreements, in the project's own vocabulary. The catalog is one line per valid document, `[title](relative path): description`, grouped by `type` in the order `facts`, `decisions`, `runbooks`, `log`, `tasks`. `spec_edit` rewrites that block in the same save as the document change. The user need not maintain AGENTS.md. Existing user or repository instructions still govern; do not copy generic host instructions here.

Keep the hand-written header small. Separate Hooks cap the comment-stripped index bodies at 3 KiB (project) and 1 KiB (shared), with whole-output limits of 4 KiB and 1.5 KiB including paths. Maintenance targets remain below 2 KiB and 768 bytes. These are UTF-8 byte budgets, not measured token counts. Injection keeps complete lines and names the clipped source. The stored catalog still lists every valid document. Merge or delete documents to shorten a clipped catalog; do not hand-prune generated lines. Keep the header and each catalog line on short complete lines.

A topic page should answer: which business terms belong here, what this domain owns, what constraints could change the solution, and where the evidence lives. Reuse native documentation by linking to it. External summaries earn space only when they resolve actual ambiguity or expensive repeated exploration.

## Read Path

1. Match the request's business terms or tradeoff dimensions to the INDEX routes already in context; follow their links without a preliminary INDEX tool read. If the index is missing (including after compaction), clipped, or needs refreshing, retrieve the needed content through `spec_read`.
2. Read the matching topic page and only relevant note summaries, source, tests, or native docs.
3. Search within the topic using terms, symptoms, alternatives and selection criteria when no direct route matches. Listings and extracted previews help choose bodies to read; they are not verified summaries. A missing description means no extractable opening prose, not absent knowledge; truncation leaves omitted content unknown. Read before repairing either. Continue a listing only when the requested scope needs it, rather than reading the full notes corpus.
4. Expand only for a concrete dependency or missing owner; use repository search when knowledge is absent.
5. Stop when scope, constraints, important unknowns, and verification are clear.

A long topic should shed redundant and retired content before splitting. Split only when the remaining responsibilities benefit from selective reading; do not prebuild taxonomy, a central chronological list, generated per-module skills, embeddings, or a knowledge graph. The INDEX catalog is the one generated list, and it is one line per document rather than a copy of the body.

## Write Path

A valid document is listed from its `description` in the owning INDEX, under the heading for its `type`, in the order `facts`, `decisions`, `runbooks`, `log`, `tasks`. A topic README uses `type: facts` and a one-line description; the [facts example](../templates/facts.md) is the shape, including its short Routes block. `INDEX.md` does not use that frontmatter. A note may be `decisions`, `facts`, `runbooks`, or `log`. A task worth resuming is a `tasks` document; deleting it removes its catalog line in that same save. Cross-domain references link to the owner. Do not add a second hand-written route list in INDEX.

Correct known stale claims in the same task. Merge overlapping notes, remove content made redundant by a reliable code/test/native-doc authority, and retain superseded rationale only while it can change future judgment. A different branch does not by itself retire an applicable constraint. User-requested documentation should remain complete for its purpose; compress incidental memory, not the requested deliverable.

The INDEX header states purpose and agreements. The catalog names each document in those five groups. Topic pages carry current facts. Notes hold a decision, a fact list, a procedure, or a free-shape log. Avoid repeating detailed facts between them. Markdown folding does not reduce raw-file input: separate detail into linked files when selective reads need it.
