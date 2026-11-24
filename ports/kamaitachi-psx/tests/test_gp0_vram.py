import importlib.util
import sys
import unittest
from pathlib import Path


MODULE = Path(__file__).parents[1] / "tools" / "gp0_vram.py"
SPEC = importlib.util.spec_from_file_location("gp0_vram", MODULE)
gp0_vram = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = gp0_vram
SPEC.loader.exec_module(gp0_vram)


class Gp0ReplayTests(unittest.TestCase):
    def test_cpu_upload_writes_low_halfword_first_and_records_rectangle(self):
        replay = gp0_vram.VramReplay()
        for word in (0xA0000000, (7 << 16) | 5, (1 << 16) | 3, 0x22221111, 0xDEAD3333):
            replay.feed(word)
        offset = 7 * gp0_vram.VRAM_WIDTH + 5
        self.assertEqual(list(replay.vram[offset : offset + 3]), [0x1111, 0x2222, 0x3333])
        self.assertEqual(replay.uploads, [{"x": 5, "y": 7, "width": 3, "height": 1}])

    def test_fill_and_overlap_safe_copy(self):
        replay = gp0_vram.VramReplay()
        for word in (0x020000FF, 0, (1 << 16) | 3):
            replay.feed(word)
        self.assertEqual(list(replay.vram[:3]), [0x001F] * 3)
        for word in (0x80000000, 0, 1, (1 << 16) | 3):
            replay.feed(word)
        self.assertEqual(list(replay.vram[:4]), [0x001F] * 4)

    def test_drawing_packet_payload_is_not_mistaken_for_upload(self):
        replay = gp0_vram.VramReplay()
        for word in (0x20000000, 0xA0000000, 0x01000200, 0x03000400):
            replay.feed(word)
        self.assertFalse(replay.packet)
        self.assertFalse(replay.remaining_pixels)
        self.assertEqual(replay.uploads, [])

    def test_vram_read_header_is_consumed_without_waiting_for_pixel_data(self):
        replay = gp0_vram.VramReplay()
        for word in (0xC0000000, 0, (1 << 16) | 1):
            replay.feed(word)
        self.assertFalse(replay.packet)

    def test_zero_transfer_size_uses_masked_hardware_maximum(self):
        self.assertEqual(gp0_vram._transfer_size(0), (1024, 512))

    def test_incomplete_and_out_of_bounds_uploads_are_rejected(self):
        replay = gp0_vram.VramReplay()
        replay.feed(0xA0000000)
        replay.feed((511 << 16) | 1023)
        with self.assertRaisesRegex(ValueError, "exceeds"):
            replay.feed((2 << 16) | 2)


if __name__ == "__main__":
    unittest.main()
