#!/usr/bin/env python3
"""Extract SLPS-01863 resources and Japanese scenario text.

The input files are user-owned disc files.  This tool never modifies them and
does not copy executable or resource bytes into its output.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
from pathlib import Path


EXE_LOAD_ADDRESS = 0x80010000
EXE_PAYLOAD_OFFSET = 0x800
RESOURCE_INDEX_OFFSET = 0x4C5AC
RESOURCE_ENTRY_SIZE = 24
SCENARIO_NAMES = tuple(f"A{x}.BIN" for x in (10, 11, 20, 21, 30, 40, 50, 60, 70))
EXPECTED_EXE_SHA1 = "e65bd311d70cf409d3e4bf5557db269cc7f4f1f7"
EXPECTED_SCRP_SHA1 = "1959c8629767762f131866abbc84b43e186938bd"

CONTROL_RE = re.compile(r"@(l[0-9a-fA-F]{2},[0-9a-fA-F]{2}|w[0-9a-fA-F]{2}|[rkpqgn0-9])")
JAPANESE_RE = re.compile(r"[ぁ-んァ-ヶ一-龯々〆ヵヶ「」『』]")


def digest(data: bytes, algorithm: str) -> str:
    return hashlib.new(algorithm, data).hexdigest()


def decode_lzss(data: bytes) -> tuple[bytes, int]:
    """Decode the LZSS routine used by SLPS-01863.

    The 4 KiB ring starts filled with spaces and at write position zero.  Flag
    bits are consumed least-significant first.  A clear bit is a two-byte
    back-reference; a set bit is a literal.
    """

    if len(data) < 2:
        raise ValueError("compressed resource is shorter than its length prefix")
    if data[0] & 0x80:
        if len(data) < 3:
            raise ValueError("truncated three-byte length prefix")
        output_size = ((data[0] & 0x7F) << 16) | (data[1] << 8) | data[2]
        cursor = 3
    else:
        output_size = (data[0] << 8) | data[1]
        cursor = 2

    ring = bytearray(b" " * 4096)
    ring_cursor = 0
    output = bytearray()
    while len(output) < output_size:
        if cursor >= len(data):
            raise ValueError("compressed resource ended before the declared output size")
        flags = data[cursor]
        cursor += 1
        for bit in range(8):
            if len(output) >= output_size:
                break
            if flags & (1 << bit):
                if cursor >= len(data):
                    raise ValueError("truncated LZSS literal")
                value = data[cursor]
                cursor += 1
                output.append(value)
                ring[ring_cursor] = value
                ring_cursor = (ring_cursor + 1) & 0xFFF
                continue

            if cursor + 1 >= len(data):
                raise ValueError("truncated LZSS back-reference")
            low, packed = data[cursor : cursor + 2]
            cursor += 2
            source = low | ((packed & 0xF0) << 4)
            length = (packed & 0x0F) + 3
            for index in range(length):
                if len(output) >= output_size:
                    break
                value = ring[(source + index) & 0xFFF]
                output.append(value)
                ring[ring_cursor] = value
                ring_cursor = (ring_cursor + 1) & 0xFFF
    return bytes(output), cursor


def parse_resource_index(exe: bytes) -> list[dict]:
    resources = []
    cursor = RESOURCE_INDEX_OFFSET
    while cursor + RESOURCE_ENTRY_SIZE <= len(exe):
        entry = exe[cursor : cursor + RESOURCE_ENTRY_SIZE]
        flags, group = struct.unpack_from("<hh", entry, 12)
        if group == -1:
            break
        name = entry[:12].split(b"\0", 1)[0].decode("ascii")
        sector, size = struct.unpack_from("<II", entry, 16)
        resources.append(
            {
                "index": len(resources),
                "name": name,
                "flags": flags,
                "group": group,
                "sector": sector,
                "offset": sector * 0x800,
                "size": size,
            }
        )
        cursor += RESOURCE_ENTRY_SIZE
    if len(resources) != 598 or resources[0]["name"] != "K0.KF1":
        raise ValueError("SLPS-01863 resource index signature did not match")
    return resources


def is_record_start(data: bytes, offset: int) -> bool:
    if offset + 12 > len(data) or data[offset] != 0xFE:
        return False
    return all(
        value in (0, 0x0D, 0x20)
        or 0x30 <= value <= 0x39
        or 0x41 <= value <= 0x5A
        or 0x61 <= value <= 0x7A
        for value in data[offset + 1 : offset + 12]
    )


def next_command(data: bytes, cursor: int, end: int) -> int:
    """Find the next VM command without mistaking an SJIS trail 0x40 for '@'."""

    while cursor < end:
        value = data[cursor]
        if value == 0x40 and cursor + 1 < end and data[cursor + 1] <= 0x14:
            return cursor
        if (0x81 <= value <= 0x9F or 0xE0 <= value <= 0xFC) and cursor + 1 < end:
            cursor += 2
        else:
            cursor += 1
    return end


def render_controls(text: str) -> str:
    rendered = CONTROL_RE.sub(lambda match: f"[{match.group(1)}]", text)
    if "@" in rendered:
        raise ValueError(f"unrecognized inline control in {text!r}")
    return rendered


def extract_scenario(decoded: bytes, resource_number: int, resource_name: str) -> tuple[list, list]:
    starts = [offset for offset in range(len(decoded)) if is_record_start(decoded, offset)]
    records = []
    items = []
    for record_number, start in enumerate(starts):
        end = starts[record_number + 1] if record_number + 1 < len(starts) else len(decoded)
        label = decoded[start + 1 : start + 12].rstrip(b"\0 \r").decode("ascii")
        body_start = start + 12
        record_items = []

        # 40 01 cannot occur inside valid CP932 text.  It may immediately
        # follow an address operand whose final byte happens to be an SJIS lead,
        # so searching commands globally as CP932 would incorrectly skip text.
        cursor = body_start
        while cursor + 1 < end:
            command = decoded.find(b"\x40\x01", cursor, end)
            if command < 0:
                break
            text_end = next_command(decoded, command + 2, end)
            raw = decoded[command + 2 : text_end].rstrip(b" \0")
            try:
                text = raw.decode("cp932")
            except UnicodeDecodeError as error:
                raise ValueError(
                    f"{resource_name} record {record_number} offset {command - body_start}: {error}"
                ) from error
            if not text:
                raise ValueError(f"empty text command in {resource_name} record {record_number}")
            rendered = render_controls(text)
            relative = command - body_start
            item = {
                "id": f"{resource_number:03d}-{record_number:03d}-{relative:04d}",
                "label": label,
                "offset": relative,
                "ja": rendered,
            }
            if "[g]" in rendered or "[q]" in rendered:
                item["beforeChoice"] = True
            items.append(item)
            record_items.append(item)
            cursor = text_end

        records.append(
            {
                "resource": resource_name,
                "number": record_number,
                "label": label,
                "offset": start,
                "size": end - start,
                "items": record_items,
            }
        )
    return records, items


def exe_address(file_offset: int) -> str:
    return f"0x{EXE_LOAD_ADDRESS + file_offset - EXE_PAYLOAD_OFFSET:08x}"


def read_c_strings(exe: bytes, start: int, end: int, group: str, translate: bool = True) -> list:
    items = []
    cursor = (start + 3) & ~3
    while cursor < end:
        terminator = exe.find(b"\0", cursor, end)
        if terminator < 0:
            break
        raw = exe[cursor:terminator]
        try:
            text = raw.decode("cp932")
        except UnicodeDecodeError:
            cursor += 1
            continue
        if text.isprintable() and JAPANESE_RE.search(text):
            items.append(
                {
                    "id": f"EXE-{exe_address(cursor)[2:].upper()}",
                    "addr": exe_address(cursor),
                    "fileOffset": f"0x{cursor:x}",
                    "group": group,
                    "ja": render_controls(text),
                    "bytes": len(raw),
                    "translate": translate,
                }
            )
        cursor = (terminator + 4) & ~3
    return items


def extract_exe_strings(exe: bytes) -> tuple[dict, dict]:
    groups = (
        (0xA10, 0xC00, "menu", True),
        (0x1000, 0x16A0, "system", True),
        (0x1768, 0x1AA0, "endings", True),
        (0x595F8, 0x596A0, "labels", True),
        (0x597BC, 0x597D4, "system", True),
        (0x597FC, 0x5982C, "endings", True),
    )
    items = []
    for start, end, group, translate in groups:
        items.extend(read_c_strings(exe, start, end, group, translate))

    name_offsets = (0x5976C, 0x59774, 0x5977C, 0x59784, 0x59790)
    names = []
    for index, offset in enumerate(name_offsets):
        end = exe.index(0, offset)
        names.append(
            {
                "id": f"NAME-{index:02d}",
                "addr": exe_address(offset),
                "fileOffset": f"0x{offset:x}",
                "ja": exe[offset:end].decode("cp932"),
                "translate": False,
            }
        )
    return (
        {
            "schema": "majo.ps1.exe-strings.v1",
            "source": "SLPS_018.63",
            "items": items,
        },
        {
            "schema": "majo.ps1.name-judgment.v1",
            "source": "SLPS_018.63",
            "notes": "The executable compares entered names with these fixed Japanese strings.",
            "items": names,
        },
    )


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_markdown(path: Path, resource_number: int, records: list, item_count: int) -> None:
    lines = [
        f"# {records[0]['resource']} resource {resource_number}",
        "",
        f"{item_count} entries. Ids: resource-record-offset. Codes in [brackets].",
        "",
    ]
    for record in records:
        if not record["items"]:
            continue
        lines.extend((f"## {record['label']} (record {record['number']})", ""))
        for item in record["items"]:
            suffix = " (choice)" if item.get("beforeChoice") else ""
            lines.append(f"- `{item['id']}`{suffix}: {item['ja']}")
        lines.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def extract(exe_path: Path, scrp_path: Path, output: Path) -> dict:
    exe = exe_path.read_bytes()
    scrp = scrp_path.read_bytes()
    exe_sha1 = digest(exe, "sha1")
    scrp_sha1 = digest(scrp, "sha1")
    if exe_sha1 != EXPECTED_EXE_SHA1 or scrp_sha1 != EXPECTED_SCRP_SHA1:
        raise ValueError(
            "input hashes are not SLPS-01863: "
            f"exe={exe_sha1}, SCRP.D={scrp_sha1}"
        )

    resources = parse_resource_index(exe)
    by_name = {resource["name"]: resource for resource in resources}
    all_items = []
    total_records = 0
    scenario_manifest = []
    for resource_number, name in enumerate(SCENARIO_NAMES):
        resource = by_name[name]
        packed = scrp[resource["offset"] : resource["offset"] + resource["size"]]
        decoded, consumed = decode_lzss(packed)
        records, items = extract_scenario(decoded, resource_number, name)
        all_items.extend(items)
        total_records += len(records)
        scenario_manifest.append(
            {
                "name": name,
                "resourceIndex": resource["index"],
                "packedBytes": resource["size"],
                "compressedBytesConsumed": consumed,
                "decodedBytes": len(decoded),
                "packedSha256": digest(packed, "sha256"),
                "decodedSha256": digest(decoded, "sha256"),
                "records": len(records),
                "items": len(items),
            }
        )
        write_markdown(output / "md" / f"{resource_number:03d}.md", resource_number, records, len(items))

    script = {
        "schema": "majo.ps1.script.v1",
        "source": {"file": "SCRP.D", "sha1": scrp_sha1},
        "records": total_records,
        "entries": len(all_items),
        "gaps": [],
        "nonText": [],
        "items": all_items,
    }
    write_json(output / "script.ja.json", script)
    write_json(output / "uncovered.json", [])
    exe_strings, name_judgment = extract_exe_strings(exe)
    write_json(output / "extra" / "ps1-exe-strings.json", exe_strings)
    write_json(output / "extra" / "name-judgment.json", name_judgment)

    resource_manifest = []
    for resource in resources:
        packed = scrp[resource["offset"] : resource["offset"] + resource["size"]]
        resource_manifest.append({**resource, "sha256": digest(packed, "sha256")})
    manifest = {
        "schema": "majo.ps1.extraction-manifest.v1",
        "edition": "SLPS-01863 standard edition",
        "inputs": {
            "SLPS_018.63": {"bytes": len(exe), "sha1": exe_sha1, "sha256": digest(exe, "sha256")},
            "SCRP.D": {"bytes": len(scrp), "sha1": scrp_sha1, "sha256": digest(scrp, "sha256")},
        },
        "resourceCount": len(resources),
        "recordCount": total_records,
        "itemCount": len(all_items),
        "uncoveredCount": 0,
        "scenario": scenario_manifest,
        "resources": resource_manifest,
    }
    write_json(output / "manifest.json", manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--exe", required=True, type=Path, help="SLPS_018.63 path")
    parser.add_argument("--scrp", required=True, type=Path, help="SCRP.D path")
    parser.add_argument("--output", required=True, type=Path, help="new or empty output directory")
    args = parser.parse_args()
    if args.output.exists() and any(args.output.iterdir()):
        parser.error("--output must be new or empty")
    manifest = extract(args.exe, args.scrp, args.output)
    print(json.dumps({key: manifest[key] for key in ("resourceCount", "recordCount", "itemCount", "uncoveredCount")}))


if __name__ == "__main__":
    main()
