#!/usr/bin/env python3
"""Find static R3000A references in a PS-X EXE without extracting game data."""

from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path


def psx_exe_text(data: bytes) -> tuple[int, bytes]:
    if len(data) < 0x800 or data[:8] != b"PS-X EXE":
        raise ValueError("not a PS-X EXE")
    address, size = struct.unpack_from("<II", data, 0x18)
    if 0x800 + size > len(data):
        raise ValueError("truncated PS-X EXE text")
    return address, data[0x800 : 0x800 + size]


def _hex(value: int) -> str:
    return f"0x{value & 0xffffffff:08x}"


def find_references(data: bytes, target: int) -> list[dict]:
    base, text = psx_exe_text(data)
    target &= 0xffffffff
    references: list[dict] = []
    words = [word[0] for word in struct.iter_unpack("<I", text[: len(text) & ~3])]

    for index, word in enumerate(words):
        pc = (base + index * 4) & 0xffffffff
        opcode = word >> 26
        if opcode in (2, 3):
            destination = ((pc + 4) & 0xf0000000) | ((word & 0x03ffffff) << 2)
            if destination == target:
                references.append({
                    "kind": "jal" if opcode == 3 else "jump",
                    "address": _hex(pc),
                    "target": _hex(destination),
                })

        if word == target:
            references.append({"kind": "pointer", "address": _hex(pc), "target": _hex(target)})

        if opcode != 0x0f:
            continue
        register, high = (word >> 16) & 31, (word & 0xffff) << 16
        for distance in range(1, min(5, len(words) - index)):
            low_word = words[index + distance]
            low_opcode = low_word >> 26
            source, destination = (low_word >> 21) & 31, (low_word >> 16) & 31
            if source != register or destination != register or low_opcode not in (0x09, 0x0d):
                continue
            immediate = low_word & 0xffff
            if low_opcode == 0x09 and immediate & 0x8000:
                immediate -= 0x10000
            value = (high + immediate) & 0xffffffff
            if value == target:
                references.append({
                    "kind": "address",
                    "address": _hex(pc),
                    "low_address": _hex(base + (index + distance) * 4),
                    "target": _hex(target),
                    "register": register,
                })
            break
    return references


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("exe", type=Path)
    parser.add_argument("target", type=lambda value: int(value, 0))
    args = parser.parse_args()
    result = {
        "schema": "soundnovel.psx-mips-references.v1",
        "target": _hex(args.target),
        "references": find_references(args.exe.read_bytes(), args.target),
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
