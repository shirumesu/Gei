# Spec Access

The tool schemas own ordinary read/search/edit arguments. Use knowledge-relative paths from the injected INDEX; repository selection belongs to user configuration, not model inference. A read/search revision pins a snapshot. The edit tool saves one ordered batch and reports whether it persisted locally or remotely. No separate commit or push is required in GitHub mode.

Without MCP, run `node <memo>/scripts/spec/cli.mjs --help`. The `read`, `search`, and `edit` commands accept the same JSON arguments through stdin or `--input FILE`; shell quoting must preserve exact text. Settings commands include `status`, `enable`, `disable`, `connect github`, `use local`, and `refresh`. Plugin installs also expose `node <gei>/bin/gei.mjs spec ...`. Do not assume a global `gei` executable is on PATH.

Default local storage needs no authentication. GitHub connection is an explicit user choice of repository and upload scope; preview before applying. If credentials are unavailable, explain the setup requirement without asking for a token in chat. Do not silently connect a guessed repository, change storage mode, or create a writable offline fork.

On `REVISION_CONFLICT`, read the changed documents and update the proposal. On `NO_MATCH` or `AMBIGUOUS_MATCH`, read the exact text and include enough surrounding context. On `SUBMISSION_UNCONFIRMED`, inspect the current remote documents before retrying. Unavailable uncached documents require connectivity. Disabled Spec remains disabled until the user requests otherwise.

Snapshots, configuration, and backups stay outside active knowledge. Preserve supplied Markdown and its meaningful conditions; the runtime does not decide which claims are correct. For divergent copies, use [merge](merge.md).
