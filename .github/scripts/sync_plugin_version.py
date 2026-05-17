from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


VERSION_HEADING_RE = re.compile(r"^##\s+v?(?P<version>\d+\.\d+\.\d+)(?:\s+-\s+.*)?\s*$")


def latest_changelog_version(path: Path) -> str:
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        match = VERSION_HEADING_RE.match(raw_line.strip())
        if match:
            return match.group("version")
    raise ValueError(f"No version heading found in {path}")


def sync_plugin_version(changelog_path: Path, plugin_json_path: Path) -> bool:
    version = latest_changelog_version(changelog_path)
    data = json.loads(plugin_json_path.read_text(encoding="utf-8"))
    if data.get("version") == version:
        return False

    data["version"] = version
    plugin_json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync plugin.json version from the latest changelog release.")
    parser.add_argument("changelog", help="Path to CHANGELOG.md")
    parser.add_argument("plugin_json", help="Path to .codex-plugin/plugin.json")
    args = parser.parse_args()

    changed = sync_plugin_version(Path(args.changelog), Path(args.plugin_json))
    print("updated" if changed else "already-synced")


if __name__ == "__main__":
    main()
