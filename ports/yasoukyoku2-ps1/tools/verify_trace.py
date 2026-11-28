"""Verify a JSONL trace against an original-disc scenario fingerprint."""
import argparse
import hashlib
import json
from pathlib import Path


def fingerprint(path):
    digest = hashlib.sha256()
    count = 0
    with path.open(encoding="utf-8") as stream:
        for count, line in enumerate(stream, 1):
            row = json.loads(line)
            if row["frame"] != count:
                raise ValueError(f"nonsequential frame at {count}")
            for key in ("video", "audio"):
                if row[key] is None and key == "video":
                    continue
                if len(bytes.fromhex(row[key])) != 32:
                    raise ValueError(f"invalid {key} hash at {count}")
            digest.update(json.dumps(row, sort_keys=True, separators=(",", ":")).encode())
            digest.update(b"\n")
    if not count or "ram" not in row:
        raise ValueError("missing final RAM snapshot")
    return {"frames": count, "sha256": digest.hexdigest()}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scenario", choices=["idle", "buttons"])
    parser.add_argument("trace", type=Path)
    args = parser.parse_args()
    expected = json.loads((Path(__file__).parents[1] / "boot-baseline.json").read_text())
    actual = fingerprint(args.trace)
    if actual != expected[args.scenario]:
        raise SystemExit(f"trace mismatch: {actual}")
    print(f"{args.scenario}: verified {actual['frames']} frames")
