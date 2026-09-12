"""Build portable source packages without dependency or machine-state directories."""
from __future__ import annotations

import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[2]
PLUGIN_ENTRIES = (
    ".codex-plugin", ".claude-plugin", ".mcp.json", "assets", "bin", "package.json",
    "skills", "docs", "hooks", "LICENSE", "README.md", "README.en.md", "CHANGELOG.md",
)


def add_tree(archive: ZipFile, source: Path, destination: str) -> None:
    files = sorted(source.rglob("*")) if source.is_dir() else [source]
    for file in files:
        if not file.is_file() or "__pycache__" in file.parts or file.suffix == ".pyc":
            continue
        relative = file.relative_to(source) if source.is_dir() else Path()
        archive.write(file, str(Path(destination) / relative).replace("\\", "/"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with ZipFile(args.output / "Gei-skills.zip", "w", ZIP_DEFLATED) as archive:
        add_tree(archive, ROOT / "skills", "Gei")
    with ZipFile(args.output / "Gei-codex-plugin.zip", "w", ZIP_DEFLATED) as archive:
        for entry in PLUGIN_ENTRIES:
            add_tree(archive, ROOT / entry, f"gei/{entry}")
    print(f"Built Skills and plugin archives in {args.output}")


if __name__ == "__main__":
    main()
