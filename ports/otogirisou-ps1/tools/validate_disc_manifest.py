#!/usr/bin/env python3
"""Validate a private PS1 disc manifest without reading source media."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
ROLES = {"cue", "track-data", "track-audio"}
DISC_KEYS = ("volumeId", "bootPath", "productCode")


def validate(value: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(value, dict):
        return ["root: expected an object"]
    if value.get("schemaVersion") != 1:
        errors.append("schemaVersion: expected 1")
    if value.get("media") != "ps1-cue-bin":
        errors.append("media: expected 'ps1-cue-bin'")

    files = value.get("files")
    if not isinstance(files, list) or not files:
        errors.append("files: expected a non-empty array")
    else:
        cue_count = 0
        for index, item in enumerate(files):
            prefix = f"files[{index}]"
            if not isinstance(item, dict):
                errors.append(f"{prefix}: expected an object")
                continue
            role = item.get("role")
            if role not in ROLES:
                errors.append(f"{prefix}.role: unsupported role")
            if role == "cue":
                cue_count += 1
            size = item.get("size")
            if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
                errors.append(f"{prefix}.size: expected a positive integer")
            digest = item.get("sha256")
            if not isinstance(digest, str) or not SHA256_RE.fullmatch(digest):
                errors.append(f"{prefix}.sha256: expected 64 lowercase hex characters")
            unexpected = sorted(set(item) - {"role", "size", "sha256"})
            if unexpected:
                errors.append(f"{prefix}: unexpected keys: {', '.join(unexpected)}")
        if cue_count != 1:
            errors.append("files: expected exactly one cue entry")

    disc = value.get("disc")
    if not isinstance(disc, dict):
        errors.append("disc: expected an object")
    else:
        for key in DISC_KEYS:
            field = disc.get(key)
            if field is not None and (not isinstance(field, str) or not field.strip()):
                errors.append(f"disc.{key}: expected null or a non-empty string")
        unexpected = sorted(set(disc) - set(DISC_KEYS))
        if unexpected:
            errors.append(f"disc: unexpected keys: {', '.join(unexpected)}")
    return errors


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(f"usage: {Path(argv[0]).name} MANIFEST.json", file=sys.stderr)
        return 2
    try:
        value = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(f"manifest: {exc}", file=sys.stderr)
        return 2
    errors = validate(value)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    print("disc manifest is valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
