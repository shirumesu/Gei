#!/usr/bin/env python3
"""Smoke-test Python script entrypoints inside a Skill directory.

Each non-excepted `.py` file is run with `--help` and must exit 0 within the
timeout. This catches broken imports, argparse failures, and script files that
were accidentally shipped as runnable tools.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


EXCLUDED_DIRS = {"__pycache__", ".venv", "venv", "node_modules"}


def find_python_files(root: Path) -> list[Path]:
    if not root.is_dir():
        return []
    files: list[Path] = []
    for path in sorted(root.glob("*.py")):
        if any(part in EXCLUDED_DIRS for part in path.parts):
            continue
        files.append(path)
    return files


def smoke_one(path: Path, timeout: int) -> dict:
    try:
        proc = subprocess.run(
            [sys.executable, str(path), "--help"],
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(path.parent),
        )
    except subprocess.TimeoutExpired:
        return {"file": str(path), "ok": False, "detail": f"timeout after {timeout}s"}
    except OSError as exc:
        return {"file": str(path), "ok": False, "detail": f"could not execute: {exc}"}

    if proc.returncode != 0:
        tail = (proc.stderr or proc.stdout or "").strip().splitlines()
        detail = tail[-1] if tail else "(no output)"
        return {"file": str(path), "ok": False, "detail": f"exit {proc.returncode}: {detail[:200]}"}
    return {"file": str(path), "ok": True, "detail": ""}


def main() -> int:
    parser = argparse.ArgumentParser(description="Run `python <file> --help` for Skill Python scripts")
    parser.add_argument("skill_path", type=Path, help="Skill directory to scan")
    parser.add_argument("--timeout", type=int, default=15, help="Seconds per script, default 15")
    parser.add_argument("--json", action="store_true", help="Emit JSON report")
    args = parser.parse_args()

    skill_root = args.skill_path.resolve()
    if not skill_root.is_dir():
        print(f"not a directory: {skill_root}", file=sys.stderr)
        return 2

    scripts = find_python_files(skill_root / "scripts")
    results = [smoke_one(path, args.timeout) for path in scripts]
    failures = [item for item in results if not item["ok"]]

    if args.json:
        print(json.dumps({"checked": len(results), "failed": failures}, indent=2))
    else:
        print(f"Checked: {len(results)}")
        print(f"Passed: {len(results) - len(failures)}")
        print(f"Failed: {len(failures)}")
        for failure in failures:
            print(f"- {failure['file']}: {failure['detail']}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
