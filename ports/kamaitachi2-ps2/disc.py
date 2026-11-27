"""Read the verified Japanese PS2 disc and its FAD directory, in place."""

from dataclasses import dataclass
from hashlib import file_digest, sha256
from pathlib import Path
import struct


SECTOR = 2048
DISC_SHA256 = "76758d1b96ef67888f80c7fb21f85565672e1aed936f93f3c988ef54601e431e"
BOOT_SHA256 = "591622064f7ae4dab96c87a9e0a01491a8086c6726ebd7860505dfe1b5f38dee"
INDEX_SHA256 = "aa159eb39c2abcb398e016687be3e227de903491f41e69e23e263efc6b381c64"


@dataclass(frozen=True)
class Extent:
    lba: int
    size: int


class Disc:
    def __init__(self, image):
        self.path = Path(image)

    def read(self, extent):
        with self.path.open("rb") as source:
            source.seek(extent.lba * SECTOR)
            data = source.read(extent.size)
        if len(data) != extent.size:
            raise ValueError("Truncated ISO extent")
        return data

    def verify(self):
        with self.path.open("rb") as source:
            digest = file_digest(source, "sha256").hexdigest()
        if digest != DISC_SHA256:
            raise ValueError(f"Unsupported disc SHA-256 {digest}")
        return digest

    def open_index(self):
        descriptor = self.read(Extent(16, SECTOR))
        if descriptor[:7] != b"\x01CD001\x01":
            raise ValueError("Expected a 2048-byte-sector ISO 9660 image")
        root = Extent(*struct.unpack_from("<I4xI", descriptor, 158))
        directory = self.read(root)
        entries = {}
        pos = 0
        while pos < len(directory):
            length = directory[pos]
            if not length:
                pos = (pos // SECTOR + 1) * SECTOR
                continue
            record = directory[pos:pos + length]
            if len(record) < 34 or len(record) < 33 + record[32]:
                raise ValueError("Invalid ISO directory record")
            if not record[25] & 2:
                name = record[33:33 + record[32]].decode("ascii").split(";")[0]
                entries[name.upper()] = Extent(*struct.unpack_from("<I4xI", record, 2))
            pos += length
        needed = {"DISC.FAD", "DISCE.FAD", "SLPS_251.32", "SYSTEM.CNF"}
        if not needed.issubset(entries):
            raise ValueError("Expected the Japanese SLPS_251.32 game disc")
        self.elf = self.read(entries["SLPS_251.32"])
        if sha256(self.elf).hexdigest() != BOOT_SHA256:
            raise ValueError("Unknown executable revision")
        start = entries["DISC.FAD"].lba
        table = self.read(entries["DISC.FAD"])
        if sha256(table).hexdigest() != INDEX_SHA256 or table != self.read(entries["DISCE.FAD"]):
            raise ValueError("Unexpected FAD index or footer")
        self.files = {}
        directories = {}
        for i, (kind, raw, size, sector, parent, child) in enumerate(
            struct.iter_unpack("<I12sIIii", table)
        ):
            if raw == bytes(12) and not any((kind, size, sector, parent, child)):
                break
            prefix = "" if parent < 0 else directories[parent] + "/"
            if kind == 1:
                directories[i] = prefix + raw.split(b"\0")[0].decode("ascii")
            elif kind == 0:
                basename = raw[:8].split(b"\0")[0].rstrip()
                extension = raw[8:].split(b"\0")[0].rstrip()
                path = prefix + b".".join((basename, extension)).decode("ascii")
                extent = Extent(start + sector, size)
                if extent.lba * SECTOR + size > entries["DISCE.FAD"].lba * SECTOR:
                    raise ValueError(f"Invalid FAD extent for {path}")
                self.files[path] = extent
            else:
                raise ValueError("Invalid FAD record type")
        return self


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("iso", type=Path)
    parser.add_argument("--elf", type=Path, help="Save the executable locally for Ghidra")
    args = parser.parse_args()
    disc = Disc(args.iso).open_index()
    digest = disc.verify()
    if args.elf:
        args.elf.parent.mkdir(parents=True, exist_ok=True)
        args.elf.write_bytes(disc.elf)
    print(json.dumps({"disc_sha256": digest, "elf_sha256": sha256(disc.elf).hexdigest(),
                      "entry": hex(struct.unpack_from("<I", disc.elf, 24)[0]),
                      "fad_files": len(disc.files),
                      "scenario_lba": disc.files["SCENARIO/scenario.sn4"].lba}, indent=2))
