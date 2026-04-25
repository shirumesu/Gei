from __future__ import annotations

from dataclasses import dataclass


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


@dataclass(frozen=True)
class FileCandidate:
    filepath: str
    rel_path: str
    ignored_by_gitignore: bool | None


@dataclass(frozen=True)
class ScanFileResult:
    scanned_files: int
    skipped_minified_files: int
    skipped_binary_files: int
    skipped_unreadable_files: int
    findings: list[Finding]


@dataclass(frozen=True)
class ReportStats:
    sensitive_paths: int
    junk_files: int
    findings: int


@dataclass
class ScanReport:
    root: str
    scanner_platform: str
    scan_mode: str
    ignore_source: str
    scanned_files: int
    skipped_ignored_files: int
    skipped_minified_files: int
    skipped_binary_files: int
    skipped_unreadable_files: int
    findings: list[Finding]


Rule = tuple[str, str, str]
JunkMatch = tuple[str, str] | None
