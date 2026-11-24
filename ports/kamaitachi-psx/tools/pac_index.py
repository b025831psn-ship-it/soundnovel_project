#!/usr/bin/env python3
"""Inspect a sector-indexed PAC without extracting any member payload."""

from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path


SECTOR_SIZE = 2048
TERMINATOR_ID = 0xFFFF


def parse_index(data: bytes, file_size: int) -> dict:
    if file_size <= 0 or file_size % SECTOR_SIZE:
        raise ValueError("PAC size must be a positive multiple of 2048")
    total_sectors = file_size // SECTOR_SIZE
    entries = []
    previous_offset = -1
    terminator_offset = None
    for cursor in range(0, len(data) - 3, 4):
        resource_id, sector_offset = struct.unpack_from("<HH", data, cursor)
        if resource_id == TERMINATOR_ID:
            terminator_offset = sector_offset
            break
        if sector_offset <= previous_offset or sector_offset > total_sectors:
            raise ValueError(f"invalid PAC index offset at byte {cursor}")
        entries.append({"id": resource_id, "sector_offset": sector_offset})
        previous_offset = sector_offset
    if terminator_offset is None:
        raise ValueError("PAC index terminator was not found in supplied prefix")
    if terminator_offset != total_sectors:
        raise ValueError("PAC terminator does not match file sector count")
    for index, entry in enumerate(entries):
        next_offset = entries[index + 1]["sector_offset"] if index + 1 < len(entries) else total_sectors
        entry["sector_count"] = next_offset - entry["sector_offset"]
        entry["byte_offset"] = entry["sector_offset"] * SECTOR_SIZE
        entry["byte_size"] = entry["sector_count"] * SECTOR_SIZE
    index_bytes = (len(entries) + 1) * 4
    return {
        "schema": "soundnovel.psx-pac-index.v1",
        "file_size": file_size,
        "total_sectors": total_sectors,
        "index_bytes": index_bytes,
        "index_sectors": (index_bytes + SECTOR_SIZE - 1) // SECTOR_SIZE,
        "entry_count": len(entries),
        "entries": entries,
    }


def inspect(path: Path) -> dict:
    size = path.stat().st_size
    with path.open("rb") as stream:
        prefix = stream.read(min(size, 1024 * 1024))
    result = parse_index(prefix, size)
    result["file"] = path.name
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pac", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    rendered = json.dumps(inspect(args.pac), ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
