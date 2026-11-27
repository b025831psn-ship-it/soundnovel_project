import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


TOOL = Path(__file__).parents[1] / "inventory.py"
sys.path.insert(0, str(TOOL.parent))
SPEC = importlib.util.spec_from_file_location("media_inventory", TOOL)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)

GUI_SPEC = importlib.util.spec_from_file_location("media_inventory_gui", TOOL.parents[0] / "gui.py")
GUI_MODULE = importlib.util.module_from_spec(GUI_SPEC)
assert GUI_SPEC.loader is not None
GUI_SPEC.loader.exec_module(GUI_MODULE)


def directory_record(name: bytes, lba: int, size: int, directory: bool = False) -> bytes:
    length = 33 + len(name) + (0 if len(name) % 2 else 1)
    record = bytearray(length)
    record[0] = length
    record[2:6] = lba.to_bytes(4, "little")
    record[6:10] = lba.to_bytes(4, "big")
    record[10:14] = size.to_bytes(4, "little")
    record[14:18] = size.to_bytes(4, "big")
    record[25] = 2 if directory else 0
    record[28:30] = (1).to_bytes(2, "little")
    record[30:32] = (1).to_bytes(2, "big")
    record[32] = len(name)
    record[33:33 + len(name)] = name
    return bytes(record)


class InventoryTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_gba_header_and_checksum(self):
        rom = bytearray(0xC0)
        rom[0xA0:0xAC] = b"SAMPLE GAME "
        rom[0xAC:0xB0] = b"TEST"
        rom[0xB0:0xB2] = b"01"
        rom[0xB2] = 0x96
        rom[0xBD] = (-(sum(rom[0xA0:0xBD]) + 0x19)) & 0xFF
        path = self.root / "sample.gba"
        path.write_bytes(rom)
        result = MODULE.analyze_gba(path)
        self.assertEqual("TEST", result["header"]["gameCode"])
        self.assertTrue(result["header"]["headerChecksumValid"])

    def test_n64_byte_swapped_header(self):
        header = bytearray(0x40)
        header[:4] = b"\x80\x37\x12\x40"
        header[8:12] = (0x80000400).to_bytes(4, "big")
        header[0x20:0x34] = b"SYNTHETIC N64       "
        swapped = MODULE.normalize_n64(bytes(header), "v64-byte-swapped")
        path = self.root / "sample.v64"
        path.write_bytes(swapped)
        result = MODULE.analyze_n64(path)
        self.assertEqual("v64-byte-swapped", result["header"]["byteOrder"])
        self.assertEqual("0x80000400", result["header"]["entryPoint"])

    def test_sfc_lorom_header(self):
        rom = bytearray(0x10000)
        header = memoryview(rom)[0x7FC0:0x8000]
        header[:21] = b"SYNTHETIC SFC".ljust(21)
        header[0x15] = 0x20
        header[0x1C:0x1E] = (0xEDCB).to_bytes(2, "little")
        header[0x1E:0x20] = (0x1234).to_bytes(2, "little")
        header[0x3C:0x3E] = (0x8000).to_bytes(2, "little")
        path = self.root / "sample.sfc"
        path.write_bytes(rom)
        result = MODULE.analyze_sfc(path)
        self.assertEqual("lorom", result["header"]["mappingCandidate"])
        self.assertTrue(result["header"]["checksumPairValid"])

    def test_ps1_iso_system_cnf_and_executable(self):
        image = bytearray(24 * 2048)
        pvd = memoryview(image)[16 * 2048:17 * 2048]
        pvd[0] = 1
        pvd[1:6] = b"CD001"
        pvd[6] = 1
        pvd[40:48] = b"TESTDISC"
        pvd[80:84] = (24).to_bytes(4, "little")
        pvd[84:88] = (24).to_bytes(4, "big")
        root = directory_record(b"\x00", 20, 2048, True)
        pvd[156:156 + len(root)] = root
        directory = memoryview(image)[20 * 2048:21 * 2048]
        records = b"".join((
            directory_record(b"\x00", 20, 2048, True),
            directory_record(b"\x01", 20, 2048, True),
            directory_record(b"SYSTEM.CNF;1", 21, 32),
            directory_record(b"SLPS_000.00;1", 22, 2048),
        ))
        directory[:len(records)] = records
        system_cnf = b"BOOT = cdrom:\\SLPS_000.00;1\r\n"
        image[21 * 2048:21 * 2048 + len(system_cnf)] = system_cnf
        exe = memoryview(image)[22 * 2048:23 * 2048]
        exe[:8] = b"PS-X EXE"
        exe[0x10:0x14] = (0x80010000).to_bytes(4, "little")
        path = self.root / "sample.iso"
        path.write_bytes(image)
        result = MODULE.analyze_iso(path)
        self.assertEqual("ps1", result["platform"])
        self.assertEqual("SLPS_000.00", result["disc"]["boot"]["path"])
        self.assertEqual("ps-x-exe", result["disc"]["boot"]["file"]["executable"]["format"])

    def test_ps2_iso_boots_elf(self):
        image = bytearray(24 * 2048)
        pvd = memoryview(image)[16 * 2048:17 * 2048]
        pvd[0] = 1
        pvd[1:6] = b"CD001"
        pvd[6] = 1
        root = directory_record(b"\x00", 20, 2048, True)
        pvd[156:156 + len(root)] = root
        directory = memoryview(image)[20 * 2048:21 * 2048]
        records = b"".join((
            directory_record(b"\x00", 20, 2048, True),
            directory_record(b"\x01", 20, 2048, True),
            directory_record(b"SYSTEM.CNF;1", 21, 40),
            directory_record(b"SLPS_999.99;1", 22, 2048),
        ))
        directory[:len(records)] = records
        system_cnf = b"BOOT2 = cdrom0:\\SLPS_999.99;1\r\n"
        del pvd, directory
        image[21 * 2048:21 * 2048 + len(system_cnf)] = system_cnf
        image[22 * 2048:22 * 2048 + 4] = b"\x7fELF"
        image[22 * 2048 + 4] = 1
        image[22 * 2048 + 5] = 1
        image[22 * 2048 + 18:22 * 2048 + 20] = (8).to_bytes(2, "little")
        path = self.root / "sample-ps2.iso"
        path.write_bytes(image)
        result = MODULE.analyze_iso(path)
        self.assertEqual("ps2", result["platform"])
        self.assertEqual("elf", result["disc"]["boot"]["file"]["executable"]["format"])

    def test_cue_hashes_referenced_file_and_redacts_names(self):
        track = self.root / "private-name.bin"
        track.write_bytes(b"not an iso")
        cue = self.root / "game.cue"
        cue.write_text('FILE "private-name.bin" BINARY\n  TRACK 01 MODE2/2352\n    INDEX 01 00:00:00\n', encoding="utf-8")
        manifest = MODULE.build_manifest([cue], True)
        item = manifest["inputs"][0]
        self.assertEqual("input-001", item["name"])
        self.assertEqual("file-001", item["cue"]["files"][0]["name"])
        self.assertFalse(item["cue"]["files"][0]["missing"])

    def test_gui_writes_redacted_manifest_without_opening_window(self):
        path = self.root / "private-game.gba"
        rom = bytearray(0xC0)
        rom[0xB2] = 0x96
        rom[0xBD] = (-(sum(rom[0xA0:0xBD]) + 0x19)) & 0xFF
        path.write_bytes(rom)
        output = self.root / "result.json"
        GUI_MODULE.write_manifest([path], output, True)
        saved = json.loads(output.read_text(encoding="utf-8"))
        self.assertEqual("input-001", saved["inputs"][0]["name"])
        self.assertNotIn(str(self.root), output.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
