#!/usr/bin/env python3
"""Compare deterministic original-disc traces at named QA checkpoints."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


HASH_KEYS = ("geometry", "video", "audio", "state", "ram")


def load_trace(path: Path) -> dict[int, dict]:
    frames = {}
    with path.open(encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, 1):
            row = json.loads(line)
            frame = row.get("frame")
            if not isinstance(frame, int) or frame < 1 or frame in frames:
                raise ValueError(f"{path}:{line_number}: invalid or duplicate frame")
            frames[frame] = row
    if not frames:
        raise ValueError(f"{path}: empty trace")
    return frames


def compare(left: dict[int, dict], right: dict[int, dict], checkpoints: list[dict]) -> list[str]:
    failures = []
    for checkpoint in checkpoints:
        frame = checkpoint["frame"]
        name = checkpoint["name"]
        if frame not in left or frame not in right:
            failures.append(f"{name}: missing frame {frame}")
            continue
        for key in HASH_KEYS:
            if key in left[frame] or key in right[frame]:
                if left[frame].get(key) != right[frame].get(key):
                    failures.append(f"{name}: frame {frame} {key} mismatch")
    return failures


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("left", type=Path)
    parser.add_argument("right", type=Path)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    checkpoints = manifest["checkpoints"]
    failures = compare(load_trace(args.left), load_trace(args.right), checkpoints)
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"{len(checkpoints)} checkpoints matched geometry, video, audio and available state hashes")


if __name__ == "__main__":
    main()
