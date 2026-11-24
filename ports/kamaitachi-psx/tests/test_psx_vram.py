import importlib.util
import struct
import sys
import unittest
import zlib
from pathlib import Path


MODULE = Path(__file__).parents[1] / "tools" / "psx_vram.py"
SPEC = importlib.util.spec_from_file_location("psx_vram", MODULE)
psx_vram = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = psx_vram
SPEC.loader.exec_module(psx_vram)


class VramTests(unittest.TestCase):
    def test_bgr555_channel_order_transparency_and_stp(self):
        self.assertEqual(psx_vram.bgr555_rgba(0), (0, 0, 0, 0))
        self.assertEqual(psx_vram.bgr555_rgba(0x001F), (255, 0, 0, 255))
        self.assertEqual(psx_vram.bgr555_rgba(0x03E0), (0, 255, 0, 255))
        self.assertEqual(psx_vram.bgr555_rgba(0xFC00), (0, 0, 255, 128))

    def test_4bpp_uses_low_nibble_first(self):
        clut = struct.pack("<16H", 0, 0x001F, 0x03E0, *([0] * 13))
        rgba = psx_vram.decode_texture(bytes([0x21]), 2, 1, 4, clut)
        self.assertEqual(rgba, bytes([255, 0, 0, 255, 0, 255, 0, 255]))

    def test_8bpp_and_16bpp_decode(self):
        clut = struct.pack("<256H", 0, 0x7C00, *([0] * 254))
        self.assertEqual(psx_vram.decode_texture(bytes([1]), 1, 1, 8, clut), bytes([0, 0, 255, 255]))
        self.assertEqual(psx_vram.decode_texture(struct.pack("<H", 0x7FFF), 1, 1, 16), bytes([255] * 4))

    def test_png_contains_unfiltered_rgba_scanline(self):
        png = psx_vram.encode_png(1, 1, bytes([1, 2, 3, 4]))
        self.assertEqual(png[:8], b"\x89PNG\r\n\x1a\n")
        length = struct.unpack_from(">I", png, 8 + 25)[0]
        self.assertEqual(zlib.decompress(png[8 + 25 + 8 : 8 + 25 + 8 + length]), b"\0\1\2\3\4")

    def test_indexed_texture_requires_clut(self):
        with self.assertRaisesRegex(ValueError, "CLUT"):
            psx_vram.decode_texture(b"\0", 2, 1, 4)


if __name__ == "__main__":
    unittest.main()
