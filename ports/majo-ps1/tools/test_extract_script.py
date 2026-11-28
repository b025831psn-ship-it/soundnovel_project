import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("extract_script.py")
SPEC = importlib.util.spec_from_file_location("extract_script", MODULE_PATH)
extract_script = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(extract_script)


class ExtractScriptTests(unittest.TestCase):
    def test_lzss_literals_and_space_back_reference(self):
        # output length 6, flags: literal A, then a three-byte reference to the
        # initial space-filled dictionary, followed by literals B and C.
        decoded, consumed = extract_script.decode_lzss(bytes.fromhex("00060d4101004243"))
        self.assertEqual(decoded, b"A   BC")
        self.assertEqual(consumed, 8)

    def test_record_signature(self):
        self.assertTrue(extract_script.is_record_start(b"\xfe" + b"mes000001  " + b"rest", 0))
        self.assertTrue(extract_script.is_record_start(b"\xfe" + b"mes000001\r\0" + b"rest", 0))
        self.assertFalse(extract_script.is_record_start(b"\xfe" + bytes([0x82]) * 11, 0))

    def test_sjis_trail_at_does_not_end_text(self):
        # 0x81 0x40 is an ideographic space; only 0x40 0x02 is a VM command.
        data = bytes.fromhex("81404142434002")
        self.assertEqual(extract_script.next_command(data, 0, len(data)), 5)

    def test_controls(self):
        self.assertEqual(
            extract_script.render_controls("本文@r@k@w20@g選択@q"),
            "本文[r][k][w20][g]選択[q]",
        )


if __name__ == "__main__":
    unittest.main()
