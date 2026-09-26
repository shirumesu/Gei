"""Check development version synchronization and release-note boundaries."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from extract_latest_release_notes import extract_changelog_entry
from sync_plugin_version import expected_manifest_version, latest_changelog_version


class VersioningTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="gei-version-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.changelog = self.root / "CHANGELOG.md"
        self.manifests = [self.root / "codex.json", self.root / "claude.json"]
        for manifest in self.manifests:
            manifest.write_text(json.dumps({"version": "0.11.2-alpha.1", "name": "gei"}), encoding="utf-8")

    def sync(self) -> str:
        result = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("sync_plugin_version.py")),
             str(self.changelog), *map(str, self.manifests)],
            check=True, capture_output=True, text=True,
        )
        return result.stdout.strip()

    def assert_manifests(self, version: str) -> None:
        for manifest in self.manifests:
            self.assertEqual(json.loads(manifest.read_text(encoding="utf-8")), {"version": version, "name": "gei"})

    def test_unreleased_target_survives_automatic_sync(self) -> None:
        text = "# Changelog\n\n## Unreleased\n\n### 0.11.2-alpha.1\n\n- Pending change.\n\n## v0.11.1 - 2026-09-21\n\n- Shipped change.\n"
        self.changelog.write_text(text, encoding="utf-8")
        self.sync()
        self.assert_manifests("0.11.2-alpha.1")
        self.assertEqual(expected_manifest_version(self.changelog, "0.11.2-alpha.1"), "0.11.2-alpha.1")
        self.assertEqual(latest_changelog_version(self.changelog), "0.11.1")
        self.assertIsNone(extract_changelog_entry(self.changelog, "0.11.2-alpha.1"))
        self.assertEqual(self.sync(), "already-synced")
        self.assertEqual(self.changelog.read_text(encoding="utf-8"), text)

    def test_release_promotion_uses_new_heading(self) -> None:
        self.changelog.write_text("## Unreleased\n\n## v0.11.1 - 2026-09-21\n", encoding="utf-8")
        self.sync()
        self.changelog.write_text("## Unreleased\n\n## v0.11.2 - 2026-09-27\n\n- Ready change.\n\n## v0.11.1 - 2026-09-21\n\n- Older change.\n", encoding="utf-8")
        self.sync()
        self.assert_manifests("0.11.2")
        self.assertEqual(extract_changelog_entry(self.changelog, "v0.11.2"), "## v0.11.2 - 2026-09-27\n\n- Ready change.\n")

    def test_prerelease_notes_do_not_absorb_neighboring_releases(self) -> None:
        self.changelog.write_text("## Unreleased\n\n## v0.11.2-alpha.2 - 2026-09-27\n\n- Second preview.\n\n## v0.11.2-alpha.1 - 2026-09-26\n\n- First preview.\n\n## v0.11.1 - 2026-09-21\n\n- Stable.\n", encoding="utf-8")
        self.sync()
        self.assert_manifests("0.11.2-alpha.2")
        self.assertEqual(extract_changelog_entry(self.changelog, "v0.11.2-alpha.1"), "## v0.11.2-alpha.1 - 2026-09-26\n\n- First preview.\n")

    def test_legacy_release_heading_stays_readable(self) -> None:
        for manifest in self.manifests:
            manifest.write_text(json.dumps({"version": "0.10.0", "name": "gei"}), encoding="utf-8")
        self.changelog.write_text("## Unreleased\n\n## v0.11.0.3\n\n- Legacy development build.\n", encoding="utf-8")
        self.sync()
        self.assert_manifests("0.11.0.3")
        self.assertEqual(latest_changelog_version(self.changelog), "0.11.0.3")
        self.assertIn("Legacy development build.", extract_changelog_entry(self.changelog, "0.11.0.3"))


if __name__ == "__main__":
    unittest.main()
