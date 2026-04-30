# Install Gei

This document is for the installing Agent. Execute the steps, verify the final layout, then report the result to the user.

## Inputs

Before installing, determine:

- `<install-dir>`: the directory scanned by the host for skills or plugins.
- `<method>`: one of `codex-plugin`, `skills-zip`, or `git`.

If `<install-dir>` cannot be determined from the host environment, ask the user for the target directory before writing files.

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

Then ask the user whether they want to initialize the `see` tools now. Offer exactly these two options:

- Continue in this window. If the user chooses this, read `see/SKILL.md` and `see/references/tool.md` explicitly. Do not search for unrelated or unregistered skills.
- Continue in a new window. give them this prompt to copy:

```text
Using the `see` skill and `see/references/tool.md`, initialize and install the required social tools.
```
