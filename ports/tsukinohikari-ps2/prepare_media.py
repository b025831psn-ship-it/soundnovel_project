"""Prepare private runtime inputs from the original Japanese disc."""
import argparse
from pathlib import Path
from disc import inventory, extent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("disc", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    with args.disc.open("rb") as disc:
        for name, sector, size in inventory(disc):
            if not name.endswith((".CFP", ".PAK", ".PSS", ".WAV", ".SP", ".BP")):
                continue
            target = args.output / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(extent(disc, sector, size))


if __name__ == "__main__":
    main()
