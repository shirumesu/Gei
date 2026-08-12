#!/usr/bin/env python3
"""Validate the basic structure of an agent Skill."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover - depends on local runtime
    yaml = None


FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LOCAL_LINK_RE = re.compile(r"\[[^\]]+\]\((?!https?://|mailto:|#)([^)]+)\)")
PLACEHOLDER_RE = re.compile(r"\b(TODO|TBD|FIXME)\b|<placeholder>|\[placeholder\]", re.IGNORECASE)
FENCED_CODE_RE = re.compile(r"^```.*?^```", re.DOTALL | re.MULTILINE)
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)


def _parse_frontmatter(skill_md: Path) -> tuple[dict, str]:
    text = skill_md.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    if not match:
        raise ValueError("SKILL.md must start with YAML frontmatter delimited by ---")

    raw = match.group(1)
    if yaml is None:
        raise ValueError("PyYAML is required to parse frontmatter; install pyyaml or run in a runtime that includes it")

    data = yaml.safe_load(raw)
    if not isinstance(data, dict):
        raise ValueError("frontmatter must parse to a YAML mapping")
    return data, text[match.end() :]


def _validate_frontmatter(data: dict) -> list[str]:
    errors: list[str] = []
    name = data.get("name")
    description = data.get("description")

    if not isinstance(name, str) or not name.strip():
        errors.append("frontmatter must include a non-empty string 'name'")
    elif not NAME_RE.fullmatch(name.strip()):
        errors.append("'name' must be lowercase kebab-case with letters, digits, and single hyphens")

    if not isinstance(description, str) or not description.strip():
        errors.append("frontmatter must include a non-empty string 'description'")
    elif len(description) > 1024:
        errors.append("'description' must be 1024 characters or fewer")

    if isinstance(description, str) and ("<" in description or ">" in description):
        errors.append("'description' must not contain angle brackets")

    return errors


def _without_nonsemantic_regions(text: str) -> str:
    """Preserve line numbers while hiding examples and maintainer comments."""

    text = FENCED_CODE_RE.sub(lambda match: "\n" * match.group(0).count("\n"), text)
    return HTML_COMMENT_RE.sub(lambda match: "\n" * match.group(0).count("\n"), text)


def _validate_markdown_links(skill_root: Path, markdown_path: Path, text: str) -> list[str]:
    errors: list[str] = []
    link_text = _without_nonsemantic_regions(text)
    base_dir = markdown_path.parent
    rel_path = markdown_path.relative_to(skill_root)

    for match in LOCAL_LINK_RE.finditer(link_text):
        target = match.group(1).split("#", 1)[0].strip()
        if not target:
            continue
        if target.startswith("<") and target.endswith(">"):
            target = target[1:-1].strip()
        if "\\" in target:
            errors.append(f"{rel_path}: local markdown link uses a Windows-style path: {target}")
            continue
        target_path = (base_dir / target).resolve()
        try:
            target_path.relative_to(skill_root.resolve())
        except ValueError:
            errors.append(f"{rel_path}: local markdown link points outside the skill directory: {target}")
            continue
        if not target_path.exists():
            line = link_text.count("\n", 0, match.start()) + 1
            errors.append(f"{rel_path}:{line}: local markdown link target does not exist: {target}")

    return errors


def _validate_markdown_files(skill_root: Path) -> list[str]:
    errors: list[str] = []
    for path in skill_root.rglob("*.md"):
        rel_path = path.relative_to(skill_root)
        text = path.read_text(encoding="utf-8")
        semantic_text = _without_nonsemantic_regions(text)
        if PLACEHOLDER_RE.search(semantic_text):
            errors.append(f"{rel_path} contains TODO/TBD/FIXME or marker-style placeholder text")
        errors.extend(_validate_markdown_links(skill_root, path, text))
    return errors


def validate_skill(skill_path: Path) -> list[str]:
    errors: list[str] = []
    skill_root = skill_path.resolve()

    if not skill_root.exists():
        return [f"skill path does not exist: {skill_path}"]
    if not skill_root.is_dir():
        return [f"skill path is not a directory: {skill_path}"]

    skill_md = skill_root / "SKILL.md"
    if not skill_md.exists():
        return ["missing SKILL.md"]

    try:
        frontmatter, _body = _parse_frontmatter(skill_md)
    except ValueError as exc:
        return [str(exc)]

    errors.extend(_validate_frontmatter(frontmatter))
    errors.extend(_validate_markdown_files(skill_root))

    for directory_name in ("references", "scripts", "assets"):
        directory = skill_root / directory_name
        if directory.exists() and directory.is_dir() and not any(directory.iterdir()):
            errors.append(f"{directory_name}/ exists but is empty")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate basic Skill structure")
    parser.add_argument("skill_path", type=Path, help="Path to the skill directory")
    args = parser.parse_args()

    errors = validate_skill(args.skill_path)
    if errors:
        print("Skill validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Skill validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
