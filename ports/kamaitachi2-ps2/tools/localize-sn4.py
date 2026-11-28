#!/usr/bin/env python3
"""Compile sn4text/1 translations into a browser SN4 program."""
import argparse
import copy
import json
from pathlib import Path

from sn4text import STOP, TOKEN, load, units

NAMES = {"HERO": 0x0D, "PARTNER": 0x0E, "NAME3": 0x0F}
VISIBLE = {0x02, 0x04, 0x0D, 0x0E, 0x0F}


def translated_ops(text, codes, offset):
    result, cursor = [], 0
    for match in TOKEN.finditer(text):
        if match.start() > cursor:
            result.append({"op": 0x02, "args": [text[cursor:match.start()]], "offset": offset})
        token = match.group()[1:-1]
        if token in NAMES:
            result.append({"op": NAMES[token], "args": [], "offset": offset})
        elif token.startswith("#"):
            item = copy.deepcopy(codes[int(token[1:])]); item["offset"] = offset; result.append(item)
        elif token.startswith("rb:"):
            base, reading = token[3:].split("|", 1)
            result.extend([{"op": 0x106, "args": [base, reading.split("/")], "offset": offset},
                           {"op": 0x02, "args": [base], "offset": offset}])
        cursor = match.end()
    if cursor < len(text):
        result.append({"op": 0x02, "args": [text[cursor:]], "offset": offset})
    return result


def compile_program(program, ja_dir, ko_dir):
    _, source = load(ja_dir); _, translated = load(ko_dir)
    source_by_id = {u["id"]: u for u in source}; ko_by_id = {u["id"]: u["ko"] for u in translated}
    if [u["id"] for u in units(program)[0]] != [u["id"] for u in source]:
        raise ValueError("translation source does not match SN4 program")
    output = copy.deepcopy(program)
    for label in output["labels"]:
        ops, ranges, start = label["ops"], [], 0
        for end in range(len(ops) + 1):
            if end < len(ops) and ops[end]["op"] not in STOP: continue
            segment = ops[start:end]
            starts = [i for i, op in enumerate(segment) if op["op"] in {0x02, 0x0D, 0x0E, 0x0F, 0x106}]
            if starts:
                first = starts[0]
                visible = [i for i, op in enumerate(segment[first:], first) if op["op"] in VISIBLE]
                last = visible[-1]
                uid = f"{label['label']}@{segment[first]['offset']:#x}"
                source_unit = source_by_id[uid]
                replacement = translated_ops(ko_by_id[uid], source_unit.get("codes", []), segment[first]["offset"])
                ranges.append((start + first, start + last + 1, replacement))
            start = end + 1
        for begin, finish, replacement in reversed(ranges): ops[begin:finish] = replacement
    output["language"] = "ko"
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("program", type=Path); parser.add_argument("ja_dir", type=Path)
    parser.add_argument("ko_dir", type=Path); parser.add_argument("output", type=Path)
    args = parser.parse_args()
    localized = compile_program(json.loads(args.program.read_text(encoding="utf-8")), args.ja_dir, args.ko_dir)
    args.output.write_text(json.dumps(localized, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__": main()
