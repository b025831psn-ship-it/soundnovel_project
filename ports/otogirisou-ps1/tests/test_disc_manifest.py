import importlib.util
import unittest
from pathlib import Path


TOOL = Path(__file__).parents[1] / "tools" / "validate_disc_manifest.py"
SPEC = importlib.util.spec_from_file_location("validate_disc_manifest", TOOL)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def valid_manifest():
    return {
        "schemaVersion": 1,
        "media": "ps1-cue-bin",
        "files": [
            {"role": "cue", "size": 10, "sha256": "0" * 64},
            {"role": "track-data", "size": 2352, "sha256": "a" * 64},
        ],
        "disc": {"volumeId": None, "bootPath": None, "productCode": None},
    }


class DiscManifestTest(unittest.TestCase):
    def test_accepts_minimal_manifest(self):
        self.assertEqual([], MODULE.validate(valid_manifest()))

    def test_requires_exactly_one_cue(self):
        manifest = valid_manifest()
        manifest["files"][1]["role"] = "cue"
        self.assertIn("files: expected exactly one cue entry", MODULE.validate(manifest))

    def test_rejects_uppercase_or_short_hash(self):
        manifest = valid_manifest()
        manifest["files"][0]["sha256"] = "A" * 63
        self.assertTrue(any("sha256" in error for error in MODULE.validate(manifest)))

    def test_rejects_bool_as_size(self):
        manifest = valid_manifest()
        manifest["files"][0]["size"] = True
        self.assertTrue(any("size" in error for error in MODULE.validate(manifest)))

    def test_rejects_unknown_fields(self):
        manifest = valid_manifest()
        manifest["files"][0]["path"] = "/private/game.cue"
        self.assertTrue(any("unexpected keys" in error for error in MODULE.validate(manifest)))


if __name__ == "__main__":
    unittest.main()
