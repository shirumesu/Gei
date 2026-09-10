# Verification

Run from the source checkout:

```shell
node .github/scripts/check_hooks.mjs
python skills/create-skill/scripts/quick_validate.py skills/memo
```

The Hook check uses temporary directories and a copied plugin. It exercises named index allocation, repeat-start preservation, same-name sharing across locations, copied knowledge consumed by another clone without bindings, filesystem links, shared Git/worktree naming, nested repositories, concurrent first sessions, legacy migration diagnostics without data loss, per-Hook output budgets, scoped reads, and error reporting. Checkout assertions use native real paths so Windows short-path spellings are compared consistently. It also executes all configured entrypoints from both host configurations. CI is configured to run it and all seven Skill format checks on Windows, Linux, and macOS; Python validation needs PyYAML. A local run simulates separate devices through independent directories/stores; it does not establish a live cross-device Git synchronization or a successful run on other operating systems.

| Hook | Complete output cap | Responsibility |
| --- | --- | --- |
| Router | 2 KiB | Task selection and autonomous maintenance trigger |
| Workspace | 4 KiB | Allocate a missing named index; inject checkout and Project INDEX |
| Shared | 1.5 KiB | Read-only Shared INDEX, silent when no shared knowledge exists |

Budgets measure UTF-8 bytes including headers and paths. Project/Shared index bodies additionally allow at most 3/1 KiB. Oversized indexes are clipped on whole lines with their source path retained for selective reading. Detail is retrieved through routes, never injected in bulk. Each Hook is independent; a shared-index failure does not prevent workspace allocation.

Claude Code currently turns Hook output strings exceeding 10,000 characters into file previews. All three caps stay below that threshold; this is not a token measurement or a claim about every host version's rendering. See the [official Hook output contract](https://code.claude.com/docs/en/hooks#json-output).

These checks establish runtime contracts, not agent compliance or design quality. Earlier small agent comparisons found no completion advantage for Work on a simple CLI task; keep it a thin delivery convention. Multi-turn design quality, long-term autonomous maintenance, and live host rendering require real usage evidence. Historical evaluation transcripts and migration snapshots are not part of the active plugin package.

The Codex catalog lives at `.agents/plugins/marketplace.json`. Because the plugin occupies the repository root, its entry uses a Git URL source instead of a nonexistent local subdirectory. This follows the [official marketplace source contract](https://developers.openai.com/plugins/build/plugins#how-local-marketplaces-work). Local package checks do not establish successful remote installation or publication.
