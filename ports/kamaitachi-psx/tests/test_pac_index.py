import importlib.util
import struct
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "pac_index.py"
SPEC = importlib.util.spec_from_file_location("pac_index", MODULE_PATH)
pac_index = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = pac_index
SPEC.loader.exec_module(pac_index)


class PacIndexTests(unittest.TestCase):
    def test_sector_index(self):
        prefix = bytearray(2048)
        pairs = ((7, 1), (12, 3), (99, 8), (0xFFFF, 10))
        for index, pair in enumerate(pairs):
            struct.pack_into("<HH", prefix, index * 4, *pair)

        result = pac_index.parse_index(prefix, 10 * 2048)

        self.assertEqual(result["entry_count"], 3)
        self.assertEqual(result["index_sectors"], 1)
        self.assertEqual(result["entries"][0]["byte_offset"], 2048)
        self.assertEqual(result["entries"][0]["sector_count"], 2)
        self.assertEqual(result["entries"][2]["byte_size"], 2 * 2048)

    def test_terminator_must_match_file(self):
        prefix = struct.pack("<HHHH", 1, 1, 0xFFFF, 7)
        with self.assertRaisesRegex(ValueError, "sector count"):
            pac_index.parse_index(prefix, 8 * 2048)

    def test_offsets_must_increase(self):
        prefix = struct.pack("<HHHHHH", 1, 2, 2, 2, 0xFFFF, 4)
        with self.assertRaisesRegex(ValueError, "offset"):
            pac_index.parse_index(prefix, 4 * 2048)

    def test_member_record_table(self):
        member = bytearray(32)
        struct.pack_into("<HHHH", member, 0, 8, 12, 12, 20)

        result = pac_index.parse_record_table(member)

        self.assertEqual(result["record_count"], 4)
        self.assertEqual(result["records"][0]["byte_size"], 4)
        self.assertEqual(result["records"][1]["byte_size"], 0)
        self.assertEqual(result["records"][3]["byte_size"], 12)

    def test_member_record_table_requires_monotonic_offsets(self):
        member = struct.pack("<HHHH", 8, 12, 10, 16) + bytes(8)
        with self.assertRaisesRegex(ValueError, "must not decrease"):
            pac_index.parse_record_table(member)
