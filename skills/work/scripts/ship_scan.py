#!/usr/bin/env python3
"""
ship_scan.py

Usage:
  python ship_scan.py <project_root_path> [--format jsonl|table] [--include-minified]

This scanner is intended for post-implementation mechanical review. It reports
hardcoded absolute paths plus common junk artifacts that are not excluded by
.gitignore. It defaults to JSONL output because the primary consumer is another
agent, not a human.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import fnmatch
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import textwrap
from dataclasses import dataclass


CURRENT_OS = platform.system()


# We keep the raw candidate regexes fairly small, then do contextual filtering
# afterward. That is much easier to reason about than one giant "perfect" regex.
_UNC_PATTERN = r"(?P<unc>\\\\[^\\/\s\"'`,;]+\\[^\\/\s\"'`,;]+(?:\\[^\r\n\"'<>|?*`]*)?)"
_WIN_PATTERN = r"(?P<windows>(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\r\n\"'<>|?*`]+)"
_UNIX_ROOT_PATTERN = (
    r"Applications|bin|cache|code|data|dev|etc|home|Library|mnt|opt|"
    r"private|proc|root|run|sbin|srv|sys|tmp|Users|usr|var|"
    r"Volumes|workspace|workspaces"
)
_UNIX_PATTERN = (
    r"(?P<unix>"
    r"(?<![A-Za-z0-9_.`~/-])"
    rf"/(?:{_UNIX_ROOT_PATTERN})(?:/[^\s\"'\\`<>{{}}\[\](),;:]+)*"
    r")"
)

ABS_PATH_RE = re.compile(
    "|".join((_UNC_PATTERN, _WIN_PATTERN, _UNIX_PATTERN)),
    re.IGNORECASE,
)

_URL_RE = re.compile(r"^(https?|ftp|ftps|ssh|git|svn|file)://", re.IGNORECASE)
_PKG_FILENAME_RE = re.compile(
    r"^/[A-Za-z][A-Za-z0-9._-]*-\d[\d.]*\.(tgz|tar\.gz|whl|zip|gem|egg|nupkg|deb|rpm)$",
    re.IGNORECASE,
)
_HASH_RE = re.compile(r"[+/=]{2,}|[A-Za-z0-9+/]{60,}")

_PLACEHOLDER_SUFFIXES = (
    re.compile(r"<[^>\n]+>\s*$"),
    re.compile(r"\$\{[^}\n]+\}\s*$"),
    re.compile(r"%[A-Za-z_][A-Za-z0-9_]*%\s*$"),
)

COMMON_UNIX_ROOTS = {
    "Applications",
    "bin",
    "cache",
    "code",
    "data",
    "dev",
    "etc",
    "home",
    "Library",
    "mnt",
    "opt",
    "private",
    "proc",
    "root",
    "run",
    "sbin",
    "srv",
    "sys",
    "tmp",
    "Users",
    "usr",
    "var",
    "Volumes",
    "workspace",
    "workspaces",
}

MINIFIED_EXTENSIONS = {".js", ".cjs", ".mjs", ".css"}
MINIFIED_LINE_LENGTH = 400
MINIFIED_AVG_LINE_LENGTH = 200
MINIFIED_WHITESPACE_RATIO = 0.1

TRAILING_TRIM_CHARS = ".,;:)]}>"


SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "__pycache__",
    ".tox",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    ".idea",
    ".vscode",
    ".mypy_cache",
    ".pytest_cache",
    "coverage",
    ".next",
    ".nuxt",
}

SKIP_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".class",
    ".jar",
    ".o",
    ".a",
    ".so",
    ".dylib",
    ".exe",
    ".dll",
    ".pdb",
    ".wasm",
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".7z",
    ".rar",
    ".tgz",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".webp",
    ".mp3",
    ".mp4",
    ".wav",
    ".ogg",
    ".avi",
    ".mov",
    ".mkv",
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
    ".lock",
}

SKIP_FILENAMES = {
    "package-lock.json",
    "npm-shrinkwrap.json",
    "Pipfile.lock",
    "poetry.lock",
    "Gemfile.lock",
    "Cargo.lock",
    "packages.lock.json",
    "go.sum",
}

JUNK_DIR_NAMES = {
    "__pycache__": (
        "python_bytecode_cache",
        "Python bytecode cache directory.",
    ),
    ".pytest_cache": ("pytest_cache", "pytest cache directory."),
    ".mypy_cache": ("mypy_cache", "mypy cache directory."),
    ".ruff_cache": ("ruff_cache", "ruff cache directory."),
    ".hypothesis": ("hypothesis_cache", "Hypothesis cache directory."),
    ".tox": ("tox_environment", "tox environment directory."),
    ".nox": ("nox_environment", "nox environment directory."),
    ".venv": ("virtual_environment", "Local virtual environment directory."),
    "venv": ("virtual_environment", "Local virtual environment directory."),
    "htmlcov": ("coverage_html_report", "Coverage HTML output directory."),
    ".ipynb_checkpoints": (
        "notebook_checkpoint",
        "Jupyter notebook checkpoint directory.",
    ),
    ".eggs": ("python_build_artifact", "Setuptools build artifact directory."),
    ".parcel-cache": ("bundler_cache", "Bundler cache directory."),
    ".sass-cache": ("style_cache", "Style compiler cache directory."),
    ".turbo": ("task_cache", "Task runner cache directory."),
}

JUNK_DIR_PATTERNS = (
    ("*.egg-info", "python_build_metadata", "Python build metadata directory."),
)

JUNK_FILE_NAMES = {
    ".ds_store": ("os_metadata", "macOS Finder metadata file."),
    "thumbs.db": ("os_metadata", "Windows thumbnail cache file."),
    "desktop.ini": ("os_metadata", "Windows desktop metadata file."),
    ".coverage": ("coverage_data", "Coverage data file."),
}

JUNK_FILE_PATTERNS = (
    (".coverage.*", "coverage_data", "Coverage data file."),
    ("*.pyc", "python_bytecode", "Python bytecode file."),
    ("*.pyo", "python_bytecode", "Python bytecode file."),
    ("*$py.class", "python_bytecode", "Jython bytecode file."),
    ("*.tmp", "temporary_file", "Temporary file."),
    ("*.temp", "temporary_file", "Temporary file."),
    ("*.swp", "editor_swap", "Editor swap file."),
    ("*.swo", "editor_swap", "Editor swap file."),
    ("*~", "editor_backup", "Editor backup file."),
    ("*.bak", "backup_file", "Backup file."),
    ("*.orig", "merge_backup", "Merge backup file."),
    ("*.rej", "patch_reject", "Rejected patch file."),
    ("npm-debug.log*", "package_manager_debug_log", "npm debug log."),
    ("yarn-debug.log*", "package_manager_debug_log", "Yarn debug log."),
    ("yarn-error.log*", "package_manager_debug_log", "Yarn error log."),
    ("pnpm-debug.log*", "package_manager_debug_log", "pnpm debug log."),
)


@dataclass(frozen=True)
class Finding:
    type: str
    kind: str
    value: str
    file: str
    line: int | None
    column: int | None
    ignored_by_gitignore: bool | None
    snippet: str


@dataclass
class ScanReport:
    root: str
    platform: str
    gitignore: bool
    scanned_files: int
    skipped_ignored_files: int
    skipped_minified_files: int
    findings: list[Finding]


@dataclass(frozen=True)
class ScanFileResult:
    scanned_files: int
    skipped_minified_files: int
    findings: list[Finding]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scan a project for hardcoded absolute paths and junk artifacts."
    )
    parser.add_argument("root", help="Project root to scan")
    parser.add_argument(
        "--format",
        choices=("jsonl", "table"),
        default="jsonl",
        help="Output format. Defaults to jsonl because the caller is usually an agent.",
    )
    parser.add_argument(
        "--include-minified",
        action="store_true",
        help="Scan minified JS/CSS files too. Off by default because they create noise.",
    )
    parser.add_argument(
        "--include-ignored",
        action="store_true",
        help="Scan files matched by .gitignore too. Off by default because ship review usually cares about shippable files.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=None,
        help="Number of file scanning workers. Defaults to an I/O-oriented automatic value.",
    )
    return parser.parse_args(argv)


def load_gitignore_patterns(root: str):
    gitignore_path = os.path.join(root, ".gitignore")
    if not os.path.isfile(gitignore_path):
        return None

    patterns = []
    with open(gitignore_path, encoding="utf-8", errors="replace") as handle:
        for raw_line in handle:
            line = raw_line.rstrip("\n").rstrip("\r")
            if not line or line.startswith("#"):
                continue
            negation = line.startswith("!")
            if negation:
                line = line[1:]
            dir_only = line.endswith("/")
            if dir_only:
                line = line.rstrip("/")
            patterns.append((line.strip(), negation, dir_only))
    return patterns


def is_ignored_by_gitignore(filepath: str, root: str, patterns) -> bool:
    if patterns is None:
        return False

    rel_path = os.path.relpath(filepath, root)
    rel_fwd = rel_path.replace(os.sep, "/")
    parts = rel_fwd.split("/")

    ignored = False
    for pattern, negation, _dir_only in patterns:
        normalized_pattern = pattern.lstrip("/")
        matched = (
            fnmatch.fnmatch(rel_fwd, normalized_pattern)
            or fnmatch.fnmatch(parts[-1], normalized_pattern)
            or any(fnmatch.fnmatch(part, normalized_pattern) for part in parts)
        )
        if not matched and "/" in normalized_pattern and not any(char in normalized_pattern for char in "*?[]"):
            matched = rel_fwd == normalized_pattern or rel_fwd.startswith(normalized_pattern + "/")
        if matched:
            ignored = not negation
    return ignored


def _path_contains_skipped_dir(dirpath: str, root: str) -> bool:
    rel_path = os.path.relpath(dirpath, root)
    if rel_path == ".":
        return False
    parts = rel_path.replace(os.sep, "/").split("/")
    return any(part in SKIP_DIRS or (part.startswith(".") and part != ".") for part in parts)


def list_project_root_entries(root: str) -> set[str]:
    try:
        return {name.casefold() for name in os.listdir(root)}
    except OSError:
        return set()


def load_git_tracked_files(root: str) -> set[str] | None:
    try:
        result = subprocess.run(
            ["git", "-C", root, "ls-files", "-z"],
            capture_output=True,
            text=False,
            check=False,
        )
    except OSError:
        return None

    if result.returncode != 0:
        return None

    entries = result.stdout.decode("utf-8", errors="replace").split("\0")
    return {entry for entry in entries if entry}


def load_git_scan_files(root: str) -> list[str] | None:
    try:
        result = subprocess.run(
            [
                "git",
                "-C",
                root,
                "ls-files",
                "-z",
                "--cached",
                "--others",
                "--exclude-standard",
            ],
            capture_output=True,
            text=False,
            check=False,
        )
    except OSError:
        return None

    if result.returncode != 0:
        return None

    entries = result.stdout.decode("utf-8", errors="replace").split("\0")
    return [entry for entry in entries if entry]


def is_ignored_by_git(root: str, rel_path: str) -> bool | None:
    try:
        result = subprocess.run(
            ["git", "-C", root, "check-ignore", "-q", "--", rel_path],
            capture_output=True,
            text=False,
            check=False,
        )
    except OSError:
        return None

    if result.returncode == 0:
        return True
    if result.returncode == 1:
        return False
    return None


def default_worker_count() -> int:
    return min(32, (os.cpu_count() or 1) * 4)


def normalize_worker_count(workers: int | None) -> int:
    if workers is None:
        return default_worker_count()
    return max(1, workers)


def normalize_candidate(candidate: str) -> str:
    return candidate.rstrip(TRAILING_TRIM_CHARS)


def split_unix_segments(candidate: str) -> list[str]:
    return [segment for segment in candidate.split("/") if segment]


def has_placeholder_prefix(line: str, start: int) -> bool:
    prefix = line[:start].rstrip()
    return any(pattern.search(prefix) for pattern in _PLACEHOLDER_SUFFIXES)


def has_markup_prefix(line: str, start: int) -> bool:
    return start > 0 and line[start - 1] == "<"


def looks_like_project_relative_unix(candidate: str, project_root_entries: set[str]) -> bool:
    segments = split_unix_segments(candidate)
    if not segments:
        return False
    return segments[0].casefold() in project_root_entries


def is_shebang_line(line: str, start: int) -> bool:
    return line.startswith("#!") and start <= 2


def is_regex_definition_line(line: str) -> bool:
    return "_PATTERN" in line or "re.compile(" in line


def looks_like_regex_artifact(candidate: str, line: str) -> bool:
    if not is_regex_definition_line(line):
        return False

    return any(token in candidate for token in ("[", "]", "(?:", "(?P<", "{", "}"))


def is_probably_minified(filepath: str) -> bool:
    _, ext = os.path.splitext(filepath)
    if ext.lower() not in MINIFIED_EXTENSIONS:
        return False
    if filepath.lower().endswith(".min.js") or filepath.lower().endswith(".min.css"):
        return True

    try:
        with open(filepath, encoding="utf-8", errors="replace") as handle:
            sample = handle.read(8192)
    except (OSError, PermissionError):
        return False

    if not sample:
        return False

    lines = sample.splitlines() or [sample]
    longest_line = max(len(line) for line in lines)
    average_line_length = len(sample) / max(len(lines), 1)
    whitespace_count = sum(char.isspace() for char in sample)
    whitespace_ratio = whitespace_count / max(len(sample), 1)

    return (
        longest_line >= MINIFIED_LINE_LENGTH
        and average_line_length >= MINIFIED_AVG_LINE_LENGTH
        and whitespace_ratio <= MINIFIED_WHITESPACE_RATIO
    )


def is_false_positive(
    candidate: str,
    kind: str,
    line: str,
    start: int,
    project_root_entries: set[str],
) -> bool:
    if not candidate or _URL_RE.match(candidate):
        return True

    if is_shebang_line(line, start):
        return True

    if has_placeholder_prefix(line, start):
        return True

    if looks_like_regex_artifact(candidate, line):
        return True

    if kind == "unix" and has_markup_prefix(line, start):
        return True

    if kind == "unc":
        return False

    if kind == "windows":
        return False

    body = candidate[1:]
    segments = split_unix_segments(candidate)
    if not segments:
        return True

    if _PKG_FILENAME_RE.match(candidate):
        return True

    if _HASH_RE.search(body):
        return True

    if looks_like_project_relative_unix(candidate, project_root_entries):
        return True

    if segments[0] not in COMMON_UNIX_ROOTS:
        return True

    if len(segments) == 1 and len(segments[0]) < 4:
        return True

    return False


def build_snippet(line: str, start: int, end: int, limit: int = 120) -> str:
    text = line.rstrip("\r\n")
    if len(text) <= limit:
        return text.strip()

    window_start = max(0, start - (limit // 3))
    window_end = min(len(text), max(end + (limit // 3), window_start + limit))
    snippet = text[window_start:window_end]

    if window_start > 0:
        snippet = "..." + snippet
    if window_end < len(text):
        snippet = snippet + "..."
    return snippet.strip()


def classify_junk_name(
    name: str,
    exact_rules,
    pattern_rules,
):
    lowered_name = name.casefold()
    exact_match = exact_rules.get(lowered_name)
    if exact_match is not None:
        return exact_match

    for pattern, kind, message in pattern_rules:
        if fnmatch.fnmatch(lowered_name, pattern):
            return kind, message

    return None


def should_skip_ignored_file(
    rel_path: str,
    ignored_by_gitignore: bool | None,
    tracked_files: set[str] | None,
) -> bool:
    return (
        ignored_by_gitignore is True
        and (tracked_files is None or rel_path not in tracked_files)
    )


def build_junk_finding(
    rel_path: str,
    kind: str,
    ignored_by_gitignore: bool | None,
    message: str,
) -> Finding:
    return Finding(
        type="junk_file",
        kind=kind,
        value=rel_path,
        file=rel_path,
        line=None,
        column=None,
        ignored_by_gitignore=ignored_by_gitignore,
        snippet=message,
    )


def scan_file(
    filepath: str,
    rel_path: str,
    ignored_by_gitignore: bool | None,
    project_root_entries: set[str],
):
    findings: list[Finding] = []
    try:
        with open(filepath, encoding="utf-8", errors="replace") as handle:
            for lineno, line in enumerate(handle, start=1):
                for match in ABS_PATH_RE.finditer(line):
                    candidate = normalize_candidate(match.group())
                    kind = match.lastgroup or "unknown"
                    if is_false_positive(
                        candidate,
                        kind,
                        line,
                        match.start(),
                        project_root_entries,
                    ):
                        continue

                    findings.append(
                        Finding(
                            type="sensitive_path",
                            kind=kind,
                            value=candidate,
                            file=rel_path,
                            line=lineno,
                            column=match.start() + 1,
                            ignored_by_gitignore=ignored_by_gitignore,
                            snippet=build_snippet(line, match.start(), match.end()),
                        )
                    )
    except (OSError, PermissionError):
        return []

    return findings


def scan_candidate_file(
    filepath: str,
    rel_path: str,
    ignored_by_gitignore: bool | None,
    project_root_entries: set[str],
    include_minified: bool,
) -> ScanFileResult:
    if not include_minified and is_probably_minified(filepath):
        return ScanFileResult(
            scanned_files=0,
            skipped_minified_files=1,
            findings=[],
        )

    return ScanFileResult(
        scanned_files=1,
        skipped_minified_files=0,
        findings=scan_file(
            filepath,
            rel_path,
            ignored_by_gitignore,
            project_root_entries,
        ),
    )


def scan_junk_dirs(
    root: str,
    patterns,
    use_git_ignore: bool,
) -> list[Finding]:
    findings: list[Finding] = []

    for dirpath, dirnames, _filenames in os.walk(root):
        kept_dirnames = []

        for dirname in dirnames:
            full_dir_path = os.path.join(dirpath, dirname)
            rel_dir_path = os.path.relpath(full_dir_path, root).replace(os.sep, "/")
            ignored_by_gitignore: bool | None
            if use_git_ignore:
                ignored_by_gitignore = is_ignored_by_git(root, rel_dir_path)
            else:
                ignored_by_gitignore = (
                    is_ignored_by_gitignore(full_dir_path, root, patterns)
                    if patterns is not None
                    else None
                )

            junk_dir = classify_junk_name(
                dirname,
                JUNK_DIR_NAMES,
                JUNK_DIR_PATTERNS,
            )
            if junk_dir is not None and ignored_by_gitignore is not True:
                kind, message = junk_dir
                findings.append(
                    build_junk_finding(
                        rel_dir_path,
                        kind,
                        ignored_by_gitignore,
                        message,
                    )
                )

            if (
                dirname in SKIP_DIRS
                or dirname.startswith(".")
                or ignored_by_gitignore is True
            ):
                continue

            kept_dirnames.append(dirname)

        dirnames[:] = kept_dirnames

    return findings


def scan_project(
    root: str,
    include_minified: bool = False,
    include_ignored: bool = False,
    workers: int | None = None,
) -> ScanReport:
    patterns = load_gitignore_patterns(root)
    tracked_files = load_git_tracked_files(root)
    project_root_entries = list_project_root_entries(root)
    findings: list[Finding] = []
    scanned_files = 0
    skipped_ignored_files = 0
    skipped_minified_files = 0
    git_scan_files = None if include_ignored else load_git_scan_files(root)

    if git_scan_files is not None:
        findings.extend(
            scan_junk_dirs(
                root,
                patterns,
                use_git_ignore=True,
            )
        )

        content_candidates: list[tuple[str, str]] = []
        for rel_path in git_scan_files:
            filename = os.path.basename(rel_path)
            if filename in SKIP_FILENAMES:
                continue

            junk_file = classify_junk_name(
                filename,
                JUNK_FILE_NAMES,
                JUNK_FILE_PATTERNS,
            )
            if junk_file is not None:
                kind, message = junk_file
                findings.append(
                    build_junk_finding(
                        rel_path,
                        kind,
                        False,
                        message,
                    )
                )
                continue

            _, ext = os.path.splitext(filename)
            if ext.lower() in SKIP_EXTENSIONS:
                continue

            content_candidates.append((os.path.join(root, rel_path), rel_path))

        worker_count = normalize_worker_count(workers)
        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            results = executor.map(
                lambda candidate: scan_candidate_file(
                    candidate[0],
                    candidate[1],
                    False,
                    project_root_entries,
                    include_minified,
                ),
                content_candidates,
            )
            for result in results:
                scanned_files += result.scanned_files
                skipped_minified_files += result.skipped_minified_files
                findings.extend(result.findings)

        return ScanReport(
            root=os.path.abspath(root),
            platform=CURRENT_OS,
            gitignore=True,
            scanned_files=scanned_files,
            skipped_ignored_files=skipped_ignored_files,
            skipped_minified_files=skipped_minified_files,
            findings=findings,
        )

    for dirpath, dirnames, filenames in os.walk(root):
        if _path_contains_skipped_dir(dirpath, root):
            dirnames.clear()
            continue

        for dirname in dirnames:
            junk_dir = classify_junk_name(
                dirname,
                JUNK_DIR_NAMES,
                JUNK_DIR_PATTERNS,
            )
            if junk_dir is None:
                continue

            full_dir_path = os.path.join(dirpath, dirname)
            rel_dir_path = os.path.relpath(full_dir_path, root).replace(os.sep, "/")
            ignored_by_gitignore = (
                is_ignored_by_git(root, rel_dir_path)
                if tracked_files is not None
                else is_ignored_by_gitignore(full_dir_path, root, patterns)
                if patterns is not None
                else None
            )
            if ignored_by_gitignore is True:
                continue

            kind, message = junk_dir
            findings.append(
                build_junk_finding(
                    rel_dir_path,
                    kind,
                    ignored_by_gitignore,
                    message,
                )
            )

        dirnames[:] = [
            dirname
            for dirname in dirnames
            if dirname not in SKIP_DIRS and not dirname.startswith(".")
        ]

        for filename in filenames:
            if filename in SKIP_FILENAMES:
                continue

            full_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(full_path, root).replace(os.sep, "/")
            ignored_by_gitignore = (
                is_ignored_by_git(root, rel_path)
                if tracked_files is not None
                else is_ignored_by_gitignore(full_path, root, patterns)
                if patterns is not None
                else None
            )

            junk_file = classify_junk_name(
                filename,
                JUNK_FILE_NAMES,
                JUNK_FILE_PATTERNS,
            )
            if junk_file is not None:
                if should_skip_ignored_file(rel_path, ignored_by_gitignore, tracked_files):
                    skipped_ignored_files += 1
                    continue

                kind, message = junk_file
                findings.append(
                    build_junk_finding(
                        rel_path,
                        kind,
                        ignored_by_gitignore,
                        message,
                    )
                )
                continue

            _, ext = os.path.splitext(filename)
            if ext.lower() in SKIP_EXTENSIONS:
                continue

            if not include_ignored and should_skip_ignored_file(
                rel_path,
                ignored_by_gitignore,
                tracked_files,
            ):
                skipped_ignored_files += 1
                continue

            if not include_minified and is_probably_minified(full_path):
                skipped_minified_files += 1
                continue

            scanned_files += 1
            findings.extend(
                scan_file(
                    full_path,
                    rel_path,
                    ignored_by_gitignore,
                    project_root_entries,
                )
            )

    return ScanReport(
        root=os.path.abspath(root),
        platform=CURRENT_OS,
        gitignore=patterns is not None,
        scanned_files=scanned_files,
        skipped_ignored_files=skipped_ignored_files,
        skipped_minified_files=skipped_minified_files,
        findings=findings,
    )


def iter_jsonl_records(report: ScanReport):
    sensitive_paths = sum(
        1 for finding in report.findings if finding.type == "sensitive_path"
    )
    junk_files = sum(
        1 for finding in report.findings if finding.type == "junk_file"
    )

    yield {
        "type": "summary",
        "root": report.root,
        "platform": report.platform,
        "gitignore": report.gitignore,
        "scanned_files": report.scanned_files,
        "skipped_ignored_files": report.skipped_ignored_files,
        "skipped_minified_files": report.skipped_minified_files,
        "sensitive_paths": sensitive_paths,
        "junk_files": junk_files,
        "findings": len(report.findings),
    }

    for finding in report.findings:
        yield {
            "type": finding.type,
            "kind": finding.kind,
            "value": finding.value,
            "file": finding.file,
            "line": finding.line,
            "column": finding.column,
            "ignored_by_gitignore": finding.ignored_by_gitignore,
            "snippet": finding.snippet,
        }


def print_jsonl(report: ScanReport) -> None:
    for record in iter_jsonl_records(report):
        print(json.dumps(record, ensure_ascii=False))


def table_column_limits(headers: list[str]) -> list[int]:
    terminal_width = shutil.get_terminal_size((120, 20)).columns
    fixed_width = len("  ") * (len(headers) - 1)
    available = max(40, terminal_width - fixed_width)

    preferred = [14, 28, 48, 48, 8, 7]
    total_preferred = sum(preferred)
    if total_preferred <= available:
        return preferred

    minimum = [14, 12, 14, 14, 4, 7]
    extra = max(0, available - sum(minimum))
    flexible_indexes = (1, 2, 3)
    limits = minimum[:]
    while extra > 0 and sum(limits) < total_preferred:
        changed = False
        for index in flexible_indexes:
            if extra <= 0:
                break
            if limits[index] < preferred[index]:
                limits[index] += 1
                extra -= 1
                changed = True
        if not changed:
            break
    return limits


def wrap_cell(value: str, width: int) -> list[str]:
    wrapped = textwrap.wrap(
        value,
        width=max(1, width),
        break_long_words=True,
        break_on_hyphens=False,
        replace_whitespace=False,
        drop_whitespace=False,
    )
    return wrapped or [""]


def format_wrapped_row(row: list[str], widths: list[int]) -> list[str]:
    wrapped_cells = [
        wrap_cell(cell, widths[index]) for index, cell in enumerate(row)
    ]
    row_height = max(len(cell_lines) for cell_lines in wrapped_cells)
    lines = []

    for line_index in range(row_height):
        pieces = []
        for cell_index, cell_lines in enumerate(wrapped_cells):
            value = cell_lines[line_index] if line_index < len(cell_lines) else ""
            pieces.append(value.ljust(widths[cell_index]))
        lines.append("  ".join(pieces).rstrip())

    return lines


def print_table(report: ScanReport) -> None:
    sensitive_paths = sum(
        1 for finding in report.findings if finding.type == "sensitive_path"
    )
    junk_files = sum(
        1 for finding in report.findings if finding.type == "junk_file"
    )

    print(f"root      : {report.root}")
    print(f"platform  : {report.platform}")
    print(f"gitignore : {'yes' if report.gitignore else 'no'}")
    print(f"files     : {report.scanned_files}")
    print(f"ignored   : {report.skipped_ignored_files}")
    print(f"minified  : {report.skipped_minified_files}")
    print(f"sensitive : {sensitive_paths}")
    print(f"junk      : {junk_files}")
    print(f"findings  : {len(report.findings)}")
    print()

    if not report.findings:
        print("No sensitive paths or junk files found.")
        return

    headers = ["type", "kind", "value", "file", "line", "ignored"]
    rows = [
        [
            finding.type,
            finding.kind,
            finding.value,
            finding.file,
            "-" if finding.line is None else str(finding.line),
            (
                "yes"
                if finding.ignored_by_gitignore is True
                else "no"
                if finding.ignored_by_gitignore is False
                else "n/a"
            ),
        ]
        for finding in report.findings
    ]

    widths = table_column_limits(headers)

    def format_row(row: list[str]) -> str:
        return "  ".join(cell.ljust(widths[index]) for index, cell in enumerate(row))

    print(format_row(headers))
    print("  ".join("-" * width for width in widths))
    for row in rows:
        for line in format_wrapped_row(row, widths):
            print(line)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    root = os.path.abspath(args.root)

    if not os.path.isdir(root):
        print(
            json.dumps(
                {
                    "type": "error",
                    "message": f'"{root}" is not a valid directory.',
                },
                ensure_ascii=False,
            )
        )
        return 1

    report = scan_project(
        root,
        include_minified=args.include_minified,
        include_ignored=args.include_ignored,
        workers=args.workers,
    )
    if args.format == "table":
        print_table(report)
    else:
        print_jsonl(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
