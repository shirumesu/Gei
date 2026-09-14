"""Build and exercise both actual release archives in isolated temporary storage."""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="gei-packages-") as temporary:
        root = Path(temporary)
        subprocess.run([sys.executable, str(ROOT / ".github/scripts/build_packages.py"), "--output", str(root)], check=True)
        env = dict(os.environ, GEI_SPEC_HOME=str(root / "knowledge"), GEI_SPEC_STATE=str(root / "state"))
        for filename, entry in (
            ("Gei-skills.zip", "Gei/memo/scripts/spec/cli.mjs"),
            ("Gei-codex-plugin.zip", "gei/bin/gei.mjs"),
        ):
            destination = root / filename.removesuffix(".zip")
            with ZipFile(root / filename) as archive:
                names = archive.namelist()
                assert not any("__pycache__" in name or "/node_modules/" in name for name in names)
                assert entry in names
                archive.extractall(destination)
            result = subprocess.run(["node", str(destination / entry), "status"], env=env, check=True, capture_output=True, text=True)
            assert json.loads(result.stdout)["mode"] == "local"
            check = subprocess.run(["node", str(destination / entry), "check", "--all", "--limit", "1", "--json"], env=env, check=True, capture_output=True, text=True)
            assert "candidates" in json.loads(check.stdout)
            gc = subprocess.run(["node", str(destination / entry), "gc", "--all", "--json"], env=env, check=True, capture_output=True, text=True)
            assert json.loads(gc.stdout)["applied"] is False
            memo_root = destination / ("Gei/memo" if filename == "Gei-skills.zip" else "gei/skills/memo")
            assert (memo_root / "assets/spec-gc.yml").is_file()
            assert (memo_root / "references/maintenance.md").is_file()
            if filename == "Gei-codex-plugin.zip":
                assert (destination / "gei/.codex-plugin/spec.mcp.json").is_file()
                assert (destination / "gei/.mcp.json").is_file()
                hook = subprocess.run(["node", str(destination / "gei/hooks/inject_context.mjs")], env=env,
                    input=json.dumps({"cwd": str(root)}), check=True, capture_output=True, text=True)
                assert "spec_read" in json.loads(hook.stdout)["hookSpecificOutput"]["additionalContext"]
            print(f"PASS extracted {filename}: standalone CLI and bundled runtime")


if __name__ == "__main__":
    main()
