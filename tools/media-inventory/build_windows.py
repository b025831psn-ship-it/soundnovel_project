#!/usr/bin/env python3
"""Build the Windows one-file GUI with PyInstaller."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent
    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        "--name",
        "SoundNovelMediaInventory",
        str(root / "gui.py"),
    ]
    return subprocess.call(command, cwd=root)


if __name__ == "__main__":
    raise SystemExit(main())
