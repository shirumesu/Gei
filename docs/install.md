# Install Gei

This document is for the AI agent that performs the installation. Install only Gei, verify the selected install path, and report the result.

Plugin Hooks and the `memo` command require Node.js 22.13 or newer (they use the built-in `node:sqlite`) and `git` on the host's PATH. Check `node --version` and `git --version` for plugin methods; report missing prerequisites rather than claiming Hooks are operational from file presence alone. No npm install or hosted service is needed. Skills-only methods have no Hooks and no `memo` command, so they have no memory.

Memory lives outside every project: entries in a local SQLite database under `~/.agents/gei-state`, synced through `~/.agents/geispec`, a git clone of a repository the user owns (see [memory storage](spec.md)). Creating or cloning it and pointing `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` and `~/.claude/settings.json` at it is `gei memo setup`, a separate step the user runs and confirms; it is not part of installation. Do not migrate unrelated projects as part of an installation.

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
consider
deslop
diagnose
inspect
memo
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
  bin/gei.mjs
  bin/memo
  skills/consider/SKILL.md
  skills/deslop/SKILL.md
  skills/diagnose/SKILL.md
  skills/inspect/SKILL.md
  skills/memo/SKILL.md
  skills/memo/references/storage.md
  skills/memo/scripts/cli.mjs
  hooks/codex-hooks.json
  hooks/session_start.mjs
  hooks/user_prompt.mjs
  hooks/subagent_start.mjs
  hooks/stop.mjs
  hooks/guard.mjs
```

Run `node <plugin>/bin/memo --help` and confirm it prints the command list (find, keys, put and the rest). Codex asks the user to review and trust plugin Hooks (Review hooks in the composer, or `/hooks` in the CLI); a changed Hook needs trusting again after an update. Termination condition: `gei` is installed and enabled, or plugin source addition succeeded but host enablement requires user interaction that the agent cannot perform.

## Method: Claude Plugin

Use this for Claude Code when plugin marketplace installation is available.

1. Add `https://github.com/shirumesu/gei.git` as a Claude Code plugin marketplace source using the host's plugin command or UI tooling.

2. Install and enable the `gei` plugin.

3. Verify the installed plugin exposes:

```text
Gei
  .claude-plugin/plugin.json
  bin/gei.mjs
  bin/memo
  hooks/hooks.json
  hooks/session_start.mjs
  hooks/user_prompt.mjs
  hooks/subagent_start.mjs
  hooks/stop.mjs
  hooks/guard.mjs
  skills/consider/SKILL.md
  skills/deslop/SKILL.md
  skills/diagnose/SKILL.md
  skills/inspect/SKILL.md
  skills/memo/SKILL.md
  skills/memo/references/storage.md
  skills/memo/scripts/cli.mjs
```

Run `node <plugin>/bin/memo --help` and confirm it prints the command list (find, keys, put and the rest). Termination condition: `gei` is installed and enabled, or plugin source addition succeeded but host enablement requires user interaction that the agent cannot perform.

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
    consider/SKILL.md
    deslop/SKILL.md
    diagnose/SKILL.md
    inspect/SKILL.md
    memo/SKILL.md
    memo/references/storage.md
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
    skills/consider/SKILL.md
    skills/deslop/SKILL.md
    skills/diagnose/SKILL.md
    skills/inspect/SKILL.md
    skills/memo/SKILL.md
    skills/memo/references/storage.md
```

If the host does not scan nested directories, ask before creating links or copying skill directories directly under `<skills-dir>`.

For updates, run:

```shell
git -C <skills-dir>/Gei pull
```

Termination condition: every required skill directory contains `SKILL.md` in a location scanned by the host.

## Memory Setup

After a plugin install, tell the user how to set up memory on this machine and let them run it in a terminal, because it changes their configuration and asks before each change:

```shell
node <plugin>/bin/gei.mjs memo setup <private-repository-url>
```

Without a URL it creates a local repository with no remote. Run it yourself only when the user asks, and pass `--yes` only when they want every change applied unseen. It stops, changing nothing, when `~/.agents/geispec` exists without git or when the user's existing instructions would be overwritten.

## Completion

Report only:

1. Selected method.
2. Installation path or plugin name.
3. Verification result.
4. Any required user action: host restart, plugin or Hook enablement the agent could not perform, and the memory setup command.
