import importlib.util
import struct
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "mips_refs.py"
SPEC = importlib.util.spec_from_file_location("mips_refs", MODULE_PATH)
mips_refs = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = mips_refs
SPEC.loader.exec_module(mips_refs)


def executable(words):
    data = bytearray(0x800 + len(words) * 4)
    data[:8] = b"PS-X EXE"
    struct.pack_into("<II", data, 0x18, 0x80010000, len(words) * 4)
    for index, word in enumerate(words):
        struct.pack_into("<I", data, 0x800 + index * 4, word)
    return bytes(data)


class MipsReferenceTests(unittest.TestCase):
    def test_direct_jal(self):
        target = 0x80012340
        jal = 0x0C000000 | ((target >> 2) & 0x03FFFFFF)
        refs = mips_refs.find_references(executable([jal]), target)
        self.assertEqual(refs[0]["kind"], "jal")
        self.assertEqual(refs[0]["address"], "0x80010000")

    def test_lui_addiu_with_signed_low_half(self):
        target = 0x8001FFF0
        lui_t0 = (0x0F << 26) | (8 << 16) | 0x8002
        addiu_t0 = (0x09 << 26) | (8 << 21) | (8 << 16) | 0xFFF0
        refs = mips_refs.find_references(executable([lui_t0, addiu_t0]), target)
        self.assertEqual(refs[0]["kind"], "address")
        self.assertEqual(refs[0]["low_address"], "0x80010004")

    def test_pointer_table_entry(self):
        refs = mips_refs.find_references(executable([0x800428E0]), 0x800428E0)
        self.assertEqual(refs[0]["kind"], "pointer")

    def test_rejects_truncated_executable(self):
        data = bytearray(0x800)
        data[:8] = b"PS-X EXE"
        struct.pack_into("<II", data, 0x18, 0x80010000, 4)
        with self.assertRaisesRegex(ValueError, "truncated"):
            mips_refs.find_references(bytes(data), 0)


if __name__ == "__main__":
    unittest.main()
