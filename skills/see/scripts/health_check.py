#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass


STATUS_READY = "Available"
STATUS_PARTIAL = "Partially available"
STATUS_BROKEN = "Unavailable"
STATUS_MISSING = "Not installed"

ALL_PASS_LABEL = "N/A (ALL PASS)"
ALL_MISSING_LABEL = "ALL (NOT INSTALLED)"


@dataclass(frozen=True)
class CheckSpec:
    name: str
    kind: str = "cli"
    args: tuple[str, ...] = ()
    url: str | None = None
    timeout_seconds: int = 20
    requires: tuple[str, ...] = ()
    expected_substrings: tuple[str, ...] = ()


@dataclass(frozen=True)
class ToolSpec:
    name: str
    executable: str | None = None
    package: str | None = None
    checks: tuple[CheckSpec, ...] = ()


@dataclass(frozen=True)
class CheckResult:
    name: str
    passed: bool


@dataclass(frozen=True)
class ToolStatus:
    name: str
    status: str
    passed_count: int
    total_count: int
    failed_checks: tuple[str, ...]


TOOLS = (
    ToolSpec(
        name="Jina",
        checks=(
            CheckSpec(
                name="read",
                kind="url",
                url="https://r.jina.ai/http://example.com",
                expected_substrings=("Example Domain",),
            ),
        ),
    ),
    ToolSpec(
        name="Reddit",
        executable="rdt",
        package="rdt-cli",
        checks=(
            CheckSpec(name="help", args=("--help",), timeout_seconds=10),
            CheckSpec(name="status", args=("status", "--json")),
            CheckSpec(name="whoami", args=("whoami", "--json")),
            CheckSpec(name="search", args=("search", "python async", "--compact", "--json")),
            CheckSpec(name="show", args=("show", "1", "--json"), requires=("search",)),
        ),
    ),
    ToolSpec(
        name="Twitter/X",
        executable="twitter",
        package="twitter-cli",
        checks=(
            CheckSpec(name="help", args=("--help",), timeout_seconds=10),
            CheckSpec(name="user", args=("user", "openai", "--json")),
            CheckSpec(name="search", args=("search", "OpenAI", "--max", "1", "--json")),
            CheckSpec(name="show", args=("show", "1", "--json"), requires=("search",)),
        ),
    ),
    ToolSpec(
        name="Xiaohongshu",
        executable="xhs",
        package="xiaohongshu-cli",
        checks=(
            CheckSpec(name="help", args=("--help",), timeout_seconds=10),
            CheckSpec(name="status", args=("status", "--json")),
            CheckSpec(name="whoami", args=("whoami", "--json")),
            CheckSpec(name="search", args=("search", "美食", "--json")),
            CheckSpec(name="read", args=("read", "1", "--json"), requires=("search",)),
            CheckSpec(name="topics", args=("topics", "美食", "--json")),
            CheckSpec(name="hot", args=("hot", "--json")),
        ),
    ),
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check whether the optional `see` tooling is locally available."
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="Attempt installation for tools that are missing or unavailable.",
    )
    return parser.parse_args(argv or sys.argv[1:])


def run_command(command: list[str], timeout_seconds: int = 20) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout_seconds,
        check=False,
    )


def parse_structured_stdout(stdout: str) -> dict[str, object] | None:
    text = stdout.strip()
    if not text or not text.startswith("{"):
        return None

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return None

    if isinstance(payload, dict):
        return payload
    return None


def command_passed(result: subprocess.CompletedProcess[str]) -> bool:
    if result.returncode != 0:
        return False

    payload = parse_structured_stdout(result.stdout)
    if payload is None:
        return True

    return payload.get("ok") is not False


def run_cli_check(executable_path: str, check: CheckSpec) -> CheckResult:
    try:
        result = run_command(
            [executable_path, *check.args],
            timeout_seconds=check.timeout_seconds,
        )
    except (OSError, subprocess.TimeoutExpired):
        return CheckResult(check.name, False)

    return CheckResult(check.name, command_passed(result))


