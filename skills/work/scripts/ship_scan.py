#!/usr/bin/env python3
"""
ship_scan.py

Usage:
  python ship_scan.py <project_root_path> [--format log|jsonl|table]
  python ship_scan.py <project_root_path> [--include-minified] [--include-ignored] [--workers N]

This scanner is intended for post-implementation mechanical review before a
project is distributed or uploaded. It reports hardcoded absolute paths plus
common junk artifacts.

Default Git mode defines the candidate distribution surface with:

  git ls-files --cached --others --exclude-standard

That means tracked files are scanned, untracked non-ignored files are scanned,
and ignored untracked files are skipped. Tracked files are scanned even if they
match ignore rules, because tracked files remain part of the repository
distribution surface.

Non-Git directory mode is a best-effort scan. It applies built-in skip rules and
may use the root .gitignore as a hint, but it does not implement full Git ignore
semantics. The most accurate final check is to run this scanner against the
actual staging or package directory that will be distributed.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from ship_scan_lib.output import print_jsonl, print_log, print_table
from ship_scan_lib.scanner import scan_project


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Scan a project or distribution directory for hardcoded absolute "
            "paths and common junk artifacts."
        )
    )
    parser.add_argument("root", help="Project, staging, or package directory to scan.")
    parser.add_argument(
        "--format",
        choices=("log", "jsonl", "table"),
        default="log",
        help="Output format. Defaults to human-readable log output.",
    )
    parser.add_argument(
        "--include-minified",
        action="store_true",
        help=(
            "Scan minified JS/CSS too. Off by default to keep the daily ship "
            "gate high-signal; skipped counts are reported in the summary."
        ),
    )
    parser.add_argument(
        "--include-ignored",
        action="store_true",
        help=(
            "Scan ignored files too. Git repositories then use directory mode "
            "with Git only as an ignored-file label source."
        ),
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=None,
        help="Number of file scanning workers. Defaults to an I/O-oriented automatic value.",
    )
    return parser.parse_args(argv)


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
    if args.format == "jsonl":
        print_jsonl(report)
    elif args.format == "table":
        print_table(report)
    else:
        print_log(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
