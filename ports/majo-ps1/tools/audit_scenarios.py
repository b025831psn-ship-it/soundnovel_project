#!/usr/bin/env python3
"""Exhaustively audit SLPS-01863 scenario commands and private asset references.

The report contains addresses, labels, resource names and counts, never scenario
text or resource bytes. Inputs are read-only user-owned files.
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import struct
from pathlib import Path

from extract_script import (
    EXPECTED_EXE_SHA1,
    EXPECTED_SCRP_SHA1,
    SCENARIO_NAMES,
    decode_lzss,
    digest,
    is_record_start,
    next_command,
    parse_resource_index,
)


KNOWN_OPCODES = set(range(0x15))
MOVIE_RE = re.compile(rb"[A-Z0-9_]{1,12}\.STR")
CONTROL_RE = re.compile(rb"@(l[0-9a-fA-F]{2},[0-9a-fA-F]{2}|w[0-9a-fA-F]{2}|n[0-9a-fA-F]+|[rkpqg0-9])")


def command_id(resource: str, offset: int) -> str:
    return f"{resource}:0x{offset:06x}"


def branch_targets(data: bytes, offset: int, limit: int) -> tuple[list[int], int]:
    opcode = data[offset + 1]
    cursor = offset + 2
    if opcode == 0x02:
        return [int.from_bytes(data[cursor:cursor + 4], "big")], cursor + 4
    if opcode in (0x03, 0x04):
        cursor += 2
        targets = []
        while cursor + 4 <= limit:
            test = data[cursor]
            targets.append(int.from_bytes(data[cursor + 1:cursor + 4], "big"))
            cursor += 4
            if test == 0xFF:
                return targets, cursor
        raise ValueError("unterminated branch table")
    if opcode == 0x05:
        if cursor + 6 > limit:
            raise ValueError("truncated choice header")
        count = data[cursor + 5]
        cursor += 6
        if cursor + 4 * count > limit:
            raise ValueError("truncated choice target table")
        return ([int.from_bytes(data[cursor + 4*i:cursor + 4*i + 4], "big") for i in range(count)],
                cursor + 4 * count)
    return [], cursor


def match_asset(data: bytes, start: int, limit: int, names: set[str], *, aligned: bool) -> tuple[str | None, int]:
    lower = data[start:limit].lower()
    matches = [name for name in names if lower.startswith(name.lower().encode("ascii"))]
    if not matches:
        return None, start
    name = max(matches, key=len)
    cursor = start + len(name)
    while cursor < limit and data[cursor] == 0x20:
        cursor += 1
    if cursor < limit and data[cursor] == 0:
        cursor += 1
        if aligned and cursor % 2:
            cursor += 1
    return name, cursor


def glyph_supported(code: int, fonts: list[bytes], tables: list[list[tuple[int, int]]]) -> bool:
    bank = int(code >= 0x889F)
    if bank:
        index = 2 * ((code >> 8) - 0x88) - int((code & 0xFF) < 0x7F)
        if not 0 <= index < len(tables[1]):
            return False
        start, base = tables[1][index]
    else:
        ranges = [entry for entry in tables[0] if entry[0] <= code]
        if not ranges:
            return False
        start, base = ranges[-1]
    glyph = (base + code - start) * 26
    return 0 <= glyph and glyph + 26 <= len(fonts[bank])


def text_glyphs(raw: bytes) -> list[int]:
    # Inline controls are ASCII and never reach the glyph lookup. ASCII spaces
    # are layout padding in pairs and likewise do not consume a KF1 glyph.
    raw = CONTROL_RE.sub(b"", raw).rstrip(b" \0")
    glyphs = []
    cursor = 0
    while cursor < len(raw):
        value = raw[cursor]
        if value in (0, 0x20):
            cursor += 1
            continue
        if value == 0x40:
            raise ValueError(f"unknown inline control at byte {cursor}")
        if not (0x81 <= value <= 0x9F or 0xE0 <= value <= 0xFC) or cursor + 1 >= len(raw):
            raise ValueError(f"unsupported single-byte text 0x{value:02x} at byte {cursor}")
        glyphs.append((value << 8) | raw[cursor + 1])
        cursor += 2
    return glyphs


def audit(exe: bytes, scrp: bytes) -> dict:
    if digest(exe, "sha1") != EXPECTED_EXE_SHA1 or digest(scrp, "sha1") != EXPECTED_SCRP_SHA1:
        raise ValueError("inputs are not the expected SLPS-01863 executable and SCRP.D")
    resources = parse_resource_index(exe)
    by_name = {entry["name"]: entry for entry in resources}
    available = {name.upper() for name in by_name}
    movies = {match.decode("ascii") for match in MOVIE_RE.findall(exe)}
    picture_bases = {name[:-2] for name in available if name.endswith(".P")}
    movie_bases = {name[:-4] for name in movies}
    fonts = []
    for name in ("K0.KF1", "K1.KF1"):
        entry = by_name[name]
        fonts.append(scrp[entry["offset"]:entry["offset"] + entry["size"]])
    tables = [
        list(struct.iter_unpack("<HH", exe[start:start + 4*size]))
        for start, size in ((0x48A20, 19), (0x48A6C, 32))
    ]

    issues: list[dict] = []
    opcode_counts = collections.Counter()
    totals = collections.Counter()
    picture_refs, movie_refs, music_refs, sound_refs, ending_refs = set(), set(), set(), set(), set()
    disabled_endings = 0
    resource_summaries = []

    def issue(kind: str, location: str, detail: str) -> None:
        issues.append({"kind": kind, "location": location, "detail": detail})

    for resource_name in SCENARIO_NAMES:
        entry = by_name[resource_name]
        packed = scrp[entry["offset"]:entry["offset"] + entry["size"]]
        data, _ = decode_lzss(packed)
        starts = [offset for offset in range(len(data)) if is_record_start(data, offset)]
        labels = []
        commands = set()
        audited_texts = set()
        targets: list[tuple[str, int]] = []
        text_count = 0
        for record_number, start in enumerate(starts):
            end = starts[record_number + 1] if record_number + 1 < len(starts) else len(data)
            label = data[start + 1:start + 12].rstrip(b"\0 \r").decode("ascii")
            labels.append(label)
            # Text extraction deliberately uses the same direct marker scan as
            # extract_script.py. Some operands contain padding that resembles
            # data, so a command-by-command decoder alone can jump over a real
            # text marker. Audit every extracted text independently first.
            probe = start + 12
            while True:
                probe = data.find(b"\x40\x01", probe, end)
                if probe < 0:
                    break
                text_end = next_command(data, probe + 2, end)
                raw = data[probe + 2:text_end]
                location = command_id(resource_name, probe)
                audited_texts.add(probe)
                commands.add(probe)
                opcode_counts[0x01] += 1
                text_count += 1
                if not raw.rstrip(b" \0"):
                    issue("emptyText", location, "text payload is empty")
                try:
                    raw.rstrip(b" \0").decode("cp932")
                    for code in text_glyphs(raw):
                        if not glyph_supported(code, fonts, tables):
                            issue("unsupportedGlyph", location, f"0x{code:04x}")
                except (UnicodeDecodeError, ValueError) as error:
                    issue("unsupportedCharacter", location, str(error))
                probe += 2
            cursor = next_command(data, start + 12, end)
            while cursor < end:
                location = command_id(resource_name, cursor)
                opcode = data[cursor + 1]
                commands.add(cursor)
                if opcode != 0x01:
                    opcode_counts[opcode] += 1
                if opcode not in KNOWN_OPCODES:
                    issue("unimplementedOpcode", location, f"0x{opcode:02x}")
                    cursor = next_command(data, cursor + 2, end)
                    continue
                operand = cursor + 2
                next_offset = operand
                found_targets = []
                try:
                    if opcode in (0x00, 0x12):
                        next_offset = next_command(data, operand, end)
                    elif opcode == 0x01:
                        next_offset = next_command(data, operand, end)
                    elif opcode in (0x02, 0x03, 0x04, 0x05):
                        found_targets, next_offset = branch_targets(data, cursor, end)
                    elif opcode == 0x06 or opcode == 0x0B:
                        next_offset = operand
                    elif opcode == 0x07:
                        name, after_name = match_asset(data, operand, end, picture_bases, aligned=True)
                        next_offset = after_name + 6
                        if name:
                            asset = f"{name}.P"
                            picture_refs.add(asset)
                            if asset not in available:
                                issue("missingPicture", location, asset)
                        else:
                            issue("missingPicture", location, "unrecognized picture name")
                            next_offset = next_command(data, operand, end)
                    elif opcode == 0x08:
                        if operand >= end:
                            raise ValueError("truncated movie mode")
                        mode = data[operand]
                        at = operand + 1
                        names = []
                        if mode & 1:
                            name, at = match_asset(data, at, end, movie_bases, aligned=False)
                            if name:
                                names.append(name)
                            picture, at = match_asset(data, at, end, picture_bases, aligned=True)
                            if picture:
                                asset = f"{picture}.P"
                                picture_refs.add(asset)
                                if asset not in available:
                                    issue("missingPicture", location, asset)
                            else:
                                issue("missingPicture", location, "unrecognized movie background")
                        else:
                            name, at = match_asset(data, at, end, movie_bases, aligned=True)
                            if name:
                                names.append(name)
                        next_offset = at
                        if not names:
                            issue("missingMovie", location, "unrecognized movie name")
                            next_offset = next_command(data, operand, end)
                        for name in names:
                            asset = f"{name}.STR"
                            movie_refs.add(asset)
                            if asset not in movies:
                                issue("missingMovie", location, asset)
                    elif opcode == 0x09:
                        next_offset = operand + 2
                    elif opcode == 0x0A:
                        next_offset = operand + 4
                    elif opcode == 0x0C:
                        next_offset = operand + 2
                    elif opcode == 0x0D:
                        next_offset = operand + 6
                    elif opcode in (0x0E, 0x0F, 0x11):
                        next_offset = operand + 4
                    elif opcode in (0x10, 0x13):
                        next_offset = operand + 2
                    elif opcode == 0x14:
                        name, _ = match_asset(data, operand, end, picture_bases, aligned=False)
                        next_offset = next_command(data, operand, end)
                        if name:
                            asset = f"{name}.P"
                            picture_refs.add(asset)
                            if asset not in available:
                                issue("missingPicture", location, asset)
                        else:
                            issue("missingPicture", location, "unrecognized picture name")
                    else:
                        raise AssertionError(opcode)
                    targets.extend((location, target) for target in found_targets)
                except (IndexError, ValueError) as error:
                    issue("invalidOperand", location, str(error))
                    next_offset = next_command(data, operand, end)

                if opcode == 0x09 and cursor + 4 <= next_offset:
                    value = int.from_bytes(data[cursor + 2:cursor + 4], "big")
                    music_refs.add(value)
                    if 1 <= value <= 19 and f"BGM{value:02X}.VA" not in available:
                        issue("missingMusic", location, f"BGM{value:02X}.VA")
                elif opcode == 0x0A and cursor + 4 <= next_offset:
                    value = int.from_bytes(data[cursor + 2:cursor + 4], "big")
                    sound_refs.add(value)
                    if not 0 <= value <= 0x67 or f"SE{value:02X}.VAB" not in available:
                        issue("missingSound", location, f"SE{value:02X}.VAB")
                elif opcode == 0x10 and cursor + 4 <= next_offset:
                    value = int.from_bytes(data[cursor + 2:cursor + 4], "big")
                    if value >> 8 == 0x20:
                        disabled_endings += 1
                    else:
                        ending_refs.add(value)
                if next_offset <= cursor or next_offset > end:
                    issue("invalidOperand", location, f"next offset 0x{next_offset:x}")
                    next_offset = cursor + 2
                cursor = next_offset if next_offset < end and data[next_offset:next_offset + 1] == b"@" \
                    and next_offset + 1 < end and data[next_offset + 1] <= 0x14 \
                    else next_command(data, next_offset, end)

        # 0xffffff is the random/default sentinel. A 24- or 32-bit target
        # beginning with ASCII space is an unused/dead table slot in the retail
        # data; the original dispatcher preserves it verbatim, but no live
        # condition selects it.
        for source, target in targets:
            if target == 0xFFFFFF or target & 0xFF0000 == 0x200000 or target >> 24 == 0x20:
                continue
            if not 0 <= target < len(data):
                issue("invalidJump", source, f"0x{target:06x}")
        duplicates = [label for label, count in collections.Counter(labels).items() if count > 1]
        for label in duplicates:
            issue("duplicateLabel", resource_name, label)
        empty_labels = [number for number, label in enumerate(labels) if not label]
        for number in empty_labels:
            issue("unreachableLabel", f"{resource_name}:record-{number:04d}", "empty label")
        totals.update(records=len(starts), commands=len(commands), texts=text_count, targets=len(targets))
        resource_summaries.append({
            "resource": resource_name,
            "records": len(starts),
            "commands": len(commands),
            "texts": text_count,
            "targets": len(targets),
        })

    return {
        "schema": "majo.ps1.scenario-audit.v1",
        "edition": "SLPS-01863 standard edition",
        "totals": dict(totals),
        "opcodeCounts": {f"0x{opcode:02x}": opcode_counts[opcode] for opcode in sorted(opcode_counts)},
        "references": {
            "pictures": len(picture_refs),
            "movies": len(movie_refs),
            "musicIds": sorted(music_refs),
            "soundIds": len(sound_refs),
            "endingIds": sorted(ending_refs),
            "disabledEndingSlots": disabled_endings,
        },
        "resources": resource_summaries,
        "issueCount": len(issues),
        "issues": issues,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exe", required=True, type=Path)
    parser.add_argument("--scrp", required=True, type=Path)
    parser.add_argument("--output", type=Path, help="optional private JSON report path")
    args = parser.parse_args()
    report = audit(args.exe.read_bytes(), args.scrp.read_bytes())
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "totals": report["totals"],
        "opcodeCounts": report["opcodeCounts"],
        "references": report["references"],
        "issueCount": report["issueCount"],
    }, ensure_ascii=False))
    if report["issues"]:
        for item in report["issues"][:50]:
            print(f"{item['kind']}: {item['location']}: {item['detail']}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
