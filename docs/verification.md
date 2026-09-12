# Verification

Run from the source checkout:

```shell
node .github/scripts/check_hooks.mjs
node --test tests/spec.test.mjs
python .github/scripts/check_packages.py
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

## Spec runtime

The Spec test suite exercises CLI and stdio MCP entrypoints, exact Unicode/CRLF edits, multi-document moves, batch failure, two separate writer processes, stale reading premises, immutable snapshot reads, bounded results, interrupted transaction recovery, disable/enable behavior, and both copied plugin MCP configurations. A controlled HTTP fixture exercises the real GitHub adapter, including migration conflicts, CRLF/LF checkout equivalence without relaxing edit matching, private repository creation, compare-and-set races, lost successful responses, offline cache reads, and backed-up switches to local. No credentials or account access are required for this suite.

Editing coverage also includes short references across restarts and binding changes, existing full references, numbered long-line pagination, nonoverlapping base-relative ranges, rejection of mixed addressing and overlap, deletion/newline behavior, overlapping exact matches, and bounded recovery context. A GitHub fixture runs the actual Hook entrypoints with no local knowledge directory and checks that reads and writes never recreate it. A concurrent shared-index refresh holds the runtime lock beyond the former 400 ms limit while the project Hook must still inject its complete index. Search checks distinguish project, all-project, and shared prefixes.

For opt-in live integration, set `GEI_TEST_REPO` to an authorized private repository and run `node tests/live-github.mjs`. Optionally set `GEI_TEST_PLUGIN` to an installed plugin root to exercise that copy. It creates a uniquely named temporary branch, connects through the real adapter, creates/edits/reads/deletes a fixture, races two independent store instances, checks immutable reads and atomic rejection of invalid batches, and drops one successful commit response to verify recovery. With a deliberately failing transport it checks stale cache reads, rejected offline writes, disable/enable, explicit cached export, and rejection of revisions from the previous binding. It checks that the default branch stayed unchanged and removes the test branch. All settings and exports are isolated; the test never changes the user's active Spec binding. These checks do not simulate every network failure or establish behavior on another operating system.

Local checks do not establish a successful run on other operating systems or automatic discovery in every installed desktop version. The CI matrix runs the deterministic suite on Windows, Linux, and macOS. Tool design sources and evaluation limits are documented in [Spec tool design](spec-tools.md).

`check_packages.py` builds both actual ZIPs and exercises the extracted Skills-only CLI and plugin Hook with isolated state. An optional official-client check uses `npm install --prefix dist/mcp-client @modelcontextprotocol/sdk`, then `node tests/mcp-sdk.mjs`; this dependency is used only for verification and is not shipped. Set `GEI_TEST_PLUGIN` to verify an installed copy. It validates discovery, short references, numbered reads, exact/range edits, stale rejection, and actionable errors through the official SDK, and reports serialized input bytes for equivalent exact/range updates. That byte comparison is not a model or token benchmark.

The Codex catalog lives at `.agents/plugins/marketplace.json`. Because the plugin occupies the repository root, its entry uses a Git URL source instead of a nonexistent local subdirectory. This follows the [official marketplace source contract](https://developers.openai.com/plugins/build/plugins#how-local-marketplaces-work). Local package checks do not establish successful remote installation or publication.
