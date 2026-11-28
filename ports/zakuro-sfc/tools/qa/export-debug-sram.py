"""Export the battery from a completed native completion_campaign.py replay."""
import argparse
import ctypes
from hashlib import sha256
import json
from pathlib import Path
import sys
import zlib


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ("private_repo", "rom", "core", "report", "checkpoint", "output"):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    sys.path.insert(0, str(args.private_repo / "tools"))
    from completion_campaign import Emulator, progress

    reference = json.loads((args.private_repo / "routes/completion.json").read_text())
    replay = json.loads(args.report.read_text())
    packed = args.checkpoint.read_bytes()
    if not (replay["complete"] and replay["plays"] == reference["plays"]
            and replay["stored_ids"] == reference["stored_ids"]
            and sha256(args.rom.read_bytes()).hexdigest() == replay["rom_sha256"] == reference["rom_sha256"]
            and sha256(args.core.read_bytes()).hexdigest() == replay["core_sha256"]
            and sha256(packed).hexdigest() == replay["checkpoint_sha256"]):
        raise ValueError("Replay or checkpoint differs from the native completion record")
    with Emulator(args.core, args.rom) as game:
        game.restore(zlib.decompress(packed))
        flags, ids, score = progress(game)
        if score != 100 or sorted(ids) != reference["stored_ids"] or flags.hex() != replay["plays"][-1]["flags"]:
            raise ValueError("Restored slot differs from the verified replay")
        size = game.lib.retro_get_memory_size(0)  # RETRO_MEMORY_SAVE_RAM
        ptr = game.lib.retro_get_memory_data(0)
        if size != 8192 or not ptr:
            raise ValueError("Unexpected cartridge SRAM")
        sram = ctypes.string_at(ptr, size)
    with args.output.open("xb") as file:
        file.write(sram)


if __name__ == "__main__":
    main()
