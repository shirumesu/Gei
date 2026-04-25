from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import os
import platform

from .candidates import collect_directory_candidates, collect_git_candidates
from .content import scan_candidate_file
from .ignore import GitIgnoreChecker, load_best_effort_gitignore_hint
from .models import ScanReport


def default_worker_count() -> int:
    return min(32, (os.cpu_count() or 1) * 4)


def normalize_worker_count(workers: int | None) -> int:
    if workers is None:
        return default_worker_count()
    return max(1, workers)


def scan_project(
    root: str,
    include_minified: bool = False,
    include_ignored: bool = False,
    workers: int | None = None,
) -> ScanReport:
    abs_root = os.path.abspath(root)
    git_candidates = None if include_ignored else collect_git_candidates(abs_root)
    skipped_ignored_files = 0

    if git_candidates is not None:
        candidates, findings = git_candidates
        scan_mode = "git"
        ignore_source = "git"
    else:
        git_checker = GitIgnoreChecker(abs_root)
        use_git_checker = git_checker if git_checker.available else None
        candidates, findings, skipped_ignored_files = collect_directory_candidates(
            abs_root,
            include_ignored=include_ignored,
            git_checker=use_git_checker,
            use_best_effort_hint=not git_checker.available,
        )
        scan_mode = "directory"
        if git_checker.available:
            ignore_source = "git"
        elif load_best_effort_gitignore_hint(abs_root) is not None:
            ignore_source = "gitignore_hint"
        else:
            ignore_source = "built_in"

    scanned_files = 0
    skipped_minified_files = 0
    skipped_binary_files = 0
    skipped_unreadable_files = 0

    worker_count = normalize_worker_count(workers)
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        results = executor.map(
            lambda candidate: scan_candidate_file(
                candidate.filepath,
                candidate.rel_path,
                candidate.ignored_by_gitignore,
                include_minified,
            ),
            candidates,
        )
        for result in results:
            scanned_files += result.scanned_files
            skipped_minified_files += result.skipped_minified_files
            skipped_binary_files += result.skipped_binary_files
            skipped_unreadable_files += result.skipped_unreadable_files
            findings.extend(result.findings)

    return ScanReport(
        root=abs_root,
        scanner_platform=platform.system(),
        scan_mode=scan_mode,
        ignore_source=ignore_source,
        scanned_files=scanned_files,
        skipped_ignored_files=skipped_ignored_files,
        skipped_minified_files=skipped_minified_files,
        skipped_binary_files=skipped_binary_files,
        skipped_unreadable_files=skipped_unreadable_files,
        findings=findings,
    )
