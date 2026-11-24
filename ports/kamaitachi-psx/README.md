# Kamaitachi PS1 analysis tools

This directory contains only clean-room tooling and synthetic tests. Do not
commit a game disc, BIOS, save, trace, extracted executable, media, text, or
other copyrighted game data here.

These tools are build-time analysis and parity aids only. The shipped web
player must consume converted, game-specific manifests and web assets; it must
not mount, fetch, or ask the player for a BIN/CUE, ISO, BIOS, or PS-X EXE.
`src/r3000a.js` is therefore not a production dependency of the standalone
player in `web-player/`.

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
logic. Device and instruction coverage is added only when a native trace
reaches it; CD, SPU, and GTE command execution are not implemented yet.

`src/devices.js` supplies the interrupt controller, root counters, GPU command
ports, and DMA registers reached by the current probes. GPU channel-2 block and
linked-list transfers are expanded from emulated RAM into the same GP0 stream
as direct MMIO writes.

## Trace comparison

`src/trace.js` converts CPU instruction events to a stable JSON Lines format and
finds the first divergence between a native-emulator probe and the JavaScript
runtime. Trace files may contain addresses and opcodes, but game data and
extracted assets must remain outside this repository.

`tools/mips_refs.py EXE 0xADDRESS` reports direct jumps/calls, address
materializations, and pointer-table entries that refer to a virtual address in
a PS-X EXE. It emits addresses only and never copies executable payloads.
`--table COUNT` instead inventories a virtual-addressed `u32` jump table.

`tools/pac_index.py FILE.PAC --records ID` additionally inventories a member's
nested little-endian `u16` record table. Output contains offsets and sizes only.

`tools/psx_vram.py` converts an already extracted, tightly packed PS1 VRAM
rectangle into an RGBA PNG. It supports 4bpp and 8bpp CLUT textures plus direct
16bpp BGR555/STP pixels. This is a build-time converter: the web player consumes
its PNG output and never reads VRAM dumps or disc images at runtime.

```sh
python3 ports/kamaitachi-psx/tools/psx_vram.py texture.bin texture.png \
  --width 320 --height 240 --bpp 8 --clut palette.bin
```

`tools/gp0_vram.py` reconstructs the 1024x512 BGR555 VRAM state from JSONL GP0
words. It frames drawing packets so coordinate or color payloads cannot be
mistaken for transfer commands, and applies fill, CPU-to-VRAM upload, and
overlap-safe VRAM copy packets. Its optional manifest lists upload rectangles
without copying their pixels.

`tools/gpu_trace_proxy.c` is a PSEmu-compatible GPU proxy for private native
probes. Build it with `gcc -shared -fPIC gpu_trace_proxy.c -ldl -o proxy.so`,
then set `PSX_GPU_REAL` to the original GPU plugin and `PSX_GPU_TRACE` to a
private output path. It records direct GP0/GP1 writes, linked-list payloads,
and frame boundaries while forwarding the original calls unchanged. Never
commit its trace output.

Static control-flow findings and their current confidence boundary are tracked
in `ANALYSIS.md`.
