from __future__ import annotations

import fnmatch
import os
import subprocess


class GitIgnoreChecker:
    def __init__(self, root: str, no_index: bool = False):
        self.root = root
        self.no_index = no_index
        self._cache: dict[str, bool | None] = {}
        self.available = self._git_available()

    def _git_available(self) -> bool:
        try:
            result = subprocess.run(
                ["git", "-C", self.root, "rev-parse", "--is-inside-work-tree"],
                capture_output=True,
                text=False,
                check=False,
            )
        except OSError:
            return False
        return result.returncode == 0

    def check_many(self, rel_paths: list[str]) -> dict[str, bool | None]:
        missing = [path for path in rel_paths if path not in self._cache]
        if not missing:
            return {path: self._cache[path] for path in rel_paths}

        if not self.available:
            for path in missing:
                self._cache[path] = None
            return {path: self._cache[path] for path in rel_paths}

        payload = "\0".join(missing) + "\0"
        command = ["git", "-C", self.root, "check-ignore", "-z", "--stdin"]
        if self.no_index:
            command.append("--no-index")

        try:
            result = subprocess.run(
                command,
                input=payload.encode("utf-8", errors="surrogateescape"),
                capture_output=True,
                text=False,
                check=False,
            )
        except OSError:
            for path in missing:
                self._cache[path] = None
            return {path: self._cache[path] for path in rel_paths}

        ignored = set()
        if result.stdout:
            entries = result.stdout.decode("utf-8", errors="replace").split("\0")
            ignored = {entry for entry in entries if entry}

        for path in missing:
            if result.returncode in (0, 1):
                self._cache[path] = path in ignored
            else:
                self._cache[path] = None

        return {path: self._cache[path] for path in rel_paths}

    def is_ignored(self, rel_path: str) -> bool | None:
        return self.check_many([rel_path])[rel_path]


def load_best_effort_gitignore_hint(root: str) -> list[tuple[str, bool, bool]] | None:
    """Load only the root .gitignore as a non-Git fallback hint.

    This deliberately does not claim full Git ignore semantics. It does not
    read nested .gitignore files, .git/info/exclude, or global excludes.
    """
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


def is_ignored_by_best_effort_hint(
    filepath: str,
    root: str,
    patterns: list[tuple[str, bool, bool]] | None,
) -> bool:
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
        if (
            not matched
            and "/" in normalized_pattern
            and not any(char in normalized_pattern for char in "*?[]")
        ):
            matched = (
                rel_fwd == normalized_pattern
                or rel_fwd.startswith(normalized_pattern + "/")
            )
        if matched:
            ignored = not negation
    return ignored


def load_git_distribution_files(root: str) -> list[str] | None:
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
