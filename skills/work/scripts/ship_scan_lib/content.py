from __future__ import annotations

import os
import re

from .models import Finding, ScanFileResult
from .rules import (
    COMMON_UNIX_ROOTS,
    MINIFIED_AVG_LINE_LENGTH,
    MINIFIED_EXTENSIONS,
    MINIFIED_LINE_LENGTH,
    MINIFIED_WHITESPACE_RATIO,
    TRAILING_TRIM_CHARS,
)


_UNC_PATTERN = r"(?P<unc>\\\\[^\\/\s\"'`,;]+\\[^\\/\s\"'`,;]+(?:\\[^\r\n\"'<>|?*`]*)?)"
_WIN_PATTERN = r"(?P<windows>(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\r\n\"'<>|?*`]+)"
_UNIX_ROOT_PATTERN = "|".join(sorted(COMMON_UNIX_ROOTS))
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


def normalize_candidate(candidate: str) -> str:
    return candidate.rstrip(TRAILING_TRIM_CHARS)


def split_unix_segments(candidate: str) -> list[str]:
    return [segment for segment in candidate.split("/") if segment]


def has_placeholder_prefix(line: str, start: int) -> bool:
    prefix = line[:start].rstrip()
    return any(pattern.search(prefix) for pattern in _PLACEHOLDER_SUFFIXES)


def has_markup_prefix(line: str, start: int) -> bool:
    return start > 0 and line[start - 1] == "<"


def is_shebang_line(line: str, start: int) -> bool:
    return line.startswith("#!") and start <= 2


def is_scanner_internal_file(rel_path: str) -> bool:
    normalized = rel_path.replace("\\", "/")
    return normalized == "skills/work/scripts/ship_scan.py" or (
        "skills/work/scripts/ship_scan_lib/" in normalized
    )


def is_regex_definition_line(line: str) -> bool:
    return "_PATTERN" in line or "re.compile(" in line


def looks_like_regex_artifact(candidate: str, line: str, rel_path: str) -> bool:
    if not is_scanner_internal_file(rel_path) or not is_regex_definition_line(line):
        return False
    return any(token in candidate for token in ("[", "]", "(?:", "(?P<", "{", "}"))


def is_false_positive(
    candidate: str,
    kind: str,
    line: str,
    start: int,
    rel_path: str,
) -> bool:
    if not candidate or _URL_RE.match(candidate):
        return True
    if is_shebang_line(line, start):
        return True
    if has_placeholder_prefix(line, start):
        return True
    if looks_like_regex_artifact(candidate, line, rel_path):
        return True
    if kind == "unix" and has_markup_prefix(line, start):
        return True
    if kind in {"unc", "windows"}:
        return False

    body = candidate[1:]
    segments = split_unix_segments(candidate)
    if not segments:
        return True
    if _PKG_FILENAME_RE.match(candidate):
        return True
    if _HASH_RE.search(body):
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


def is_probably_binary(filepath: str) -> bool:
    try:
        with open(filepath, "rb") as handle:
            sample = handle.read(8192)
    except (OSError, PermissionError):
        return False
    return b"\0" in sample


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


def scan_sensitive_paths(
    line: str,
    lineno: int,
    rel_path: str,
    ignored_by_gitignore: bool | None,
) -> list[Finding]:
    findings: list[Finding] = []
    for match in ABS_PATH_RE.finditer(line):
        candidate = normalize_candidate(match.group())
        kind = match.lastgroup or "unknown"
        if is_false_positive(candidate, kind, line, match.start(), rel_path):
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
    return findings


CONTENT_SCANNERS = (scan_sensitive_paths,)


def scan_file_content(
    filepath: str,
    rel_path: str,
    ignored_by_gitignore: bool | None,
) -> tuple[list[Finding], bool]:
    findings: list[Finding] = []
    try:
        with open(filepath, encoding="utf-8", errors="replace") as handle:
            for lineno, line in enumerate(handle, start=1):
                for scanner in CONTENT_SCANNERS:
                    findings.extend(
                        scanner(line, lineno, rel_path, ignored_by_gitignore)
                    )
    except (OSError, PermissionError):
        return [], False
    return findings, True


def scan_candidate_file(
    filepath: str,
    rel_path: str,
    ignored_by_gitignore: bool | None,
    include_minified: bool,
) -> ScanFileResult:
    if is_probably_binary(filepath):
        return ScanFileResult(0, 0, 1, 0, [])
    if not include_minified and is_probably_minified(filepath):
        return ScanFileResult(0, 1, 0, 0, [])

    findings, readable = scan_file_content(
        filepath,
        rel_path,
        ignored_by_gitignore,
    )
    if not readable:
        return ScanFileResult(0, 0, 0, 1, [])
    return ScanFileResult(1, 0, 0, 0, findings)
