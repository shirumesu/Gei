# Work Scripts

This directory contains small automation scripts used by the `work` skill.

## `ship_scan.py`

`ship_scan.py` is a pre-distribution scanner. It checks a project, staging
directory, or package directory for files that deserve human attention before
shipping:

- hardcoded absolute paths, such as local Windows paths or Unix system paths
- common junk artifacts, such as temporary files, editor backups, and cache
  directories

The scanner is designed as a practical ship gate. It favors clear findings and
bounded runtime over exhaustive secret-scanning semantics. It is not a full
security scanner, and it does not prove that a package is safe to publish.

## Scan Modes

The default behavior depends on whether the target directory is inside a Git
working tree.

### Git Mode

In Git mode, the default candidate set is:

```text
git ls-files --cached --others --exclude-standard
```

This means:

- tracked files are scanned
- untracked files are scanned when they are not ignored
- ignored untracked files are skipped
- tracked files are still scanned even if they match an ignore rule

Tracked files stay in the repository distribution surface, so the scanner keeps
them in scope.

### Directory Mode

Directory mode is used when Git candidate collection is unavailable, or when
`--include-ignored` asks the scanner to walk the directory tree directly.

Directory mode is best-effort. It applies explicit built-in skip rules and can
use the root `.gitignore` as a hint in non-Git directories, but it does not
implement full Git ignore semantics such as nested `.gitignore`,
`.git/info/exclude`, or global excludes. Hidden directories are scanned unless
they are named in the built-in skip rules.

For the strictest release check, run the scanner against the actual staging or
package directory that will be distributed.

## Output

The default output is a human-readable log:

```text
Info: summary | mode: git | ignore: git | files: 299 | minified: 2 | binary: 2 | unreadable: 0 | findings: 11
Warning: [sensitive_path:unix] found | value: /path/to/tool | location: src/window.rs:343 | ignored: no
```

JSONL is available for agents and tools. The first JSONL record is always a
summary:

```json
{
  "type": "summary",
  "scan_mode": "git",
  "ignore_source": "git",
  "scanned_files": 299,
  "skipped_minified_files": 2,
  "skipped_binary_files": 2,
  "skipped_unreadable_files": 0,
  "sensitive_paths": 11,
  "junk_files": 0,
  "findings": 11
}
```

Finding records include `type`, `kind`, `value`, `file`, `line`, `column`,
`ignored_by_gitignore`, and `snippet`.

Table output is also available for manual review. Long cells are wrapped instead
of truncated so the full path remains visible without forcing a single row to
span far beyond the terminal width.

## Files

```text
scripts/
  ship_scan.py
  ship_scan_lib/
    __init__.py
    candidates.py
    content.py
    ignore.py
    junk.py
    models.py
    output.py
    rules.py
    scanner.py
```

- `ship_scan.py`
  CLI entrypoint. It parses arguments, validates the root directory, calls the
  scanner, and prints log, JSONL, or table output.

- `ship_scan_lib/models.py`
  Shared dataclasses and type aliases for findings, file candidates, scan
  results, report stats, and final reports.

- `ship_scan_lib/rules.py`
  Static rule tables for skipped extensions, explicit lock filenames, junk
  files, junk directories, minified-file heuristics, and common Unix roots.

- `ship_scan_lib/ignore.py`
  Git ignore integration and non-Git best-effort `.gitignore` hint handling.
  Git is treated as the authority when available.

- `ship_scan_lib/candidates.py`
  Candidate collection for Git mode and directory mode. This layer decides
  which files should be scanned and which junk artifacts should be reported
  before content scanning begins.

- `ship_scan_lib/junk.py`
  Junk file and directory classification helpers.

- `ship_scan_lib/content.py`
  Content scanners. It currently registers the absolute-path scanner and owns
  binary detection, minified-file detection, snippets, and false-positive
  filtering.

- `ship_scan_lib/scanner.py`
  Orchestration layer. It chooses scan mode, runs content scanning with a worker
  pool, aggregates counters, and builds the final `ScanReport`.

- `ship_scan_lib/output.py`
  Log, JSONL, and table rendering.

## Maintenance Notes

Keep `ship_scan.py` small. New detection behavior should usually be added under
`ship_scan_lib/`.

For new content checks, add a scanner function in `content.py` and include it in
`CONTENT_SCANNERS`. Scanner functions should return `Finding` objects and should
avoid writing to shared state.

For new junk patterns, update `rules.py`. The pruning set for junk directories
is derived from the junk directory rule table so a directory can be reported and
then skipped without maintaining two separate lists.

For new output fields, update `models.py` and `output.py` together. Log, JSONL,
and table output should keep the same summary semantics.

For ignore behavior, prefer Git commands over reimplementing Git semantics. The
non-Git fallback is intentionally approximate and should be described as such.

For performance-sensitive changes, preserve stable output ordering. File content
scanning can run in parallel, but aggregation should remain deterministic.
