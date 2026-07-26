from __future__ import annotations

import unittest

from ship_scan_lib.content import scan_sensitive_paths


class SensitivePathScanTests(unittest.TestCase):
    def scan(self, line: str):
        return scan_sensitive_paths(line, 1, "src/example.ts", False)

    def test_ignores_single_segment_frontend_routes(self):
        self.assertEqual(self.scan('navigate("/home")'), [])
        self.assertEqual(self.scan('<Route path="/cache" />'), [])
        self.assertEqual(self.scan('redirect("/etc")'), [])
        self.assertEqual(self.scan('router.push("/usr")'), [])

    def test_keeps_single_segment_system_paths(self):
        for path in ("/etc", "/usr", "/var", "/home"):
            with self.subTest(path=path):
                findings = self.scan(f'const directory = "{path}";')
                self.assertEqual([finding.value for finding in findings], [path])
                findings = self.scan(f'const path = "{path}";')
                self.assertEqual([finding.value for finding in findings], [path])
        self.assertEqual(
            [finding.value for finding in self.scan('items.push("/etc")')],
            ["/etc"],
        )
        self.assertEqual(
            [finding.value for finding in self.scan('text.replace("/usr", "x")')],
            ["/usr"],
        )

    def test_keeps_user_specific_unix_paths(self):
        path = "/" + "home/alice/.config/app.json"
        findings = self.scan(f'const config = "{path}";')

        self.assertEqual([finding.value for finding in findings], [path])

    def test_ignores_at_prefixed_module_aliases(self):
        self.assertEqual(self.scan('import data from "@/data/artwork";'), [])

    def test_keeps_absolute_data_paths(self):
        path = "/" + "data/artwork/poster.jpg"
        findings = self.scan(f'const artwork = "{path}";')

        self.assertEqual([finding.value for finding in findings], [path])

    def test_ignores_unc_shaped_javascript_regex_literals(self):
        self.assertEqual(self.scan(r'.replace(/\\[A-Za-z]+\([^)]*\)/g, "")'), [])

    def test_ignores_scanner_regex_definitions_after_packaging(self):
        findings = scan_sensitive_paths(
            r'_UNC_PATTERN = r"(?P<unc>\\\\[^\\/\s]+\\[^\\/\s]+)"',
            1,
            "Gei/work/scripts/ship_scan_lib/content.py",
            False,
        )
        self.assertEqual(findings, [])

    def test_keeps_unc_paths_in_strings(self):
        path = "\\\\" + r"server\share\folder"
        findings = self.scan(f'const share = "{path}";')

        self.assertEqual([finding.value for finding in findings], [path])


if __name__ == "__main__":
    unittest.main()
