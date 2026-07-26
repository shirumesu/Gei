#!/usr/bin/env python3

import argparse
import sys
from pathlib import Path


TEMPLATE_MAP = {
    "OVERVIEW.template.md": "spec/OVERVIEW.md",
    "ARCHITECTURE.template.md": "spec/ARCHITECTURE.md",
    "MEMORY.template.md": "spec/MEMORY.md",
    "CHANGELOG.template.md": "spec/CHANGELOG.md",
}

DIRECTORIES = ("spec/docs", "spec/memory")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Create missing files for Gei's optional spec/ layout. Existing files "
            "are preserved."
        )
    )
    parser.add_argument("project_path", help="Path to the target project")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show planned creates and skips without writing",
    )
    parser.add_argument(
        "--add-gitignore",
        action="store_true",
        help="Add spec/ to .gitignore without initializing Git",
    )
    return parser.parse_args()


def load_templates(script_path: Path) -> dict[Path, str]:
    templates_dir = script_path.parent.parent / "references" / "templates"
    contents: dict[Path, str] = {}
    for template_name, output_name in TEMPLATE_MAP.items():
        template_path = templates_dir / template_name
        if not template_path.exists():
            raise FileNotFoundError(f"template not found: {template_path}")
        contents[Path(output_name)] = template_path.read_text(encoding="utf-8")
    return contents


def plan_changes(
    project_root: Path, contents: dict[Path, str]
) -> tuple[list[Path], list[tuple[Path, str]], list[Path]]:
    directory_creates = [
        project_root / directory
        for directory in DIRECTORIES
        if not (project_root / directory).exists()
    ]
    creates: list[tuple[Path, str]] = []
    skips: list[Path] = []
    for relative_path, content in contents.items():
        target = project_root / relative_path
        if target.exists():
            skips.append(target)
        else:
            creates.append((target, content))
    return directory_creates, creates, skips


def write_changes(
    project_root: Path,
    directory_creates: list[Path],
    creates: list[tuple[Path, str]],
    add_gitignore: bool,
) -> list[Path]:
    written: list[Path] = []
    for directory in directory_creates:
        directory.mkdir(parents=True, exist_ok=True)
        written.append(directory)

    for target, content in creates:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        written.append(target)

    if add_gitignore:
        gitignore_path = project_root / ".gitignore"
        existing = (
            gitignore_path.read_text(encoding="utf-8")
            if gitignore_path.exists()
            else ""
        )
        lines = {line.strip() for line in existing.splitlines()}
        if "spec/" not in lines:
            separator = "" if not existing or existing.endswith("\n") else "\n"
            gitignore_path.write_text(f"{existing}{separator}spec/\n", encoding="utf-8")
            written.append(gitignore_path)

    return written


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_path).expanduser().resolve()

    if not project_root.exists():
        print(f"error: target project does not exist: {project_root}", file=sys.stderr)
        return 1
    if not project_root.is_dir():
        print(f"error: target path is not a directory: {project_root}", file=sys.stderr)
        return 1

    try:
        contents = load_templates(Path(__file__).resolve())
        directory_creates, creates, skips = plan_changes(project_root, contents)
        written = (
            []
            if args.dry_run
            else write_changes(
                project_root,
                directory_creates,
                creates,
                args.add_gitignore,
            )
        )
    except (FileNotFoundError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    mode = "Dry run" if args.dry_run else "Initialized"
    print(f"{mode} Gei spec layout at {project_root}")
    for target in directory_creates:
        status = "would create directory" if args.dry_run else "created directory"
        print(f" - {status}: {target}")
    for target, _content in creates:
        status = "would create" if args.dry_run else "created"
        print(f" - {status}: {target}")
    for target in skips:
        print(f" - preserved: {target}")
    if args.add_gitignore:
        status = "would add spec/ to .gitignore" if args.dry_run else "checked .gitignore"
        print(f" - {status}")
    if not args.dry_run and not written:
        print(" - no changes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
