"""Extract indexed PS2 ED pages from the verified Japanese MODE2/2352 disc."""
import argparse
import hashlib
import json
import struct
from collections import Counter
from pathlib import Path

DISC_SHA = "76b2384779c8b895b3712d2e2b3fd7114389f3ca09bd39e378cc379f2069edd5"


def extent(disc, sector, size):
    data = bytearray()
    for index in range((size + 2047) // 2048):
        disc.seek((sector + index) * 2352 + 24)
        data.extend(disc.read(2048))
    if len(data) < size:
        raise ValueError("Truncated extent")
    return bytes(data[:size])


def scripts(disc):
    # Sector 26 is the D1 directory in this hash-pinned edition.
    directory = extent(disc, 26, 2048)
    cursor = 0
    while directory[cursor]:
        record = directory[cursor:cursor + directory[cursor]]
        cursor += len(record)
        name = record[33:33 + record[32]].decode("ascii")
        if name.endswith(".ED;1"):
            yield name[:-5], extent(disc, struct.unpack_from("<I", record, 2)[0],
                                    struct.unpack_from("<I", record, 10)[0])


def pages(data):
    version, trailer, groups = struct.unpack_from("<III", data)
    assert version == 1
    table = 12 + groups * 8
    end = struct.unpack_from("<I", data, 12)[0]
    start = struct.unpack_from("<I", data, table)[0]
    offsets = [x for x, in struct.iter_unpack("<I", data[table:start])] + [end]
    assert offsets == sorted(offsets) and end <= trailer <= len(data)
    for group in range(groups):
        label, first, last = struct.unpack_from("<IHH", data, 12 + group * 8)
        title = data[label:data.index(0, label)].decode("cp932")
        for page in range(first, last + 1):
            yield page, title, offsets[page], data[offsets[page]:offsets[page+1]]


def glyph(data, pos):
    value = data[pos]
    if 0x20 <= value <= 0x72:
        return chr(0x3041 + value - 0x20), 1
    if 0x73 <= value <= 0x80:
        return chr(0x30a1 + value - 0x73), 1
    if 0xa0 <= value <= 0xdf:
        return chr(0x30af + value - 0xa1), 1
    if 0xf0 <= value <= 0xf8:
        return chr(0x30ee + value - 0xf0), 1
    if value in (0x1b, 0x1c, 0x1f):
        return "{%02X}" % value, 1
    if value in (0x1d, 0x1e):
        return "{%02X:%02X}" % (value, data[pos+1]), 2
    return data[pos:pos+2].decode("cp932"), 2


def tokens(data):
    pos = 0
    result = []
    while pos < len(data) - 1:
        start = pos
        code = data[pos]
        if 1 <= code <= 8:
            size = data[pos+1]
            payload = data[pos+2:pos+2+size]
            pos += 2 + size
            result.append(dict(kind="command", offset=start, opcode=code, args=payload.hex()))
            if code == 4 and payload[0] >> 4 in (0, 8):
                cursor = 10 if payload[0] & 0x80 else 3
                for _ in range(payload[0] & 15):
                    offset = cursor
                    label = ""
                    while payload[cursor]:
                        char, width = glyph(payload, cursor)
                        label += char
                        cursor += width
                    target = int.from_bytes(payload[cursor+1:cursor+3], "big")
                    result.append(dict(kind="choice", offset=start+2+offset, ja=label, target=target))
                    cursor += 3
                assert cursor == len(payload)
        else:
            line = ""
            while pos < len(data)-1 and data[pos] >= 0x1b:
                char, width = glyph(data, pos)
                line += char
                pos += width
            if pos == start:
                raise ValueError(f"Unexpected opcode {code} at {pos}")
            result.append(dict(kind="text", offset=start, ja=line))
    assert pos == len(data)-1 and data[pos] == 0
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bin", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    documents = {}
    counts = Counter()
    with args.bin.open("rb") as disc:
        if hashlib.file_digest(disc, "sha256").hexdigest() != DISC_SHA:
            raise ValueError("Disc SHA-256 mismatch")
        for name, data in scripts(disc):
            rows = []
            for page, title, offset, block in pages(data):
                assert page == len(rows)
                items = tokens(block)
                for item in items:
                    item["id"] = f"{name}-{page:04d}-{item['offset']:04x}"
                    counts[item["kind"]] += 1
                rows.append(dict(page=page, scene=title, offset=offset, items=items))
            documents[name] = rows
    assert len(documents) == 18
    args.output.mkdir(parents=True, exist_ok=True)
    for name, rows in documents.items():
        (args.output / (name + ".json")).write_text(
            json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(sum(map(len, documents.values())), "pages", dict(counts))


if __name__ == "__main__":
    main()
