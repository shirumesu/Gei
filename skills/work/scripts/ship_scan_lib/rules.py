from __future__ import annotations

MINIFIED_EXTENSIONS = {".js", ".cjs", ".mjs", ".css"}
MINIFIED_LINE_LENGTH = 400
MINIFIED_AVG_LINE_LENGTH = 200
MINIFIED_WHITESPACE_RATIO = 0.1

TRAILING_TRIM_CHARS = ".,;:)]}>"

COMMON_UNIX_ROOTS = {
    "Applications",
    "bin",
    "cache",
    "code",
    "data",
    "dev",
    "etc",
    "home",
    "Library",
    "mnt",
    "opt",
    "private",
    "proc",
    "root",
    "run",
    "sbin",
    "srv",
    "sys",
    "tmp",
    "Users",
    "usr",
    "var",
    "Volumes",
    "workspace",
    "workspaces",
}

SKIP_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".class",
    ".jar",
    ".o",
    ".a",
    ".so",
    ".dylib",
    ".exe",
    ".dll",
    ".pdb",
    ".wasm",
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".7z",
    ".rar",
    ".tgz",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".icns",
    ".webp",
    ".mp3",
    ".mp4",
    ".wav",
    ".ogg",
    ".avi",
    ".mov",
    ".mkv",
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
}

SKIP_FILENAMES = {
    "package-lock.json",
    "npm-shrinkwrap.json",
    "Pipfile.lock",
    "poetry.lock",
    "Gemfile.lock",
    "Cargo.lock",
    "packages.lock.json",
    "go.sum",
}

JUNK_DIR_NAMES = {
    "__pycache__": (
        "python_bytecode_cache",
        "Python bytecode cache directory.",
    ),
    ".pytest_cache": ("pytest_cache", "pytest cache directory."),
    ".mypy_cache": ("mypy_cache", "mypy cache directory."),
    ".ruff_cache": ("ruff_cache", "ruff cache directory."),
    ".hypothesis": ("hypothesis_cache", "Hypothesis cache directory."),
    ".tox": ("tox_environment", "tox environment directory."),
    ".nox": ("nox_environment", "nox environment directory."),
    ".venv": ("virtual_environment", "Local virtual environment directory."),
    "venv": ("virtual_environment", "Local virtual environment directory."),
    "htmlcov": ("coverage_html_report", "Coverage HTML output directory."),
    ".ipynb_checkpoints": (
        "notebook_checkpoint",
        "Jupyter notebook checkpoint directory.",
    ),
    ".eggs": ("python_build_artifact", "Setuptools build artifact directory."),
    ".parcel-cache": ("bundler_cache", "Bundler cache directory."),
    ".sass-cache": ("style_cache", "Style compiler cache directory."),
    ".turbo": ("task_cache", "Task runner cache directory."),
}

JUNK_DIR_PATTERNS = (
    ("*.egg-info", "python_build_metadata", "Python build metadata directory."),
)

JUNK_FILE_NAMES = {
    ".ds_store": ("os_metadata", "macOS Finder metadata file."),
    "thumbs.db": ("os_metadata", "Windows thumbnail cache file."),
    "desktop.ini": ("os_metadata", "Windows desktop metadata file."),
    ".coverage": ("coverage_data", "Coverage data file."),
}

JUNK_FILE_PATTERNS = (
    (".coverage.*", "coverage_data", "Coverage data file."),
    ("*.pyc", "python_bytecode", "Python bytecode file."),
    ("*.pyo", "python_bytecode", "Python bytecode file."),
    ("*$py.class", "python_bytecode", "Jython bytecode file."),
    ("*.tmp", "temporary_file", "Temporary file."),
    ("*.temp", "temporary_file", "Temporary file."),
    ("*.swp", "editor_swap", "Editor swap file."),
    ("*.swo", "editor_swap", "Editor swap file."),
    ("*~", "editor_backup", "Editor backup file."),
    ("*.bak", "backup_file", "Backup file."),
    ("*.orig", "merge_backup", "Merge backup file."),
    ("*.rej", "patch_reject", "Rejected patch file."),
    ("npm-debug.log*", "package_manager_debug_log", "npm debug log."),
    ("yarn-debug.log*", "package_manager_debug_log", "Yarn debug log."),
    ("yarn-error.log*", "package_manager_debug_log", "Yarn error log."),
    ("pnpm-debug.log*", "package_manager_debug_log", "pnpm debug log."),
)

BUILT_IN_SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    ".idea",
    ".vscode",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
}

# Junk directories are reported first, then pruned. Keeping the pruning set
# derived from the reporting rules prevents future rule drift.
PRUNE_DIR_NAMES = BUILT_IN_SKIP_DIRS | set(JUNK_DIR_NAMES)
