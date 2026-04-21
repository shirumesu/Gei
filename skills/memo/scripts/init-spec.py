#!/usr/bin/env python3

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


TEMPLATE_MAP = {
    "ARCHITECTURE.template.md": "spec/ARCHITECTURE.md",
    "TODO.template.md": "spec/TODO.md",
    "MEMORY.template.md": "spec/MEMORY.md",
    "CHANGELOG.template.md": "spec/CHANGELOG.md",
    "task-spec.template.md": "spec/docs/#001-work.md",
}

DIRECTORIES = [
    "spec/test",
]

CONFLICT_MARKERS = [
    "spec",
    "specs",
    "plan",
    "plans",
    "workplan",
    "workplans",
    "docs/spec",
    "docs/specs",
    "docs/plan",
    "docs/plans",
    "docs/superpowers",
    "docs/superpowers/specs",
    "docs/superpowers/plans",
    "docs/workplan",
    "docs/workplans",
    "plandocs",
    "ARCHITECTURE.md",
    "TODO.md",
    "MEMORY.md",
    "CHANGELOG.md",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initialize a project's spec/ directory from the memo skill templates."
    )
    parser.add_argument("project_path", help="Path to the target project")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Bypass conflict detection and overwrite generated spec files",
    )
    return parser.parse_args()


def find_conflicts(project_root: Path) -> list[Path]:
    conflicts: list[Path] = []
    for marker in CONFLICT_MARKERS:
        candidate = project_root / marker
        if candidate.exists():
            conflicts.append(candidate)
    return sorted(set(conflicts))


def load_templates(script_path: Path) -> dict[Path, str]:
    templates_dir = script_path.parent.parent / "references" / "templates"
    contents: dict[Path, str] = {}
    for template_name, output_name in TEMPLATE_MAP.items():
        template_path = templates_dir / template_name
        contents[Path(output_name)] = template_path.read_text(encoding="utf-8")
    return contents


def write_spec_files(project_root: Path, contents: dict[Path, str], force: bool) -> None:
    for relative_path, content in contents.items():
        target = project_root / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and not force:
            raise FileExistsError(
                f"refusing to overwrite existing file without --force: {target}"
            )
        target.write_text(content, encoding="utf-8")


def ensure_directories(project_root: Path) -> None:
    for relative_path in DIRECTORIES:
        (project_root / relative_path).mkdir(parents=True, exist_ok=True)


def run_git_init(project_root: Path, git_path: str) -> bool:
    try:
        subprocess.run(
            [git_path, "init"],
            cwd=project_root,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return True
    except subprocess.CalledProcessError as exc:
        print(
            "warning: git init failed; skipped .gitignore update.\n"
            f"{exc.stderr.strip()}",
            file=sys.stderr,
        )
        return False


def update_gitignore(project_root: Path) -> str:
    git_path = shutil.which("git")
    if not git_path:
        return "git not found; skipped git init and .gitignore update."

    gitignore_path = project_root / ".gitignore"
    if not gitignore_path.exists() and not (project_root / ".git").exists():
        if not run_git_init(project_root, git_path):
            return "git init failed; skipped .gitignore update."

    existing = gitignore_path.read_text(encoding="utf-8") if gitignore_path.exists() else ""
    if "spec/" in existing:
        return ".gitignore already contains spec/."

    block = "#spec\nspec/\n"
    if existing:
        separator = "\n" if existing.endswith("\n") else "\n\n"
        updated = f"{existing}{separator}{block}"
    else:
        updated = block
    gitignore_path.write_text(updated, encoding="utf-8")
    return "updated .gitignore with spec/."


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_path).expanduser().resolve()

    if not project_root.exists():
        print(f"error: target project does not exist: {project_root}", file=sys.stderr)
        return 1

    if not project_root.is_dir():
        print(f"error: target path is not a directory: {project_root}", file=sys.stderr)
        return 1

    conflicts = find_conflicts(project_root)
    if conflicts and not args.force:
        conflict_lines = "\n".join(f" - {path}" for path in conflicts)
        print(
            "error: found existing spec or other plan-management markers.\n"
            "Refusing to initialize to avoid mixing conventions.\n"
            f"{conflict_lines}\n"
            "If override is determined, rerun with --force",
            file=sys.stderr,
        )
        return 1

    try:
        contents = load_templates(Path(__file__).resolve())
        write_spec_files(project_root, contents, args.force)
        ensure_directories(project_root)
    except FileExistsError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"error: failed to write spec files: {exc}", file=sys.stderr)
        return 1

    git_message = update_gitignore(project_root)

    print("Initialized spec files:")
    for output_name in TEMPLATE_MAP.values():
        print(f" - {project_root / output_name}")
    for directory_name in DIRECTORIES:
        print(f" - {project_root / directory_name}")
    print(git_message)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
