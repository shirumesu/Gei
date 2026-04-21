from __future__ import annotations

import argparse
from pathlib import Path

CHANGELOG_HEADING = "## 更新日志 / 新发现"


def extract_latest_release_notes(text: str) -> str:
    normalized = text.replace("\r\n", "\n")
    section_start = normalized.find(CHANGELOG_HEADING)
    if section_start == -1:
        raise ValueError(f"Could not find changelog heading: {CHANGELOG_HEADING}")

    lines = normalized[section_start + len(CHANGELOG_HEADING) :].split("\n")
    collecting = False
    collected: list[str] = []

    for line in lines:
        if not collecting:
            if line.startswith("### "):
                collecting = True
                collected.append(line)
            continue

        if line.startswith("### ") or line.startswith("## ") or line.lstrip().startswith("<details"):
            break

        collected.append(line)

    if not collected:
        raise ValueError("Could not find the latest changelog entry under the changelog heading.")

    return "\n".join(collected).strip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract the latest release notes block from README.md."
    )
    parser.add_argument("readme", help="Path to the README file.")
    parser.add_argument("output", help="Path to the output notes file.")
    args = parser.parse_args()

    readme_path = Path(args.readme)
    output_path = Path(args.output)

    notes = extract_latest_release_notes(readme_path.read_text(encoding="utf-8"))
    output_path.write_text(notes, encoding="utf-8")


if __name__ == "__main__":
    main()
