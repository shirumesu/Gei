from __future__ import annotations

import argparse
import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


VERSION_HEADING_RE = re.compile(r"^##\s+(v?\d+\.\d+\.\d+)(?:\s+-\s+.*)?\s*$")
CONVENTIONAL_RE = re.compile(
    r"^(?P<type>[A-Za-z]+)(?:\([^)]+\))?(?P<breaking>!)?\s*[:：]\s*(?P<subject>.+)$"
)

BUMP_ORDER = {"none": 0, "patch": 1, "minor": 2, "major": 3}
BUMP_PREFIXES = {
    "feat": "patch",
    "fix": "patch",
    "perf": "patch",
    "minor": "minor",
    "major": "major",
}
GROUP_TITLES = {
    "feat": "Features",
    "fix": "Fixes",
    "perf": "Performance",
    "docs": "Documentation",
    "chore": "Maintenance",
    "test": "Tests",
    "ci": "CI",
    "build": "Build",
    "refactor": "Refactoring",
    "style": "Style",
    "revert": "Reverts",
    "other": "Other Changes",
}


@dataclass(frozen=True)
class Commit:
    subject: str
    body: str


@dataclass(frozen=True)
class ParsedCommit:
    group: str
    subject: str
    bump: str


def run_git(args: list[str]) -> str:
    return subprocess.check_output(["git", *args], text=True, encoding="utf-8").strip()


def latest_tag() -> str | None:
    try:
        return run_git(["describe", "--tags", "--match", "v*", "--abbrev=0"])
    except subprocess.CalledProcessError:
        return None


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
    raw = run_git(["log", "--format=%s%x1f%b%x1e", revision_range])
    commits: list[Commit] = []
    for entry in raw.split("\x1e"):
        entry = entry.strip()
        if not entry:
            continue
        subject, _, body = entry.partition("\x1f")
        commits.append(Commit(subject=subject.strip(), body=body.strip()))
    return commits


def parse_commit(commit: Commit) -> ParsedCommit:
    match = CONVENTIONAL_RE.match(commit.subject)
    if not match:
        return ParsedCommit(group="other", subject=commit.subject, bump="none")

    commit_type = match.group("type").lower()
    subject = match.group("subject").strip()
    release_as = re.search(r"^Release-As:\s*(major|minor|patch)\s*$", commit.body, re.MULTILINE | re.IGNORECASE)
    requested_bump = release_as.group(1).lower() if release_as else None
    is_breaking = bool(match.group("breaking")) or "BREAKING CHANGE:" in commit.body
    bump = requested_bump or ("major" if is_breaking else BUMP_PREFIXES.get(commit_type, "none"))
    group = commit_type if commit_type in GROUP_TITLES else "other"
    return ParsedCommit(group=group, subject=subject, bump=bump)


def choose_bump(commits: list[Commit]) -> str:
    bump = "none"
    for commit in commits:
        parsed = parse_commit(commit)
        if BUMP_ORDER[parsed.bump] > BUMP_ORDER[bump]:
            bump = parsed.bump
    return bump


def bump_version(version: str, bump: str) -> str:
    clean = version.removeprefix("v")
    major, minor, patch = [int(part) for part in clean.split(".")]
    if bump == "major":
        return f"v{major + 1}.0.0"
    if bump == "minor":
        return f"v{major}.{minor + 1}.0"
    if bump == "patch":
        return f"v{major}.{minor}.{patch + 1}"
    return f"v{major}.{minor}.{patch}"


def extract_changelog_entry(text: str, version: str) -> str | None:
    normalized = text.replace("\r\n", "\n")
    lines = normalized.split("\n")
    collecting = False
    collected: list[str] = []
    target = version.removeprefix("v")

    for line in lines:
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


def generated_notes(version: str, previous_tag: str | None, commits: list[Commit]) -> str:
    parsed_commits = [parse_commit(commit) for commit in commits]
    lines = [f"## {version}", ""]
    if previous_tag:
        lines.append(f"Changes since `{previous_tag}`.")
    else:
        lines.append("Initial generated release notes.")
    lines.append("")

    grouped: dict[str, list[str]] = {}
    for parsed in parsed_commits:
        grouped.setdefault(parsed.group, []).append(parsed.subject)

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


def write_github_output(name: str, value: str) -> None:
    output_name = os.environ.get("GITHUB_OUTPUT")
    if not output_name:
        return
    output_path = Path(output_name)
    with output_path.open("a", encoding="utf-8") as output:
        output.write(f"{name}={value}\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prepare the next Gei version and release notes."
    )
    parser.add_argument("changelog", help="Path to CHANGELOG.md.")
    parser.add_argument("output", help="Path to the output notes file.")
    parser.add_argument(
        "--mode",
        choices=("auto", "tag"),
        default="auto",
        help="auto computes the next version from commits; tag uses the current tag.",
    )
    parser.add_argument(
        "--tag",
        default=None,
        help="Current tag for tag mode. Defaults to git describe --tags --exact-match.",
    )
    args = parser.parse_args()

    if args.mode == "tag":
        version = args.tag or run_git(["describe", "--tags", "--exact-match"])
        previous_tag = previous_tag_for(version)
        commits = get_commits(commit_range(previous_tag, version))
        release_needed = True
    else:
        previous_tag = latest_tag()
        commits = get_commits(commit_range(previous_tag, "HEAD"))
        bump = choose_bump(commits)
        release_needed = bump != "none"
        version = bump_version(previous_tag or "v0.0.0", bump)

    write_github_output("release_needed", "true" if release_needed else "false")
    write_github_output("version", version)

    if not release_needed:
        Path(args.output).write_text("No release needed.\n", encoding="utf-8")
        return

    changelog_path = Path(args.changelog)
    changelog_text = changelog_path.read_text(encoding="utf-8") if changelog_path.exists() else ""
    notes = extract_changelog_entry(changelog_text, version)
    if notes is None:
        notes = generated_notes(version, previous_tag, commits)
    Path(args.output).write_text(notes, encoding="utf-8")


if __name__ == "__main__":
    main()
