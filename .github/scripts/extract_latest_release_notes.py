from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from dataclasses import dataclass
from datetime import UTC, date, datetime
from pathlib import Path


VERSION_HEADING_RE = re.compile(r"^##\s+(v?\d+\.\d+\.\d+)(?:\s+-\s+.*)?\s*$")
CONVENTIONAL_RE = re.compile(
    r"^(?P<type>[A-Za-z]+)(?:\([^)]+\))?(?P<breaking>!)?\s*[:：]\s*(?P<subject>.+)$"
)

GROUP_TITLES = {
    "feat": "新功能",
    "fix": "修复",
    "perf": "性能优化",
}


@dataclass(frozen=True)
class Commit:
    sha: str
    subject: str
    body: str


@dataclass(frozen=True)
class ParsedCommit:
    group: str
    subject: str


def run_git(args: list[str]) -> str:
    return subprocess.check_output(["git", *args], text=True, encoding="utf-8").strip()


def previous_tag_for(tag: str) -> str | None:
    try:
        return run_git(["describe", "--tags", "--match", "v*", "--abbrev=0", f"{tag}^"])
    except subprocess.CalledProcessError:
        return None


def commit_range(previous_tag: str | None, end_ref: str) -> str:
    if previous_tag:
        return f"{previous_tag}..{end_ref}"
    return end_ref


def get_commits(revision_range: str) -> list[Commit]:
    raw = run_git(["log", "--format=%H%x1f%s%x1f%b%x1e", revision_range])
    commits: list[Commit] = []
    for entry in raw.split("\x1e"):
        entry = entry.strip()
        if not entry:
            continue
        sha, _, rest = entry.partition("\x1f")
        subject, _, body = rest.partition("\x1f")
        commits.append(Commit(sha=sha.strip(), subject=subject.strip(), body=body.strip()))
    return commits


def parse_commit(commit: Commit) -> ParsedCommit:
    match = CONVENTIONAL_RE.match(commit.subject)
    if not match:
        return ParsedCommit(group="", subject=commit.subject)
    commit_type = match.group("type").lower()
    subject = match.group("subject").strip()
    group = commit_type if commit_type in GROUP_TITLES else ""
    return ParsedCommit(group=group, subject=subject)


def extract_changelog_entry(path: Path, version: str) -> str | None:
    if not path.exists():
        return None

    collecting = False
    collected: list[str] = []
    target = version.removeprefix("v")

    with path.open(encoding="utf-8") as changelog:
        for raw_line in changelog:
            line = raw_line.rstrip("\n").rstrip("\r")
            match = VERSION_HEADING_RE.match(line)
            if match:
                heading_version = match.group(1).removeprefix("v")
                if collecting:
                    break
                collecting = heading_version == target
                if collecting:
                    collected.append(line)
                continue
            if collecting:
                collected.append(line)

    if not collected:
        return None

    body = "\n".join(collected).strip()
    return body + "\n" if body else None


def generated_notes(version: str, commits: list[Commit], release_date: date) -> str:
    parsed_commits = [parse_commit(commit) for commit in commits]
    lines = [f"## {version} - {release_date.year}-{release_date.month}-{release_date.day}", ""]

    grouped: dict[str, list[str]] = {}
    for parsed in parsed_commits:
        if parsed.group:
            grouped.setdefault(parsed.group, []).append(parsed.subject)

    if not grouped:
        return ""

    for group, title in GROUP_TITLES.items():
        subjects = grouped.get(group)
        if not subjects:
            continue
        lines.append(f"### {title}")
        lines.append("")
        for subject in subjects:
            lines.append(f"- {subject}")
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def prepend_changelog_entry(path: Path, notes: str) -> None:
    if not path.exists():
        path.write_text(f"# Changelog\n\n{notes}", encoding="utf-8")
        return

    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    insert_at = first_version_heading_offset(text)
    if insert_at is None:
        separator = "\n\n" if text and not text.endswith("\n\n") else ""
        path.write_text(f"{text}{separator}{notes}", encoding="utf-8")
        return

    before = text[:insert_at].rstrip()
    after = text[insert_at:].lstrip("\n")
    path.write_text(f"{before}\n\n{notes}\n{after}", encoding="utf-8")


def first_version_heading_offset(text: str) -> int | None:
    offset = 0
    for line in text.splitlines(keepends=True):
        if VERSION_HEADING_RE.match(line.rstrip("\n").rstrip("\r")):
            return offset
        offset += len(line)
    return None


def update_plugin_version(path: Path, version: str) -> bool:
    if not path.exists():
        return False

    data = json.loads(path.read_text(encoding="utf-8"))
    clean_version = version.removeprefix("v")
    if data.get("version") == clean_version:
        return False

    data["version"] = clean_version
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return True


def write_github_output(name: str, value: str) -> None:
    output_name = os.environ.get("GITHUB_OUTPUT")
    if not output_name:
        return
    output_path = Path(output_name)
    with output_path.open("a", encoding="utf-8") as output:
        output.write(f"{name}={value}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Gei tag release notes.")
    parser.add_argument("changelog", help="Path to CHANGELOG.md.")
    parser.add_argument("output", help="Path to the GitHub Release notes file.")
    parser.add_argument("--tag", required=True, help="Release tag, for example v1.2.3.")
    parser.add_argument(
        "--plugin-json",
        default=".codex-plugin/plugin.json",
        help="Path to the Codex plugin manifest.",
    )
    args = parser.parse_args()

    version = args.tag
    previous_tag = previous_tag_for(version)
    commits = get_commits(commit_range(previous_tag, version))
    changelog_path = Path(args.changelog)

    notes = extract_changelog_entry(changelog_path, version)
    changelog_changed = False
    if notes is None:
        release_date = datetime.now(UTC).date()
        notes = generated_notes(version, commits, release_date)
        if notes:
            prepend_changelog_entry(changelog_path, notes)
            changelog_changed = True

    plugin_changed = update_plugin_version(Path(args.plugin_json), version)
    Path(args.output).write_text(notes or "", encoding="utf-8")

    write_github_output("version", version)
    write_github_output("changelog_changed", "true" if changelog_changed else "false")
    write_github_output("plugin_changed", "true" if plugin_changed else "false")


if __name__ == "__main__":
    main()
