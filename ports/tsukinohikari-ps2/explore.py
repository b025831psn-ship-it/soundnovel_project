"""Inspect all control-flow sites without copying dialogue to the report."""
import argparse
import json
from collections import Counter
from pathlib import Path


def inspect(pages):
    edges = {}
    invalid = []
    unresolved = Counter()
    endings = set()
    for page, row in enumerate(pages):
        items = row["items"]
        for index, item in enumerate(items):
            site = page, index
            after = (page, index + 1)
            edges[site] = [after]
            if item["kind"] != "command":
                continue
            if item["opcode"] == 6:
                endings.add(site)
                edges[site] = []
            if item["opcode"] != 4:
                continue
            data = bytes.fromhex(item["args"])
            mode, count = divmod(data[0], 16)
            targets = []
            if mode in (0, 8):
                targets = [choice["target"] for choice in items[index+1:index+1+count]]
            elif mode in (1, 9):
                offsets = [5 + 6 * n for n in range(count)]
                if mode == 9:
                    offsets.append(1 + 6 * count)
                targets = [int.from_bytes(data[i:i+2], "big") for i in offsets]
            elif mode in (2, 3, 5):
                offset = {2: 1, 3: 3, 5: 2}[mode]
                targets = [int.from_bytes(data[offset:offset+2], "big")]
            else:
                unresolved[data[0]] += 1
            edges[site] = [after] if mode not in (0, 2, 8, 9) else []
            for target in targets:
                if 0 <= target < len(pages):
                    edges[site].append((target, 0))
                else:
                    invalid.append([page, index, target])
        edges[page, len(items)] = [(page+1, 0)] if page+1 < len(pages) else []
    todo = [(0, 0)]
    reached = set()
    while todo:
        site = todo.pop()
        if site not in reached:
            reached.add(site)
            todo.extend(edges[site])
    return {"pages": len(pages), "unreachableFromPageZero": sorted(set(range(len(pages))) - {p for p, _ in reached}),
            "endingSites": len(endings), "endingSitesReached": len(endings & reached),
            "invalidTargets": invalid, "unknownBranchModes": dict(unresolved)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scripts", type=Path)
    args = parser.parse_args()
    print(json.dumps({p.stem: inspect(json.loads(p.read_text(encoding="utf-8")))
                      for p in sorted(args.scripts.glob("S*.json"))}, indent=2))
