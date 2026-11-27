# Reset lockstep and framebuffer validation

This follows soundnovel_project PR #24 comment 7160835810.

## Reset through NMI 3

The native and VM probes record `master, PC, opcode, A/X/Y/S/D/DBR/P` for every
instruction.  The first genuine timing difference was opcode `$BE` (`LDX
abs,Y`) at master 2,912,344: the VM selected X instead of Y for the page-cross
test and charged an extra six masters.  Moving `$BE` to the absolute-Y timing
class makes all 655,705 common reset-through-NMI-3 instruction records agree
in master, PC, and opcode.

Snapshots now use one definition on both sides: after the NMI stack writes and
immediately before the vector fetch.  With recorded input, WRAM, VRAM, OAM,
APUIO digests/count, and NMI PC agree for NMI 1 through 120.  The next WRAM/PC
difference begins at NMI 121.  A longer lockstep trace places its first master
difference in frame 165/NMI 120 at master 58,965,414, in the raster-event
region; scanline HDMA/refresh timing remains the next CPU task.

## Framebuffer contract

`SfcMachine.onFrame(frame, framebuffer)` now receives a 256×224
`Uint8ClampedArray` in RGBA order.  The compositor reads live PPU state and
implements tiled BG modes 0–6, BG scroll/tilemap/flip/palette/priority, OBJ,
main-screen window masks, INIDISP brightness/forced blank, and fixed-color
add/subtract/half color math.  Unchanged PPU state reuses the previous frame.

Native RGB output is normalized to the same RGBA format before FNV-1a hashing.
The two outputs agree while both are forced blank (NMI 1–18), then first differ
at NMI 19.  Mode 7 and scanline-accurate HDMA/window/subscreen color math are
not complete, so the framebuffer hash result is a failure inventory rather
than a pixel-accuracy claim.

The recorded-input 5,700-NMI framebuffer run has 5,593 mismatches in four
intervals.  The corrected 20,000-NMI state-only rerun completes without an
exception; its remaining mismatch counts are WRAM 19,881 (one interval, first
NMI 121), VRAM 19,473 (two), CGRAM 241 (27), OAM 22 (20), NMI PC 3,005 (460),
raw APUIO 19,839 (one), and semantic APUIO 19,416 (16).
