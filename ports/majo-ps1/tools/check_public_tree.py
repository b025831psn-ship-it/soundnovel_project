#!/usr/bin/env python3
"""Reject private Majo PS1 data anywhere in the public branch history."""

import subprocess
from pathlib import PurePosixPath


FORBIDDEN_SUFFIXES = {".bin", ".cue", ".iso", ".str", ".vab", ".va", ".kf1", ".mcr", ".ttf", ".otf"}
FORBIDDEN_NAMES = {"slps_018.63", "scrp.d", "system.cnf"}
FORBIDDEN_PARTS = {"port-data", "private", "script.ko.json", "script.ja.json", "uncovered.json"}
MAX_BLOB = 1024 * 1024


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args])


def main():
    failures = []
    objects = git("rev-list", "--objects", "HEAD").decode("utf-8", "surrogateescape").splitlines()
    seen = set()
    for item in objects:
        oid, separator, path_text = item.partition(" ")
        if not separator or not path_text.startswith("ports/majo-ps1/"):
            continue
        path = PurePosixPath(path_text)
        key = (oid, path_text)
        if key in seen:
            continue
        seen.add(key)
        lower_parts = {part.lower() for part in path.parts}
        if path.suffix.lower() in FORBIDDEN_SUFFIXES or path.name.lower() in FORBIDDEN_NAMES or lower_parts & FORBIDDEN_PARTS:
            failures.append(f"forbidden private-data path: {path_text}")
            continue
        kind = git("cat-file", "-t", oid).decode().strip()
        if kind == "blob" and int(git("cat-file", "-s", oid)) > MAX_BLOB:
            failures.append(f"unexpected >1 MiB public blob: {path_text}")
    if failures:
        raise SystemExit("\n".join(sorted(set(failures))))
    print(f"public history clean: {len(seen)} Majo PS1 path/blob records checked")


if __name__ == "__main__":
    main()
