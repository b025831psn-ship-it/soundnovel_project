#!/usr/bin/env python3
"""Read-only inventory for SFC, N64, GBA, PS1 and PS2 media."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import sys
from pathlib import Path

SCHEMA_VERSION = 1
CHUNK_SIZE = 4 * 1024 * 1024
N64_ORDERS = {
    b"\x80\x37\x12\x40": "z64-big-endian",
    b"\x37\x80\x40\x12": "v64-byte-swapped",
    b"\x40\x12\x37\x80": "n64-little-endian",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(CHUNK_SIZE):
            digest.update(chunk)
    return digest.hexdigest()


def clean_ascii(data: bytes) -> str | None:
    text = data.decode("ascii", "replace").rstrip(" \0")
    return text or None


def base_record(path: Path, name: str) -> dict:
    stat = path.stat()
    return {"name": name, "size": stat.st_size, "sha256": sha256_file(path)}


def analyze_gba(path: Path) -> dict | None:
    with path.open("rb") as stream:
        header = stream.read(0xC0)
    if len(header) < 0xC0 or header[0xB2] != 0x96:
        return None
    checksum = (-(sum(header[0xA0:0xBD]) + 0x19)) & 0xFF
    return {
        "platform": "gba",
        "format": "gba-rom",
        "header": {
            "title": clean_ascii(header[0xA0:0xAC]),
            "gameCode": clean_ascii(header[0xAC:0xB0]),
            "makerCode": clean_ascii(header[0xB0:0xB2]),
            "unitCode": header[0xB3],
            "deviceType": header[0xB4],
            "softwareVersion": header[0xBC],
            "headerChecksum": header[0xBD],
            "headerChecksumValid": checksum == header[0xBD],
        },
    }


def normalize_n64(data: bytes, order: str) -> bytes:
    if order == "z64-big-endian":
        return data
    if order == "v64-byte-swapped":
        output = bytearray(data)
        for index in range(0, len(output) - 1, 2):
            output[index], output[index + 1] = output[index + 1], output[index]
        return bytes(output)
    output = bytearray(data)
    for index in range(0, len(output) - 3, 4):
        output[index:index + 4] = reversed(output[index:index + 4])
    return bytes(output)


def analyze_n64(path: Path) -> dict | None:
    with path.open("rb") as stream:
        raw = stream.read(0x40)
    order = N64_ORDERS.get(raw[:4])
    if order is None:
        return None
    header = normalize_n64(raw, order)
    return {
        "platform": "n64",
        "format": "n64-rom",
        "header": {
            "byteOrder": order,
            "clockRate": int.from_bytes(header[4:8], "big"),
            "entryPoint": f"0x{int.from_bytes(header[8:12], 'big'):08x}",
            "release": int.from_bytes(header[12:16], "big"),
            "crc1": f"{int.from_bytes(header[16:20], 'big'):08x}",
            "crc2": f"{int.from_bytes(header[20:24], 'big'):08x}",
            "title": clean_ascii(header[0x20:0x34]),
            "cartridgeId": clean_ascii(header[0x3B:0x3D]),
            "countryCode": header[0x3E],
            "version": header[0x3F],
        },
    }


def sfc_header_score(header: bytes) -> int:
    if len(header) != 0x40:
        return -100
    score = 0
    title = header[:21]
    score += sum(1 for byte in title if byte == 0x20 or 0x21 <= byte <= 0x7E)
    mapper = header[0x15]
    if mapper & 0x0F in {0, 1, 2, 3, 5, 0xA}:
        score += 8
    complement = int.from_bytes(header[0x1C:0x1E], "little")
    checksum = int.from_bytes(header[0x1E:0x20], "little")
    if checksum ^ complement == 0xFFFF:
        score += 16
    reset = int.from_bytes(header[0x3C:0x3E], "little")
    if reset >= 0x8000:
        score += 8
    return score


def analyze_sfc(path: Path) -> dict | None:
    size = path.stat().st_size
    copier = size % 0x8000 == 512
    bias = 512 if copier else 0
    candidates = [("lorom", bias + 0x7FC0), ("hirom", bias + 0xFFC0)]
    best = None
    with path.open("rb") as stream:
        for mapping, offset in candidates:
            if offset + 0x40 > size:
                continue
            stream.seek(offset)
            header = stream.read(0x40)
            score = sfc_header_score(header)
            if best is None or score > best[0]:
                best = (score, mapping, offset, header)
    if best is None or best[0] < 20:
        return None
    _, mapping, offset, header = best
    complement = int.from_bytes(header[0x1C:0x1E], "little")
    checksum = int.from_bytes(header[0x1E:0x20], "little")
    return {
        "platform": "sfc",
        "format": "sfc-rom",
        "header": {
            "copierHeaderBytes": bias,
            "mappingCandidate": mapping,
            "headerOffset": offset,
            "title": clean_ascii(header[:21]),
            "mapper": header[0x15],
            "romType": header[0x16],
            "romSizeCode": header[0x17],
            "ramSizeCode": header[0x18],
            "regionCode": header[0x19],
            "developerId": header[0x1A],
            "version": header[0x1B],
            "checksum": f"{checksum:04x}",
            "checksumComplement": f"{complement:04x}",
            "checksumPairValid": checksum ^ complement == 0xFFFF,
            "resetVector": f"0x{int.from_bytes(header[0x3C:0x3E], 'little'):04x}",
        },
    }


def analyze_executable(data: bytes) -> dict | None:
    if data.startswith(b"PS-X EXE") and len(data) >= 0x38:
        return {
            "format": "ps-x-exe",
            "entryPoint": f"0x{int.from_bytes(data[0x10:0x14], 'little'):08x}",
            "globalPointer": f"0x{int.from_bytes(data[0x14:0x18], 'little'):08x}",
            "loadAddress": f"0x{int.from_bytes(data[0x18:0x1C], 'little'):08x}",
            "payloadSize": int.from_bytes(data[0x1C:0x20], "little"),
        }
    if data.startswith(b"\x7fELF") and len(data) >= 0x34:
        endian = "little" if data[5] == 1 else "big"
        return {
            "format": "elf",
            "class": 32 if data[4] == 1 else 64,
            "endian": endian,
            "machine": int.from_bytes(data[18:20], endian),
            "entryPoint": f"0x{int.from_bytes(data[24:28], endian):08x}",
        }
    return None


class IsoReader:
    def __init__(self, path: Path, sector_size: int, payload_offset: int):
        self.path = path
        self.sector_size = sector_size
        self.payload_offset = payload_offset

    def read_sector(self, lba: int) -> bytes:
        with self.path.open("rb") as stream:
            stream.seek(lba * self.sector_size + self.payload_offset)
            return stream.read(2048)

    def read_extent(self, lba: int, size: int) -> bytes:
        output = bytearray()
        sectors = (size + 2047) // 2048
        for index in range(sectors):
            output.extend(self.read_sector(lba + index))
        return bytes(output[:size])


def iso_layout(path: Path) -> tuple[IsoReader, bytes] | None:
    for sector_size, payload_offset in ((2048, 0), (2352, 16), (2352, 24)):
        reader = IsoReader(path, sector_size, payload_offset)
        pvd = reader.read_sector(16)
        if len(pvd) == 2048 and pvd[0] == 1 and pvd[1:6] == b"CD001":
            return reader, pvd
    return None


def iso_directory(reader: IsoReader, lba: int, size: int) -> list[dict]:
    data = reader.read_extent(lba, size)
    records = []
    offset = 0
    while offset < len(data):
        length = data[offset]
        if length == 0:
            offset = ((offset // 2048) + 1) * 2048
            continue
        if offset + length > len(data) or length < 34:
            break
        record = data[offset:offset + length]
        name_len = record[32]
        name = record[33:33 + name_len].decode("ascii", "replace")
        records.append({
            "name": name,
            "lba": int.from_bytes(record[2:6], "little"),
            "size": int.from_bytes(record[10:14], "little"),
            "directory": bool(record[25] & 2),
        })
        offset += length
    return records


def find_iso_file(reader: IsoReader, pvd: bytes, wanted: str) -> dict | None:
    root_len = pvd[156]
    root = pvd[156:156 + root_len]
    pending = [(int.from_bytes(root[2:6], "little"), int.from_bytes(root[10:14], "little"), "")]
    seen = set()
    while pending:
        lba, size, prefix = pending.pop()
        if (lba, size) in seen or len(seen) >= 256:
            continue
        seen.add((lba, size))
        for item in iso_directory(reader, lba, size):
            name = item["name"]
            if name in {"\x00", "\x01"}:
                continue
            normalized = name.split(";", 1)[0].upper()
            full_name = f"{prefix}/{normalized}" if prefix else normalized
            if not item["directory"] and normalized == wanted.upper():
                return {**item, "path": full_name}
            if item["directory"]:
                pending.append((item["lba"], item["size"], full_name))
    return None


def analyze_iso(path: Path) -> dict | None:
    layout = iso_layout(path)
    if layout is None:
        return None
    reader, pvd = layout
    system = find_iso_file(reader, pvd, "SYSTEM.CNF")
    result = {
        "platform": "unknown",
        "format": "iso9660",
        "disc": {
            "sectorSize": reader.sector_size,
            "payloadOffset": reader.payload_offset,
            "systemId": clean_ascii(pvd[8:40]),
            "volumeId": clean_ascii(pvd[40:72]),
            "volumeSectors": int.from_bytes(pvd[80:84], "little"),
            "systemCnf": None,
            "boot": None,
        },
    }
    if system is None:
        return result
    content = reader.read_extent(system["lba"], min(system["size"], 4096))
    text = content.decode("ascii", "replace").rstrip("\0")
    match = re.search(r"(?im)^\s*(BOOT2?)\s*=\s*cdrom0?:?[\\/]*(.+?)\s*(?:;\s*1)?\s*$", text)
    result["disc"]["systemCnf"] = {"path": system["path"], "lba": system["lba"], "size": system["size"]}
    if match:
        boot_type = match.group(1).upper()
        boot_path = match.group(2).strip().replace("\\", "/")
        result["platform"] = "ps2" if boot_type == "BOOT2" else "ps1"
        result["disc"]["boot"] = {"directive": boot_type, "path": boot_path}
        boot_name = boot_path.rsplit("/", 1)[-1]
        executable = find_iso_file(reader, pvd, boot_name)
        if executable:
            header = reader.read_extent(executable["lba"], min(executable["size"], 0x800))
            result["disc"]["boot"]["file"] = {
                "isoPath": executable["path"],
                "lba": executable["lba"],
                "size": executable["size"],
                "executable": analyze_executable(header),
            }
    return result


CUE_FILE_RE = re.compile(r'^\s*FILE\s+(?:"([^"]+)"|(\S+))\s+(\S+)\s*$', re.I)
CUE_TRACK_RE = re.compile(r"^\s*TRACK\s+(\d+)\s+(\S+)\s*$", re.I)
CUE_INDEX_RE = re.compile(r"^\s*INDEX\s+(\d+)\s+(\d+):(\d+):(\d+)\s*$", re.I)


def parse_cue(path: Path, redact_names: bool) -> tuple[list[dict], list[dict], list[Path]]:
    files = []
    tracks = []
    sources = []
    current_file = None
    current_track = None
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    for line_number, line in enumerate(text.splitlines(), 1):
        if match := CUE_FILE_RE.match(line):
            source_name = match.group(1) or match.group(2)
            source = path.parent / source_name
            sources.append(source)
            current_file = len(files)
            item = {"name": f"file-{current_file + 1:03d}" if redact_names else Path(source_name).name, "type": match.group(3).upper()}
            if source.is_file():
                item.update({"size": source.stat().st_size, "sha256": sha256_file(source), "missing": False})
            else:
                item["missing"] = True
            files.append(item)
        elif match := CUE_TRACK_RE.match(line):
            current_track = {"number": int(match.group(1)), "mode": match.group(2).upper(), "file": current_file, "indexes": []}
            tracks.append(current_track)
        elif match := CUE_INDEX_RE.match(line):
            if current_track is None:
                raise ValueError(f"{path.name}:{line_number}: INDEX before TRACK")
            minute, second, frame = map(int, match.groups()[1:])
            if second >= 60 or frame >= 75:
                raise ValueError(f"{path.name}:{line_number}: invalid INDEX time")
            current_track["indexes"].append({"number": int(match.group(1)), "frames": (minute * 60 + second) * 75 + frame})
    return files, tracks, sources


def analyze_path(path: Path, display_name: str, redact_names: bool) -> dict:
    record = base_record(path, display_name)
    suffix = path.suffix.lower()
    if suffix == ".cue":
        files, tracks, sources = parse_cue(path, redact_names)
        record.update({"platform": "unknown", "format": "cue", "cue": {"files": files, "tracks": tracks}})
        for index, item in enumerate(files):
            if item.get("missing") or not any(track["file"] == index and track["mode"].startswith("MODE") for track in tracks):
                continue
            disc = analyze_iso(sources[index])
            if disc:
                record["platform"] = disc["platform"]
                record["disc"] = disc["disc"]
            break
        return record
    for analyzer in (analyze_gba, analyze_n64, analyze_sfc, analyze_iso):
        if result := analyzer(path):
            record.update(result)
            return record
    with path.open("rb") as stream:
        executable = analyze_executable(stream.read(0x800))
    if executable:
        record.update({"platform": "ps1" if executable["format"] == "ps-x-exe" else "ps2", **executable})
    else:
        record.update({"platform": "unknown", "format": "unknown"})
    return record


def build_manifest(paths: list[Path], redact_names: bool) -> dict:
    inputs = []
    for index, path in enumerate(paths, 1):
        if not path.is_file():
            raise FileNotFoundError(path)
        name = f"input-{index:03d}" if redact_names else path.name
        inputs.append(analyze_path(path, name, redact_names))
    return {"schemaVersion": SCHEMA_VERSION, "tool": {"name": "soundnovel-media-inventory", "version": "0.1.0"}, "inputs": inputs}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("-o", "--output", type=Path)
    parser.add_argument("--redact-names", action="store_true")
    args = parser.parse_args(argv)
    try:
        manifest = build_manifest(args.paths, args.redact_names)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    output = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(output, encoding="utf-8")
    else:
        sys.stdout.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
