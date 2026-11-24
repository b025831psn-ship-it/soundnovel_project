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


def parse_record_table(data: bytes) -> dict:
    """Parse a member-local u16 offset table without returning payload bytes."""
    if len(data) < 2:
        raise ValueError("PAC member is too short for a record table")
    table_bytes = struct.unpack_from("<H", data)[0]
    if table_bytes < 2 or table_bytes % 2 or table_bytes > len(data):
        raise ValueError("invalid PAC record table size")
    offsets = list(struct.unpack_from(f"<{table_bytes // 2}H", data))
    if offsets[0] != table_bytes:
        raise ValueError("first PAC record must follow its offset table")
    if any(left > right for left, right in zip(offsets, offsets[1:])):
        raise ValueError("PAC record offsets must not decrease")
    if offsets[-1] > len(data):
        raise ValueError("PAC record offset exceeds member size")
    records = []
    for index, offset in enumerate(offsets):
        end = offsets[index + 1] if index + 1 < len(offsets) else len(data)
        records.append({"id": index, "byte_offset": offset, "byte_size": end - offset})
    return {
        "schema": "soundnovel.psx-pac-record-table.v1",
        "table_bytes": table_bytes,
        "record_count": len(records),
        "records": records,
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
    parser.add_argument("--records", type=int, metavar="RESOURCE_ID")
    args = parser.parse_args()
    result = inspect(args.pac)
    if args.records is not None:
        entry = next((row for row in result["entries"] if row["id"] == args.records), None)
        if entry is None:
            parser.error(f"resource id {args.records} is not present")
        with args.pac.open("rb") as stream:
            stream.seek(entry["byte_offset"])
            member = stream.read(entry["byte_size"])
        result["record_table"] = {"resource_id": args.records, **parse_record_table(member)}
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
