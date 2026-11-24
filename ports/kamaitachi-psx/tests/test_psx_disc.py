import hashlib
import importlib.util
import struct
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "psx_disc.py"
SPEC = importlib.util.spec_from_file_location("psx_disc", MODULE_PATH)
psx_disc = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = psx_disc
SPEC.loader.exec_module(psx_disc)


class DiscInventoryTests(unittest.TestCase):
    def test_msf_validation(self):
        self.assertEqual(psx_disc.msf_to_lba("01:02:03"), 4653)
        with self.assertRaises(ValueError):
            psx_disc.msf_to_lba("00:60:00")

    def test_raw_mode2_iso_inventory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            image = bytearray(24 * 2352)
            pvd = bytearray(2048)
            pvd[0] = 1
            pvd[1:6] = b"CD001"
            pvd[6] = 1
            pvd[8:40] = b"PLAYSTATION".ljust(32)
            pvd[40:72] = b"SYNTHETIC".ljust(32)
            struct.pack_into("<I", pvd, 80, 24)
            record = bytearray(34)
            record[0] = 34
            struct.pack_into("<I", record, 2, 20)
            struct.pack_into("<I", record, 10, 2048)
            record[25] = 2
            record[28:32] = b"\x01\x00\x00\x01"
            record[32:34] = b"\x01\x00"
            pvd[156:190] = record
            image[16 * 2352 + 24 : 16 * 2352 + 24 + 2048] = pvd
            directory_sector = bytearray(2048)
            directory_sector[:34] = record
            image[20 * 2352 + 24 : 20 * 2352 + 24 + 2048] = directory_sector
            bin_path = root / "synthetic.bin"
            bin_path.write_bytes(image)
            cue_path = root / "synthetic.cue"
            cue_path.write_text('FILE "synthetic.bin" BINARY\n  TRACK 01 MODE2/2352\n    INDEX 01 00:00:00\n')

            result = psx_disc.inventory(cue_path)

            self.assertEqual(result["schema"], "soundnovel.psx-disc-inventory.v1")
            self.assertEqual(result["files"][0]["sha256"], hashlib.sha256(image).hexdigest())
            track = result["tracks"][0]
            self.assertEqual(track["byte_offset"], 0)
            self.assertEqual(track["iso9660"]["volume_id"], "SYNTHETIC")
            self.assertEqual(track["iso9660"]["root_entries"][0]["name"], ".")

    def test_missing_index_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            cue = Path(directory) / "bad.cue"
            cue.write_text('FILE "x.bin" BINARY\n TRACK 01 MODE2/2352\n')
            with self.assertRaisesRegex(ValueError, "INDEX 01"):
                psx_disc.parse_cue(cue)


if __name__ == "__main__":
    unittest.main()
