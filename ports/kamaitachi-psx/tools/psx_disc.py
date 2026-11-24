#!/usr/bin/env python3
"""Read-only PS1 BIN/CUE inventory helper.

The tool deliberately extracts no payload. It inventories provenance and the
minimum boot structures needed to anchor later native/emulated traces.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
from dataclasses import dataclass
from pathlib import Path


MODE_SECTOR_BYTES = {
    "AUDIO": 2352,
    "MODE1/2048": 2048,
    "MODE1/2352": 2352,
    "MODE2/2336": 2336,
    "MODE2/2352": 2352,
}


def msf_to_lba(value: str) -> int:
    minute, second, frame = (int(part) for part in value.split(":"))
    if second >= 60 or frame >= 75:
        raise ValueError(f"invalid MSF: {value}")
    return minute * 60 * 75 + second * 75 + frame


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


@dataclass
class Track:
    number: int
    mode: str
    file: Path
    index01: int | None = None
    pregap: int = 0

    @property
    def sector_bytes(self) -> int:
        try:
            return MODE_SECTOR_BYTES[self.mode]
        except KeyError as error:
            raise ValueError(f"unsupported track mode: {self.mode}") from error


def parse_cue(cue_path: Path) -> list[Track]:
    current_file: Path | None = None
    current: Track | None = None
    tracks: list[Track] = []
    for line_number, raw in enumerate(cue_path.read_text(encoding="utf-8-sig").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("REM"):
            continue
        match = re.fullmatch(r'FILE\s+(?:"([^"]+)"|(\S+))\s+\S+', line, re.I)
        if match:
            current_file = cue_path.parent / (match.group(1) or match.group(2))
            continue
        match = re.fullmatch(r"TRACK\s+(\d+)\s+(\S+)", line, re.I)
        if match:
            if current_file is None:
                raise ValueError(f"line {line_number}: TRACK precedes FILE")
            current = Track(int(match.group(1)), match.group(2).upper(), current_file)
            tracks.append(current)
            continue
        match = re.fullmatch(r"INDEX\s+(\d+)\s+(\d{2}:\d{2}:\d{2})", line, re.I)
        if match and current and int(match.group(1)) == 1:
            current.index01 = msf_to_lba(match.group(2))
            continue
        match = re.fullmatch(r"PREGAP\s+(\d{2}:\d{2}:\d{2})", line, re.I)
        if match and current:
            current.pregap = msf_to_lba(match.group(1))
    if not tracks:
        raise ValueError("CUE contains no tracks")
    if any(track.index01 is None for track in tracks):
        raise ValueError("every track must have INDEX 01")
    return tracks


def data_window(mode: str) -> tuple[int, int]:
    if mode == "MODE1/2048":
        return 0, 2048
    if mode == "MODE1/2352":
        return 16, 2048
    if mode == "MODE2/2352":
        return 24, 2048
    if mode == "MODE2/2336":
        return 8, 2048
    raise ValueError(f"not an ISO data mode: {mode}")


def read_user_sector(stream, track: Track, relative_lba: int) -> bytes:
    offset, length = data_window(track.mode)
    byte_offset = ((track.index01 or 0) + relative_lba) * track.sector_bytes + offset
    stream.seek(byte_offset)
    data = stream.read(length)
    if len(data) != length:
        raise ValueError(f"short sector at relative LBA {relative_lba}")
    return data


def parse_dir_record(data: bytes, offset: int = 0) -> dict | None:
    length = data[offset] if offset < len(data) else 0
    if not length:
        return None
    record = data[offset : offset + length]
    name_length = record[32]
    name = record[33 : 33 + name_length]
    if name == b"\x00":
        decoded = "."
    elif name == b"\x01":
        decoded = ".."
    else:
        decoded = name.decode("ascii", "replace")
    return {
        "length": length,
        "extent_lba": struct.unpack_from("<I", record, 2)[0],
        "size": struct.unpack_from("<I", record, 10)[0],
        "flags": record[25],
        "name": decoded,
    }


def read_iso_file(stream, track: Track, entry: dict, limit: int | None = None) -> bytes:
    size = entry["size"] if limit is None else min(entry["size"], limit)
    result = bytearray()
    for sector_index in range((size + 2047) // 2048):
        result.extend(read_user_sector(stream, track, entry["extent_lba"] + sector_index))
    return bytes(result[:size])


def parse_system_cnf(data: bytes) -> dict:
    text = data.rstrip(b"\x00\x1a").decode("ascii", "replace")
    values = {}
    for line in text.splitlines():
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip().upper()] = value.strip()
    boot = values.get("BOOT") or values.get("BOOT2")
    if boot:
        boot = re.sub(r"^cdrom[0-9]*:\\", "", boot, flags=re.I).lstrip("\\/")
    return {"boot_target": boot, "values": values}


def parse_psx_exe_header(data: bytes) -> dict | None:
    if len(data) < 0x800 or data[:8] != b"PS-X EXE":
        return None
    names = (
        "initial_pc",
        "initial_gp",
        "text_address",
        "text_size",
        "data_address",
        "data_size",
        "bss_address",
        "bss_size",
        "stack_address",
        "stack_size",
    )
    values = struct.unpack_from("<10I", data, 0x10)
    return {
        **dict(zip(names, values)),
        "region_text": data[0x4C:0x800].split(b"\x00", 1)[0].decode("ascii", "replace"),
    }


def iso9660_summary(track: Track) -> dict | None:
    try:
        with track.file.open("rb") as stream:
            pvd = read_user_sector(stream, track, 16)
            if pvd[0] != 1 or pvd[1:6] != b"CD001":
                return None
            root = parse_dir_record(pvd, 156)
            if root is None:
                return None
            entries = []
            remaining = root["size"]
            lba = root["extent_lba"]
            while remaining > 0:
                sector = read_user_sector(stream, track, lba)
                cursor = 0
                while cursor < min(remaining, 2048):
                    record = parse_dir_record(sector, cursor)
                    if record is None:
                        break
                    entries.append({key: record[key] for key in ("name", "extent_lba", "size", "flags")})
                    cursor += record["length"]
                lba += 1
                remaining -= 2048
            summary = {
                "system_id": pvd[8:40].decode("ascii", "replace").rstrip(),
                "volume_id": pvd[40:72].decode("ascii", "replace").rstrip(),
                "volume_space_sectors": struct.unpack_from("<I", pvd, 80)[0],
                "root_entries": entries,
            }
            system_cnf = next((entry for entry in entries if entry["name"].upper() == "SYSTEM.CNF;1"), None)
            if system_cnf:
                boot = parse_system_cnf(read_iso_file(stream, track, system_cnf))
                target = (boot["boot_target"] or "").upper()
                executable = next((entry for entry in entries if entry["name"].upper() == target), None)
                if executable:
                    boot["executable_lba"] = executable["extent_lba"]
                    boot["executable_size"] = executable["size"]
                    header = parse_psx_exe_header(read_iso_file(stream, track, executable, 0x800))
                    if header:
                        boot["psx_exe"] = header
                summary["boot"] = boot
            return summary
    except (OSError, ValueError):
        return None


def inventory(cue_path: Path) -> dict:
    tracks = parse_cue(cue_path)
    files: dict[Path, dict] = {}
    disc_cursor = 0
    track_rows = []
    for track in tracks:
        resolved = track.file.resolve()
        if resolved not in files:
            if not resolved.is_file():
                raise FileNotFoundError(resolved)
            files[resolved] = {
                "path": str(track.file.relative_to(cue_path.parent)),
                "bytes": resolved.stat().st_size,
                "sha256": sha256(resolved),
            }
        file_sectors = files[resolved]["bytes"] // track.sector_bytes
        row = {
            "number": track.number,
            "mode": track.mode,
            "sector_bytes": track.sector_bytes,
            "file": files[resolved]["path"],
            "file_index01_lba": track.index01,
            "disc_index01_lba": disc_cursor + track.pregap,
            "byte_offset": (track.index01 or 0) * track.sector_bytes,
            "pregap_sectors": track.pregap,
        }
        if track.mode.startswith("MODE"):
            row["iso9660"] = iso9660_summary(track)
        track_rows.append(row)
        disc_cursor += file_sectors + track.pregap
    return {
        "schema": "soundnovel.psx-disc-inventory.v1",
        "cue": cue_path.name,
        "cue_sha256": sha256(cue_path),
        "files": list(files.values()),
        "tracks": track_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    command = subparsers.add_parser("inventory")
    command.add_argument("cue", type=Path)
    command.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = inventory(args.cue.resolve())
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
