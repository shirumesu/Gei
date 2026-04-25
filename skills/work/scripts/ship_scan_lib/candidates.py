from __future__ import annotations

import os

from .ignore import (
    GitIgnoreChecker,
    is_ignored_by_best_effort_hint,
    load_best_effort_gitignore_hint,
    load_git_distribution_files,
)
from .junk import build_junk_finding, classify_junk_dir, classify_junk_file, relpath
from .models import FileCandidate, Finding
from .rules import PRUNE_DIR_NAMES, SKIP_EXTENSIONS, SKIP_FILENAMES


def should_skip_file_by_name(filename: str) -> bool:
    if filename in SKIP_FILENAMES:
        return True
    _, ext = os.path.splitext(filename)
    return ext.lower() in SKIP_EXTENSIONS


def collect_git_candidates(root: str) -> tuple[list[FileCandidate], list[Finding]] | None:
    rel_files = load_git_distribution_files(root)
    if rel_files is None:
        return None

    candidates: list[FileCandidate] = []
    junk_findings: list[Finding] = []
    reported_junk_dirs: set[str] = set()
    ignore_checker = GitIgnoreChecker(root, no_index=True)
    ignore_labels = ignore_checker.check_many(rel_files)

    for rel_path in rel_files:
        parts = rel_path.replace("\\", "/").split("/")
        junk_parent_found = False
        for index, part in enumerate(parts[:-1]):
            junk_dir = classify_junk_dir(part)
            if junk_dir is None:
                continue
            rel_dir_path = "/".join(parts[: index + 1])
            if rel_dir_path not in reported_junk_dirs:
                kind, message = junk_dir
                ignored_by_gitignore = ignore_checker.is_ignored(rel_dir_path)
                junk_findings.append(
                    build_junk_finding(
                        rel_dir_path,
                        kind,
                        ignored_by_gitignore,
                        message,
                    )
                )
                reported_junk_dirs.add(rel_dir_path)
            junk_parent_found = True
            break
        if junk_parent_found:
            continue

        filename = os.path.basename(rel_path)
        if filename in SKIP_FILENAMES:
            continue

        junk_file = classify_junk_file(filename)
        if junk_file is not None:
            kind, message = junk_file
            junk_findings.append(
                build_junk_finding(
                    rel_path,
                    kind,
                    ignore_labels.get(rel_path),
                    message,
                )
            )
            continue

        if should_skip_file_by_name(filename):
            continue

        candidates.append(
            FileCandidate(
                filepath=os.path.join(root, rel_path),
                rel_path=rel_path,
                ignored_by_gitignore=ignore_labels.get(rel_path),
            )
        )

    return candidates, junk_findings


def collect_directory_candidates(
    root: str,
    include_ignored: bool,
    git_checker: GitIgnoreChecker | None,
    use_best_effort_hint: bool,
) -> tuple[list[FileCandidate], list[Finding], int]:
    hint_patterns = (
        load_best_effort_gitignore_hint(root) if use_best_effort_hint else None
    )
    candidates: list[FileCandidate] = []
    findings: list[Finding] = []
    skipped_ignored_files = 0

    for dirpath, dirnames, filenames in os.walk(root):
        rel_dirs = [
            relpath(root, os.path.join(dirpath, dirname)) for dirname in dirnames
        ]
        git_ignored_dirs = (
            git_checker.check_many(rel_dirs) if git_checker is not None else {}
        )

        kept_dirnames = []
        for dirname, rel_dir_path in zip(dirnames, rel_dirs):
            full_dir_path = os.path.join(dirpath, dirname)
            ignored_by_gitignore = (
                git_ignored_dirs.get(rel_dir_path)
                if git_checker is not None
                else is_ignored_by_best_effort_hint(
                    full_dir_path,
                    root,
                    hint_patterns,
                )
                if hint_patterns is not None
                else None
            )

            junk_dir = classify_junk_dir(dirname)
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

            if dirname in PRUNE_DIR_NAMES:
                continue
            if ignored_by_gitignore is True and not include_ignored:
                continue
            kept_dirnames.append(dirname)

        dirnames[:] = kept_dirnames

        rel_files = [relpath(root, os.path.join(dirpath, name)) for name in filenames]
        git_ignored_files = (
            git_checker.check_many(rel_files) if git_checker is not None else {}
        )

        for filename, rel_file_path in zip(filenames, rel_files):
            if filename in SKIP_FILENAMES:
                continue

            full_path = os.path.join(dirpath, filename)
            ignored_by_gitignore = (
                git_ignored_files.get(rel_file_path)
                if git_checker is not None
                else is_ignored_by_best_effort_hint(
                    full_path,
                    root,
                    hint_patterns,
                )
                if hint_patterns is not None
                else None
            )

            junk_file = classify_junk_file(filename)
            if junk_file is not None:
                if ignored_by_gitignore is True and not include_ignored:
                    skipped_ignored_files += 1
                    continue
                kind, message = junk_file
                findings.append(
                    build_junk_finding(
                        rel_file_path,
                        kind,
                        ignored_by_gitignore,
                        message,
                    )
                )
                continue

            if should_skip_file_by_name(filename):
                continue
            if ignored_by_gitignore is True and not include_ignored:
                skipped_ignored_files += 1
                continue

            candidates.append(
                FileCandidate(
                    filepath=full_path,
                    rel_path=rel_file_path,
                    ignored_by_gitignore=ignored_by_gitignore,
                )
            )

    return candidates, findings, skipped_ignored_files