def run_url_check(check: CheckSpec) -> CheckResult:
    if not check.url:
        return CheckResult(check.name, False)

    request = urllib.request.Request(
        check.url,
        headers={"User-Agent": "Mozilla/5.0"},
    )

    try:
        with urllib.request.urlopen(request, timeout=check.timeout_seconds) as response:
            body = response.read().decode("utf-8", errors="replace")
            if response.status != 200:
                return CheckResult(check.name, False)
    except (OSError, TimeoutError, urllib.error.HTTPError, urllib.error.URLError):
        return CheckResult(check.name, False)

    if check.expected_substrings and not all(
        marker in body for marker in check.expected_substrings
    ):
        return CheckResult(check.name, False)

    return CheckResult(check.name, True)


def detect_installers() -> dict[str, bool]:
    return {
        "uv": shutil.which("uv") is not None,
        "pipx": shutil.which("pipx") is not None,
    }


def build_install_command(tool: ToolSpec, installers: dict[str, bool]) -> list[str]:
    if not tool.package:
        return []
    if installers.get("uv"):
        return ["uv", "tool", "install", tool.package]
    if installers.get("pipx"):
        return ["pipx", "install", tool.package]
    return [sys.executable, "-m", "pip", "install", "--user", tool.package]


def derive_status(passed_count: int, total_count: int) -> str:
    if passed_count == total_count:
        return STATUS_READY
    if passed_count == 0:
        return STATUS_BROKEN
    return STATUS_PARTIAL


def probe_tool(tool: ToolSpec) -> ToolStatus:
    executable_path: str | None = None
    if tool.executable:
        executable_path = shutil.which(tool.executable)
        if executable_path is None:
            return ToolStatus(
                name=tool.name,
                status=STATUS_MISSING,
                passed_count=0,
                total_count=len(tool.checks),
                failed_checks=tuple(check.name for check in tool.checks),
            )

    results: list[CheckResult] = []
    passed_by_name: dict[str, bool] = {}

    # Commands like `show 1` and `read 1` depend on the current run creating
    # fresh index cache, so skip execution when the required listing step fails.
    for check in tool.checks:
        if any(not passed_by_name.get(requirement, False) for requirement in check.requires):
            result = CheckResult(check.name, False)
        elif check.kind == "url":
            result = run_url_check(check)
        else:
            if executable_path is None:
                result = CheckResult(check.name, False)
            else:
                result = run_cli_check(executable_path, check)

        results.append(result)
        passed_by_name[check.name] = result.passed

    passed_count = sum(result.passed for result in results)
    failed_checks = tuple(result.name for result in results if not result.passed)

    return ToolStatus(
        name=tool.name,
        status=derive_status(passed_count, len(results)),
        passed_count=passed_count,
        total_count=len(results),
        failed_checks=failed_checks,
    )


def attempt_install(tool: ToolSpec, installers: dict[str, bool]) -> None:
    install_command = build_install_command(tool, installers)
    if not install_command:
        return

    try:
        run_command(install_command, timeout_seconds=300)
    except (OSError, subprocess.TimeoutExpired):
        return


def run_health_check(install: bool = False) -> list[ToolStatus]:
    installers = detect_installers()
    statuses: list[ToolStatus] = []

    for tool in TOOLS:
        status = probe_tool(tool)
        if install and status.status in {STATUS_MISSING, STATUS_BROKEN} and tool.package:
            attempt_install(tool, installers)
            status = probe_tool(tool)
        statuses.append(status)

    return statuses


def render_failed_checks(status: ToolStatus) -> str:
    if not status.failed_checks:
        return ALL_PASS_LABEL
    if status.status == STATUS_MISSING:
        return ALL_MISSING_LABEL
    return ", ".join(status.failed_checks)


def render_table(statuses: list[ToolStatus]) -> str:
    lines = [
        "| Tool | Status | Checks | Failed Checks |",
        "| --- | --- | --- | --- |",
    ]

    for status in statuses:
        lines.append(
            f"| {status.name} | {status.status} | "
            f"pass {status.passed_count} of {status.total_count} | "
            f"{render_failed_checks(status)} |"
        )

    total_passed = sum(status.passed_count for status in statuses)
    total_checks = sum(status.total_count for status in statuses)
    lines.extend(("", f"Summary: pass {total_passed} of {total_checks}"))
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    print("The test has started and will take about 1 minute…")
    print(render_table(run_health_check(install=args.install)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
