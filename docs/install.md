# Install Gei

This document is for the installing Agent. Execute the steps, verify the final layout, then report the result to the user.

## Inputs

Before installing, determine:

- `<install-dir>`: the directory scanned by the host for skills or plugins.
- `<method>`: one of `claude-plugin`, `codex-plugin`, `skills-zip`, or `git`.

If `<install-dir>` cannot be determined from the host environment, ask the user for the target directory before writing files.

## Method: Claude Plugin

Use this when the host is Claude Code and you want plugin-style installation with automatic hook registration. Requires Node.js on PATH.

1. Clone the repository to any location (recommended: `~/.agents/Gei`):

```shell
git clone https://github.com/shirumesu/gei.git <install-dir>/Gei
```

2. Run the installer:

```shell
node <install-dir>/Gei/hooks/install-claude.mjs
```

3. Verify this layout:

```text
~/.claude/
  skills/
    using-gei/  -> <install-dir>/Gei/skills/using-gei
    work/        -> <install-dir>/Gei/skills/work
    memo/        -> <install-dir>/Gei/skills/memo
    see/         -> <install-dir>/Gei/skills/see
    consider/    -> <install-dir>/Gei/skills/consider
    design/      -> <install-dir>/Gei/skills/design
  settings.json  (contains SessionStart hook entry)
```

Termination condition: every skill directory under `~/.claude/skills/` resolves to a path inside `<install-dir>/Gei/skills/`, and `~/.claude/settings.json` contains a `SessionStart` hook entry pointing to `<install-dir>/Gei/hooks/session-start.mjs`.

For updates, run `git pull` inside `<install-dir>/Gei`. No need to re-run the installer unless new skill directories are added.

## Method: Codex Plugin

Use this when the user wants the Codex plugin package.

1. Download `Gei-codex-plugin.zip` from the latest release:

```shell
curl -L -o Gei-codex-plugin.zip https://github.com/shirumesu/gei/releases/latest/download/Gei-codex-plugin.zip
```

2. Extract the archive into `<install-dir>`:

```shell
unzip Gei-codex-plugin.zip -d <install-dir>
```

3. Verify this layout:

```text
<install-dir>/
  gei/
    .codex-plugin/
      plugin.json
    skills/
      using-gei/
        SKILL.md
      work/
        SKILL.md
      memo/
        SKILL.md
      see/
        SKILL.md
      consider/
        SKILL.md
      design/
        SKILL.md
```

Termination condition: `<install-dir>/gei/.codex-plugin/plugin.json` exists and every listed skill directory contains `SKILL.md`.

## Method: Skills Zip

Use this when the host can recursively detect skill folders under a grouped directory.

1. Download `Gei-skills.zip` from the latest release:

```shell
curl -L -o Gei-skills.zip https://github.com/shirumesu/gei/releases/latest/download/Gei-skills.zip
```

2. Extract the archive into `<install-dir>`:

```shell
unzip Gei-skills.zip -d <install-dir>
```

3. Verify this layout:

```text
<install-dir>/
  Gei/
    using-gei/
      SKILL.md
    work/
      SKILL.md
    memo/
      SKILL.md
    see/
      SKILL.md
    consider/
      SKILL.md
    design/
      SKILL.md
```

Termination condition: `<install-dir>/Gei/using-gei/SKILL.md` exists and every listed skill directory contains `SKILL.md`.

## Method: Git

Use this when the host can recursively detect skill folders under a repository checkout.

1. Clone the repository under `<install-dir>`:

```shell
git clone https://github.com/shirumesu/gei.git <install-dir>/Gei
```

2. For updates, run:

```shell
git -C <install-dir>/Gei pull
```

3. Verify this layout:

```text
<install-dir>/
  Gei/
    skills/
      using-gei/
        SKILL.md
      work/
        SKILL.md
      memo/
        SKILL.md
      see/
        SKILL.md
      consider/
        SKILL.md
      design/
        SKILL.md
```

Termination condition: `<install-dir>/Gei/skills/using-gei/SKILL.md` exists and every listed skill directory contains `SKILL.md`.

## Troubleshooting

If the host does not recursively detect skills under `Gei/`, move or copy the skill folders so the final layout is:

```text
<skills-dir>/
  using-gei/
    SKILL.md
  work/
    SKILL.md
  memo/
    SKILL.md
  see/
    SKILL.md
  consider/
    SKILL.md
  design/
    SKILL.md
```

After moving files, verify that `<skills-dir>/using-gei/SKILL.md` exists and that every installed skill directory contains `SKILL.md`.

## Completion Message

When installation is verified, tell the user:

1. Gei is installed.
2. They need to restart the host application so it reloads the skills or plugin.
3. The `see` skill needs social-tool login state before first use.
4. `AGENTS.md` is optional reference material and is not installed by default.

Then ask the user whether they want to synchronize `AGENTS.md` into their host instructions, making clear that this is optional. Also ask whether they want to initialize the `see` tools now. Offer exactly these two options for `see` initialization:

- Continue in this window. If the user chooses this, read `see/SKILL.md` and `see/references/tool.md` explicitly. Do not search for unrelated or unregistered skills.
- Continue in a new window. give them this prompt to copy:

```text
Using the `see` skill and `see/references/tool.md`, initialize and install the required social tools.
```
