from __future__ import annotations

import json
import shutil
import textwrap

from .models import ReportStats, ScanReport


def build_report_stats(report: ScanReport) -> ReportStats:
    sensitive_paths = sum(
        1 for finding in report.findings if finding.type == "sensitive_path"
    )
    junk_files = sum(
        1 for finding in report.findings if finding.type == "junk_file"
    )
    return ReportStats(
        sensitive_paths=sensitive_paths,
        junk_files=junk_files,
        findings=len(report.findings),
    )


def iter_jsonl_records(report: ScanReport):
    stats = build_report_stats(report)

    yield {
        "type": "summary",
        "root": report.root,
        "scanner_platform": report.scanner_platform,
        "scan_mode": report.scan_mode,
        "ignore_source": report.ignore_source,
        "scanned_files": report.scanned_files,
        "skipped_ignored_files": report.skipped_ignored_files,
        "skipped_minified_files": report.skipped_minified_files,
        "skipped_binary_files": report.skipped_binary_files,
        "skipped_unreadable_files": report.skipped_unreadable_files,
        "sensitive_paths": stats.sensitive_paths,
        "junk_files": stats.junk_files,
        "findings": stats.findings,
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


def ignored_label(value: bool | None) -> str:
    if value is True:
        return "yes"
    if value is False:
        return "no"
    return "n/a"


def finding_location(file: str, line: int | None) -> str:
    if line is None:
        return file
    return f"{file}:{line}"


def print_log(report: ScanReport) -> None:
    stats = build_report_stats(report)
    print(
        "Info: summary | "
        f"mode: {report.scan_mode} | "
        f"ignore: {report.ignore_source} | "
        f"files: {report.scanned_files} | "
        f"minified: {report.skipped_minified_files} | "
        f"binary: {report.skipped_binary_files} | "
        f"unreadable: {report.skipped_unreadable_files} | "
        f"findings: {stats.findings}"
    )

    if stats.findings == 0:
        print("Info: no sensitive paths or junk files found")
        return

    for finding in report.findings:
        print(
            f"Warning: [{finding.type}:{finding.kind}] found | "
            f"value: {finding.value} | "
            f"location: {finding_location(finding.file, finding.line)} | "
            f"ignored: {ignored_label(finding.ignored_by_gitignore)}"
        )


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
    stats = build_report_stats(report)

    print(f"root        : {report.root}")
    print(f"scanner     : {report.scanner_platform}")
    print(f"mode        : {report.scan_mode}")
    print(f"ignore      : {report.ignore_source}")
    print(f"files       : {report.scanned_files}")
    print(f"ignored     : {report.skipped_ignored_files}")
    print(f"minified    : {report.skipped_minified_files}")
    print(f"binary      : {report.skipped_binary_files}")
    print(f"unreadable  : {report.skipped_unreadable_files}")
    print(f"sensitive   : {stats.sensitive_paths}")
    print(f"junk        : {stats.junk_files}")
    print(f"findings    : {stats.findings}")
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
            ignored_label(finding.ignored_by_gitignore),
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
