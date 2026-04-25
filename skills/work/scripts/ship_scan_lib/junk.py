from __future__ import annotations

import fnmatch
import os

from .models import Finding, JunkMatch, Rule
from .rules import (
    JUNK_DIR_NAMES,
    JUNK_DIR_PATTERNS,
    JUNK_FILE_NAMES,
    JUNK_FILE_PATTERNS,
)


def classify_junk_name(
    name: str,
    exact_rules: dict[str, tuple[str, str]],
    pattern_rules: tuple[Rule, ...],
) -> JunkMatch:
    lowered_name = name.casefold()
    exact_match = exact_rules.get(lowered_name)
    if exact_match is not None:
        return exact_match

    for pattern, kind, message in pattern_rules:
        if fnmatch.fnmatch(lowered_name, pattern):
            return kind, message

    return None


def classify_junk_file(filename: str) -> JunkMatch:
    return classify_junk_name(filename, JUNK_FILE_NAMES, JUNK_FILE_PATTERNS)


def classify_junk_dir(dirname: str) -> JunkMatch:
    return classify_junk_name(dirname, JUNK_DIR_NAMES, JUNK_DIR_PATTERNS)


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


def relpath(root: str, path: str) -> str:
    return os.path.relpath(path, root).replace(os.sep, "/")
