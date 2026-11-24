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
records, `SYSTEM.CNF` boot target, and PS-X EXE load/entry header. Payload
extraction remains private.

Keep the output private until it has been reviewed for original filenames and
other extracted metadata. The public test suite uses generated sectors only:

```sh
python3 -m unittest discover -s ports/kamaitachi-psx/tests -v
```

PAC archives use little-endian `<resource-id, sector-offset>` pairs and an
`<0xffff, total-sectors>` terminator. Inspect an already private/local PAC
without writing member payloads:

```sh
python3 ports/kamaitachi-psx/tools/pac_index.py /private/path/SAMPLE.PAC
```

## Trace boundary

The first vertical slice is boot/new-game entry through the first input and
choice. Native emulator probes and the future JS VM should compare ordered
events using stable fields: CPU PC/opcode and writes, CD LBA reads, GP0/GP1
commands and VRAM/CLUT transfers, SPU register/DMA activity, XA/STR sectors,
VBlank, and controller samples. No inferred screen recreation is accepted as
evidence of parity.

## R3000A execution core

`src/r3000a.js` loads a PS-X EXE directly into 2 MiB RAM and implements the
integer, branch-delay, load/store, and BIOS-hook subset needed to begin tracing
the original entry code. It intentionally has no guessed high-level game
logic. GPU, CD, SPU, COP0, exceptions, and the remaining unaligned/multiply
instructions are added only when a native trace reaches them.
## Trace comparison

`src/trace.js` converts CPU instruction events to a stable JSON Lines format and
finds the first divergence between a native-emulator probe and the JavaScript
runtime. Trace files may contain addresses and opcodes, but game data and
extracted assets must remain outside this repository.
