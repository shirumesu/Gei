"""Build and exercise both actual release archives in isolated temporary storage."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from zipfile import ZipFile

from sync_plugin_version import latest_changelog_version
from extract_latest_release_notes import extract_changelog_entry

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    version = latest_changelog_version(ROOT / "CHANGELOG.md")
    assert extract_changelog_entry(ROOT / "CHANGELOG.md", version).startswith(f"## v{version} -")
    for manifest in (".codex-plugin/plugin.json", ".claude-plugin/plugin.json"):
        assert json.loads((ROOT / manifest).read_text())["version"] == version
    with tempfile.TemporaryDirectory(prefix="gei-packages-") as temporary:
        root = Path(temporary)
        subprocess.run([sys.executable, str(ROOT / ".github/scripts/build_packages.py"), "--output", str(root)], check=True)
        for filename, entry in (
            ("Gei-skills.zip", "Gei/memo/scripts/spec/cli.mjs"),
            ("Gei-codex-plugin.zip", "gei/bin/gei.mjs"),
        ):
            env = dict(os.environ, GEI_SPEC_HOME=str(root / filename.removesuffix(".zip") / "knowledge"), GEI_SPEC_STATE=str(root / filename.removesuffix(".zip") / "state"))
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
            def invoke(command: str, *args: str, data: dict | None = None) -> dict:
                call = subprocess.run(["node", str(destination / entry), command, *args], env=env,
                    input=json.dumps(data) if data is not None else None, check=True, capture_output=True, text=True)
                return json.loads(call.stdout)

            name = "projects/package-test/probe.md"
            knowledge = Path(env["GEI_SPEC_HOME"])
            body = "# Package fixture\nBefore.\n"
            metadata = {"version": 3, "kind": "knowledge", "created_at": "2026-01-01T00:00:00Z", "review_days": 90,
                "verified_at": "2026-01-01T00:00:00Z", "verified_hash": hashlib.sha256(body.encode()).hexdigest(), "basis": "internal-package-marker"}
            (knowledge / name).parent.mkdir(parents=True, exist_ok=True)
            (knowledge / name).write_text(body, encoding="utf-8", newline="")
            record = knowledge / ("metadata/" + name + ".json")
            record.parent.mkdir(parents=True, exist_ok=True)
            record.write_text(json.dumps(metadata), encoding="utf-8")
            assert invoke("read", data={"paths": [name]})["files"][0]["content"] == body
            preview = invoke("migrate-metadata", "--all")
            assert preview["migrated"] == [name]
            migrated = invoke("migrate-metadata", "--all", "--apply", "--base-revision", preview["revision"])
            migrated_text = (knowledge / name).read_text(encoding="utf-8")
            assert migrated_text.endswith(body) and not record.exists()
            assert '"verified_at": "2026-01-01T00:00:00Z"' in migrated_text
            assert len(invoke("search", data={"query": "internal-package-marker"})["results"]) == 1
            line = migrated_text.splitlines().index("Before.") + 1
            edited = invoke("edit", data={"base_revision": migrated["revision"], "summary": "Edit physical line", "edits": [
                {"op": "replace_lines", "path": name, "start_line": line, "end_line": line, "new_text": "After."}]})
            assert invoke("read", data={"paths": [name]})["files"][0]["content"] == migrated_text.replace("Before.", "After.")
            moved = "projects/package-test/moved.md"
            saved = invoke("edit", data={"base_revision": edited["revision"], "summary": "Move package probe", "edits": [
                {"op": "rename", "path": name, "to": moved}]})
            assert not record.exists() and not (knowledge / name).exists()
            invoke("edit", data={"base_revision": saved["revision"], "summary": "Declare disposable package probe", "reviews": [
                {"path": moved, "outcome": "verify", "basis": "Package test is complete", "kind": "transient", "delete_after": "2020-01-01T00:00:00Z", "deletion_reason": "Temporary package probe"}]})
            plan = invoke("gc", "--all", "--json")
            assert plan["deleted"] == [moved]
            removed = invoke("gc", "--all", "--json", "--apply", "--base-revision", plan["revision"], "--plan-id", plan["plan_id"])
            assert removed["applied"] and not (knowledge / moved).exists()
            assert not (knowledge / ("metadata/" + moved + ".json")).exists()
            memo_root = destination / ("Gei/memo" if filename == "Gei-skills.zip" else "gei/skills/memo")
            assert (memo_root / "assets/spec-gc.yml").is_file()
            assert (memo_root / "references/maintenance.md").is_file()
            if filename == "Gei-codex-plugin.zip":
                assert (destination / "gei/.codex-plugin/spec.mcp.json").is_file()
                assert (destination / "gei/.mcp.json").is_file()
                for manifest in (".codex-plugin/plugin.json", ".claude-plugin/plugin.json"):
                    assert json.loads((destination / "gei" / manifest).read_text())["version"] == version
                hook = subprocess.run(["node", str(destination / "gei/hooks/inject_context.mjs")], env=env,
                    input=json.dumps({"cwd": str(root)}), check=True, capture_output=True, text=True)
                assert "spec_read" in json.loads(hook.stdout)["hookSpecificOutput"]["additionalContext"]
            print(f"PASS extracted {filename}: standalone CLI, metadata migration, physical edits, rename, GC and bundled runtime")


if __name__ == "__main__":
    main()
