# Spec tool design

The interface exposes three daily operations and a status tool. Repository APIs, locking, caching, revision checking, and commits are implementation responsibilities. Settings stay in the CLI rather than adding configuration tools to the model's daily interface.

## Evidence and decisions

| Primary source | Relevant finding | Application and limit |
| --- | --- | --- |
| [Anthropic text editor](https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool) | Exact replacement uses old/new text and requires a unique match, including whitespace | Use deterministic exact replacement and actionable ambiguity errors; this is an established interface, not proof of universal superiority |
| [Aider edit formats](https://aider.chat/docs/more/edit-formats.html) | Whole-file edits repeat unchanged content; useful edit formats differ by model | Avoid full-document replacement for routine small changes; keep complete content for file creation |
| [SWE-agent, arXiv:2405.15793](https://arxiv.org/html/2405.15793v3) | Editor and search presentation materially affected the evaluated agent; aggregated search and bounded views helped | Provide batch search, bounded reads, and edit feedback; the older code benchmark does not prescribe a universal Markdown window size |
| [Diff-XYZ, arXiv:2510.12487](https://arxiv.org/html/2510.12487v1) | Diff generation and application are different tasks; search/replace was effective for generation with the evaluated larger models | Let the model express replacements and deterministic code apply them; single-turn code results are not a Gei production evaluation |
| [Letta memory blocks](https://docs.letta.com/v1-sdk/memory/memory-blocks) | Whole-value concurrent updates can overwrite previous writes | Central storage still requires version checks; avoid whole-value last-writer-wins semantics |
| [Writing effective tools](https://www.anthropic.com/engineering/writing-tools-for-agents) | Task-oriented tools and useful bounded results should be evaluated against real tasks | Keep read/search/edit cohesive, do not expose stage/commit/push or force status before every read |

The runtime uses a whole-store revision rather than a stateful model-session transaction. This is conservative when unrelated documents change, but it also catches changed reading premises. Automatic retry based only on edited-file hashes would miss that dependency. A future read-set optimization needs evidence that repeated conflicts warrant its additional machinery. Model-facing references are now short, persisted aliases for that same version; this reduces copying without weakening concurrency checks or introducing a shared "last read" state. References identify the Markdown coordinate contract; references from the former virtual view require a fresh read.

All read/search/edit line and column coordinates refer to the stored Markdown, matching GitHub and editor lines at that revision. Optional lifecycle state lives in a runtime-managed `gei` frontmatter field and is visible in ordinary reads and searches. Separate records from earlier builds migrate into their Markdown on write or through explicit CLI migration. Exact replacement remains suitable for a small correction. For longer sections, numbered reads and base-relative `replace_lines` avoid repeating the original text, including long identifiers. Multiple nonoverlapping ranges in a document apply against the immutable base, not shifted intermediate line numbers; mixing range and other edits on the same document is rejected. Range edits preserve untouched bytes and specify newline handling. Matching errors return bounded base context and a pinned reread request. Diagnostic hints never authorize fuzzy application. These are interface improvements, not evidence that an agent can safely edit a section it has not read.

The `rename` edit moves the complete document, including its lifecycle state. Migration, review, deletion, GC, and storage transitions share the same transaction path, including revision checks for metadata-only changes. Storage migration is a CLI operation, while the existing optional reviews express semantic decisions.

The schema lives in `skills/memo/scripts/spec/tools.mjs`. Read results identify source, snapshot, line range, and truncation. Edit results return changed paths and the persisted revision. Errors distinguish missing/ambiguous matches, stale revisions, unavailable credentials/network, and unconfirmed submissions. No hidden model performs summarization or semantic merging.

## Evaluation

Deterministic checks exercise persistence, exact Unicode/CRLF changes, multi-document moves, invalid later operations, two-process conflicts, changed premises, immutable reads, bounded search, crash recovery, copied plugin launches, backend transitions, and uncertain GitHub outcomes. An opt-in integration test uses a temporary branch and verifies the default branch remains unchanged.

Model-facing evaluation should include small corrections, splitting a long note while repairing its routes, and recovery from a competing edit. Observe successful content/route updates, invalid edits, repeated reads, tool traffic, and recovery calls. The optional SDK check compares serialized exact/range inputs for the same 30-record update and verifies the resulting bytes; this measures tool payload size, not tokenizer counts or total conversation cost. Passing protocol and concurrency tests alone does not establish improved model quality or token savings. Avoid a permanent inventory of evaluation transcripts in the product.
