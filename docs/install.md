# Install Gei

This document is for the installing AI agent. Install only Gei, verify the selected install path, and report the result.

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

2. Install and enable `gei` through the Codex plugin mechanism available in the current host.

3. Verify the installed plugin exposes:

```text
gei
  .codex-plugin/plugin.json
  skills/using-gei/SKILL.md
  skills/consider/SKILL.md
  skills/memo/SKILL.md
  skills/work/SKILL.md
  skills/code-review/SKILL.md
  skills/see/SKILL.md
  skills/create-skill/SKILL.md
  hooks/codex-hooks.json
```

Termination condition: `gei` is installed and enabled, or plugin source addition succeeded but host enablement requires user interaction that the agent cannot perform.

## Method: Claude Plugin

Use this for Claude Code when plugin marketplace installation is available.

1. Add `https://github.com/shirumesu/gei.git` as a Claude Code plugin marketplace source using the host's plugin command or UI tooling.

2. Install and enable the `gei` plugin.

3. Verify the installed plugin exposes:

```text
Gei
  .claude-plugin/plugin.json
  hooks/hooks.json
  skills/using-gei/SKILL.md
  skills/consider/SKILL.md
  skills/memo/SKILL.md
  skills/work/SKILL.md
  skills/code-review/SKILL.md
  skills/see/SKILL.md
  skills/create-skill/SKILL.md
```

Termination condition: `gei` is installed and enabled, or plugin source addition succeeded but host enablement requires user interaction that the agent cannot perform.

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
