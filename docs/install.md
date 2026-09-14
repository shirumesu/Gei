# Install Gei

This document is for the installing AI agent. Install only Gei, verify the selected install path, and report the result.

Plugin Hooks and the bundled Spec MCP require Node.js 22 or newer on the host's PATH. Git project/worktree identity also requires `git`. Check `node --version` and `git --version` for plugin methods; report missing prerequisites rather than claiming Hooks or MCP are operational from file presence alone. No npm install or hosted service is needed. Skills-only methods do not run Hooks or register MCP automatically, but include the standalone Spec CLI.

For an existing path-hash knowledge store, reconcile the affected project's old directories through [Memo migration](../skills/memo/references/migrate.md) before enabling the updated Hooks. Storage uses project names without `project.json` or per-project bindings. Spec defaults to local. GitHub connection and upload are separate user choices, not an installation side effect; use [Spec controls](spec.md) when requested. Do not migrate unrelated projects as part of an installation.

## Boundaries

- Do not install, copy, or modify `AGENTS.md`, `CLAUDE.md`, shell profiles, PATH, credentials, or unrelated host configuration.
- Do not delete or overwrite an existing plugin, skill directory, or settings file unless the user explicitly confirms that exact action.
- Do not hand-edit Claude or Codex hook settings when plugin installation is available; plugin metadata owns hooks.
- Stop and ask the user for the target directory when the host's plugin or skills directory cannot be determined from the environment.
- Stop before writing if the target plugin or skill directory already exists and the user did not ask to update that exact installation.
- Stop and report the exact blocker if a command is unavailable, rejected, requires interactive UI you cannot operate, or needs permission outside this installation request.

## Select Method

Use the first matching method:

1. `codex-plugin`: Codex or Codex CLI with plugin marketplace support.
2. `claude-plugin`: Claude Code with plugin marketplace support.
3. `skills-zip`: any host that scans skill directories but has no usable plugin installer.
4. `git-skills`: any host that scans skill directories and should receive an updateable checkout.

The required skills are:

```text
using-gei
consider
memo
work
code-review
see
create-skill
```

## Method: Codex Plugin

Use this for Codex or Codex CLI when `codex plugin marketplace` is available.

1. Add the Gei plugin source:

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git
```

For local development, add the source checkout instead:

```shell
codex plugin marketplace add /absolute/path/to/gei
```

The same marketplace entry uses `source: "local"` and `path: "./"` to load the plugin from the marketplace root. A local source includes working-tree edits; a Git source uses the fetched repository snapshot.

2. Install and enable `gei` through the Codex plugin mechanism available in the current host.

Local plugins are copied into `~/.codex/plugins/cache/gei/gei/local/`. After editing the source checkout, restart the desktop app and test in a new task so the local installation picks up the changes. Local iteration does not require a version bump or Git push. See the [official local installation workflow](https://developers.openai.com/plugins/build/plugins#install-a-local-plugin-manually).

3. Verify the installed plugin exposes:

```text
gei
  .codex-plugin/plugin.json
  .codex-plugin/spec.mcp.json
  bin/gei.mjs
  skills/using-gei/SKILL.md
  skills/consider/SKILL.md
  skills/memo/SKILL.md
  skills/memo/references/storage.md
  skills/work/SKILL.md
  skills/code-review/SKILL.md
  skills/see/SKILL.md
  skills/create-skill/SKILL.md
  hooks/codex-hooks.json
  hooks/knowledge.mjs
  hooks/inject_using_gei.mjs
  hooks/inject_context.mjs
  hooks/inject_shared.mjs
  skills/memo/templates/index.md
```

Verify the bundled `skills/memo/scripts/spec/` CLI, MCP, and runtime modules are present. The Spec MCP must start, expose `spec_status`, `spec_read`, `spec_search`, `spec_edit`, `spec_check`, and `spec_gc`, and respond to `spec_status`. Codex uses plugin-relative `cwd` and arguments, not Hook `${PLUGIN_ROOT}` expansion in MCP commands. Termination condition: `gei` is installed and enabled, or plugin source addition succeeded but host enablement requires user interaction that the agent cannot perform.

## Method: Claude Plugin

Use this for Claude Code when plugin marketplace installation is available.

1. Add `https://github.com/shirumesu/gei.git` as a Claude Code plugin marketplace source using the host's plugin command or UI tooling.

2. Install and enable the `gei` plugin.

3. Verify the installed plugin exposes:

```text
Gei
  .claude-plugin/plugin.json
  .mcp.json
  bin/gei.mjs
  hooks/hooks.json
  hooks/knowledge.mjs
  hooks/inject_using_gei.mjs
  hooks/inject_context.mjs
  hooks/inject_shared.mjs
  skills/memo/templates/index.md
  skills/using-gei/SKILL.md
  skills/consider/SKILL.md
  skills/memo/SKILL.md
  skills/memo/references/storage.md
  skills/work/SKILL.md
  skills/code-review/SKILL.md
  skills/see/SKILL.md
  skills/create-skill/SKILL.md
```

Verify the bundled `skills/memo/scripts/spec/` CLI, MCP, and runtime modules are present. The Spec MCP must start through `${CLAUDE_PLUGIN_ROOT}`, expose `spec_status`, `spec_read`, `spec_search`, `spec_edit`, `spec_check`, and `spec_gc`, and respond to `spec_status`. Termination condition: `gei` is installed and enabled, or plugin source addition succeeded but host enablement requires user interaction that the agent cannot perform.

## Method: Skills Zip

Use this when the host scans skill directories and plugin installation is unavailable.

1. Determine `<skills-dir>`, the host directory that is scanned for skills.

2. Download the latest skills archive into a temporary directory:

```shell
curl -L -o Gei-skills.zip https://github.com/shirumesu/gei/releases/latest/download/Gei-skills.zip
```

3. Extract it into `<skills-dir>`.

Windows PowerShell:

```powershell
Expand-Archive -LiteralPath .\Gei-skills.zip -DestinationPath '<skills-dir>'
```

Unix shell:

```shell
unzip Gei-skills.zip -d <skills-dir>
```

4. Verify this layout:

```text
<skills-dir>/
  Gei/
    using-gei/SKILL.md
    consider/SKILL.md
    memo/SKILL.md
    memo/references/storage.md
    work/SKILL.md
    code-review/SKILL.md
    see/SKILL.md
    create-skill/SKILL.md
```

If the host does not scan nested directories, ask before moving the skill directories directly under `<skills-dir>`.

Termination condition: every required skill directory contains `SKILL.md` in a location scanned by the host.

## Method: Git Skills

Use this when the host scans skill directories and the user wants updates through `git pull`.

1. Determine `<skills-dir>`, the host directory that is scanned for skills.

2. Clone the repository:

```shell
git clone https://github.com/shirumesu/gei.git <skills-dir>/Gei
```

3. Verify this layout:

```text
<skills-dir>/
  Gei/
    skills/using-gei/SKILL.md
    skills/consider/SKILL.md
    skills/memo/SKILL.md
    skills/memo/references/storage.md
    skills/work/SKILL.md
    skills/code-review/SKILL.md
    skills/see/SKILL.md
    skills/create-skill/SKILL.md
```

If the host does not scan nested directories, ask before creating links or copying skill directories directly under `<skills-dir>`.

For updates, run:

```shell
git -C <skills-dir>/Gei pull
```

Termination condition: every required skill directory contains `SKILL.md` in a location scanned by the host.

## Completion

Report only:

1. Selected method.
2. Installation path or plugin name.
3. Verification result.
4. Any required user action, limited to host restart or plugin enablement when the agent could not perform it.
