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
at NMI 19.  The compositor now includes Mode 7, separate main/sub screens,
CGWSEL clipping and math prevention, CGADSUB add/subtract/half, and both-window
OR/AND/XOR/XNOR logic.  Rendering still consumes the register state at the
frame boundary; scanline HDMA register history and exact per-mode priority are
not complete, so the framebuffer hash result remains a failure inventory
rather than a pixel-accuracy claim.

The recorded-input 5,700-NMI framebuffer run has 5,593 mismatches in four
intervals.  The corrected 20,000-NMI state-only rerun completes without an
exception; its remaining mismatch counts are WRAM 19,881 (one interval, first
NMI 121), VRAM 19,473 (two), CGRAM 241 (27), OAM 22 (20), NMI PC 3,005 (460),
raw APUIO 19,839 (one), and semantic APUIO 19,416 (16).

After adding the full main/sub colour path, the recorded-input rerun still has
5,593 framebuffer mismatches in the same intervals (19–329, 371–502, 514–591,
629–5700).  This shows that the name-confirmation colour defect is no longer a
missing CGWSEL/CGADSUB code path, but hash equality is still blocked by the
frame-boundary renderer and the state divergence beginning at NMI 121.  No
claim of native name-screen hash equality is made yet.

## Scanline/HDMA scheduler

The bundle-3 scheduler initializes HDMA at H=20 and transfers active channels
at H=1106.  It implements direct and indirect tables, repeat/line counters,
all eight transfer patterns, and charges the CPU sync, byte, and descriptor
bus cycles.  Visible lines are now composited at H=512 from the live PPU state,
so HDMA writes to CGRAM, VRAM, scroll, windows, and colour-math registers affect
the following lines instead of being collapsed into one end-of-frame state.
H/V timer IRQ positions are scheduled from $4200/$4207-$420A and TIMEUP is
latched through $4211.

This removes both requested early state failures: WRAM agrees through NMI 166
(formerly 120), and semantic APUIO agrees through NMI 408 (formerly 162).  The
remaining state intervals in the 5,700-NMI replay are WRAM 167-168, 176, and
370-5700; semantic APUIO 409-515 and 589-5700.

Framebuffer equality is not complete.  There are 5,597 differing NMI hashes
in intervals 19-330, 346, 349, 371-502, 514-592, and 629-5700.  The requested
name-confirmation sample at frame 2108 / NMI 2063 is native
`26f9cb4bd06b9a94` versus VM `ab35ef4184a13f70`.  The intervals before NMI 370
are renderer priority/raster-phase differences; the long interval from NMI
371 also includes the persistent WRAM/VRAM/CGRAM state divergence beginning at
NMI 370.  These are recorded as remaining causes, not as a pixel-match claim.

The mode-1 BG3 palette correction uses CGRAM palette 0 as the 2bpp base;
mode-0 alone applies the per-BG 32-colour offset.  This restores the observed
white, blue, and pink name-screen text.  Mode-1 priority ordering now also
interleaves BG1/BG2/BG3 high/low pixels with OBJ priorities and honours the
BG3-priority bit.  The hash inventory remains 5,597 because every affected
frame still contains at least one differing pixel.  At frame 2108 / NMI 2063
the corrected VM hash is `a43e52e06ee5bd17`; native remains
`26f9cb4bd06b9a94`.

An extended native/VM instruction trace through physical frame 415 shows the
NMI-370 state split is an event-boundary problem, not a CPU opcode/value split:
the instruction streams agree immediately beforehand, then the first handler
opcode is timestamped at master 148,256,514 native versus 148,256,512 VM.  That
two-master NMI/HDMA phase difference changes the interrupted loop position and
propagates into WRAM.  It remains open rather than being hidden with a
frame-number timing constant.

## Bus-cycle preemption and pixel inventory

Raster events are now selected inside `Cpu65816.advanceMaster()`, alongside
WRAM refresh, so an HDMA/IRQ/NMI boundary crossed by an individual bus cycle is
processed before that cycle completes.  The apparent NMI-370 event error also
exposed a narrower timing bug: the indirect-opcode I/O adjustment inspected
only the final 16-bit word and mistook `$7E:2000` for bank-zero PPU I/O.  Requiring
bank zero removes the extra four masters.  The first NMI-handler opcode at NMI
370 is now master 148,256,514 on both native and VM without a frame constant.

The old native recorded-input probe had two replay errors: it used the next NMI
count at libretro poll time and treated SNES joypad bits as libretro button IDs.
With current-NMI polling and the explicit B/Y/Select/Start/d-pad/A/X/L/R map,
the corrected 5,700-NMI comparison has these remaining state intervals:

- WRAM: NMI 501 only, then 676-5700;
- semantic APUIO: 2222-5700;
- VRAM: 1310, 1312-2576, and 2578-5700;
- CGRAM: the pre-existing power-on rows 1-2, then 3476-5700;
- OAM: 4876-5495.

Instruction lockstep identifies the NMI-501 transient as controller-history
phase after the consecutive A samples: at master 194,725,932 `$00:85A4 LDA`
loads native `$0080` versus VM `$0000` from the input history table.  The value
reconverges, but its later scheduler consequence begins at NMI 676 and reaches
semantic APUIO at NMI 2222.  This is an auto-joypad/input-poll phase issue, not
an unidentified CPU opcode.

`tools/pixel-diff.mjs` compares normalized RGBA streams and records the exact
different-pixel count and bounding box for every NMI.  Against the corrected
native input run, 5,258 of 5,700 frames differ.  Early differences are small
(NMI 19: 13 pixels, box 124,84-131,91), while the largest frames differ over
all 57,344 pixels.  The name-confirmation sample at NMI 2063 differs in 56,319
pixels with a full-screen bounding box; native hash is `4c919743e0e06cb3`
and VM is `a43e52e06ee5bd17`.  The per-frame inventory is stored with the private
trace data rather than reducing this result to hash equality alone.
