# Installing Gei Skills for Agent

## Installation

1. Download the latest packaged archive named `Gei.zip` from this repository's latest release. If you are installing directly from the repository, copy the skill folders from `skills/` on the `main` branch instead.
2. If you are using the packaged archive, extract it directly into the directory your agent scans for installed skills. The archive is built so that each skill folder is already at the archive root, so do not create an extra `Gei/` or `skills/` wrapper first.
3. If you are installing manually from the repository, copy the folders you want from `skills/` into the skills directory and keep their folder names unchanged.
4. Confirm that every installed skill keeps `SKILL.md` at the root of its own folder.

A full install can look like this:

```text
<skills-dir>/
  design/
    SKILL.md
  consider/
    SKILL.md
  memo/
    SKILL.md
    references/
    scripts/
  using-gei/
    SKILL.md
  work/
    SKILL.md
    references/
    scripts/
```

If you only want part of the bundle, install only the folders you need. If you want the Gei router layer, install `using-gei` together with every downstream skill it should dispatch to. A common coding-focused install can look like this:

```text
<skills-dir>/
  consider/
    SKILL.md
  memo/
    SKILL.md
    references/
    scripts/
  using-gei/
    SKILL.md
  work/
    SKILL.md
    references/
    scripts/
```

## Finish

Once each installed skill folder contains `SKILL.md` at its root, the installation is complete.

Restart the host after copying the files so it reloads the updated skill set.

## Updating

Replace the existing skill folders with a newer package, or overwrite the files you installed manually from the repository.

If you made local edits, back them up before replacing files.

After updating, restart your agent so it loads the new version.

## Troubleshooting

- If a skill is not detected, check that the final path is `<skills-dir>/work/SKILL.md` or `<skills-dir>/memo/SKILL.md`, not an extra nested path such as `<skills-dir>/Gei/skills/work/SKILL.md`.
- If `using-gei` loads but does not route anywhere useful, confirm that the downstream Gei skill folders were installed alongside it.
- If only part of the bundle is detected, confirm that you copied the skill folders themselves instead of the parent `skills/` directory.
- If the old behavior is still active, fully restart the host instead of only opening a new chat inside the same running process.

