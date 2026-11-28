#!/usr/bin/env python3
"""Verify that a private translation checkout matches the public build lock."""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


def git(repo: Path, *args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(repo), *args])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", type=Path)
    parser.add_argument("--lock", type=Path, default=Path(__file__).resolve().parents[1] / "translation.lock.json")
    args = parser.parse_args()
    lock = json.loads(args.lock.read_text(encoding="utf-8"))
    commit = git(args.repo, "rev-parse", lock["commit"]).decode().strip()
    if commit != lock["commit"]:
        raise SystemExit(f"translation commit differs: {commit}")
    for path, expected in lock["files"].items():
        raw = git(args.repo, "show", f"{commit}:{path}")
        actual = hashlib.sha256(raw).hexdigest()
        if actual != expected["sha256"]:
            raise SystemExit(f"{path}: SHA-256 differs")
        if "entries" in expected:
            rows = json.loads(raw)
            identifiers = [row.get("id") for row in rows]
            if len(rows) != expected["entries"] or len(set(identifiers)) != len(rows):
                raise SystemExit(f"{path}: entry count or IDs differ")
            if any(not isinstance(row.get("ko"), str) or not row["ko"] for row in rows):
                raise SystemExit(f"{path}: empty translation")
    print(f"locked translation {commit} verified: {lock['files']['script/ko/script.ko.json']['entries']} entries")


if __name__ == "__main__":
    main()
