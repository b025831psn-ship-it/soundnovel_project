# Kamaitachi PS1 analysis tools

This directory contains only clean-room tooling and synthetic tests. Do not
commit a game disc, BIOS, save, trace, extracted executable, media, text, or
other copyrighted game data here.

## First-pass inventory

Run the inventory against a locally owned CUE sheet:

```sh
python3 ports/kamaitachi-psx/tools/psx_disc.py inventory /private/path/game.cue \
  --output /private/path/disc-inventory.json
```

The JSON records every referenced file's size and SHA-256, track mode, sector
size, index position, file-relative LBA, disc LBA, and byte offset. For a data
track it also reports the raw-sector layout, ISO9660 volume metadata, root file
records, and the `SYSTEM.CNF` boot target when those structures are present.
If the boot target is a PS-X EXE, only its header fields are recorded.

Keep the output private until it has been reviewed for original filenames and
other extracted metadata. The public test suite uses generated sectors only:

```sh
python3 -m unittest discover -s ports/kamaitachi-psx/tests -v
```

## Trace boundary

The first vertical slice is boot/new-game entry through the first input and
choice. Native emulator probes and the future JS VM should compare ordered
events using stable fields: CPU PC/opcode and writes, CD LBA reads, GP0/GP1
commands and VRAM/CLUT transfers, SPU register/DMA activity, XA/STR sectors,
VBlank, and controller samples. No inferred screen recreation is accepted as
evidence of parity.
