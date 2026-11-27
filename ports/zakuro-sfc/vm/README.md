# Zakuro 65C816 VM

This directory runs the original LoROM program on an integer SNES master clock.
CPU accesses to `$2140-$2143` are routed only through
`sound/master-link.js`, and `apu-trace.js` checks direction, port, value, order,
and maximum absolute master-cycle difference against `apu-ports.tsv`.

```powershell
npm test
npm run vm:check -- "path/to/Zakuro no Aji (Japan).sfc" "path/to/apu-ports.tsv" "private/port-data/sound/ipl.bin"
```

`vm/browser.js` is the browser-safe entry point; Node-only trace readers stay
behind `vm/index.js`. `sound/zakuro-timing.js` contains the shared timing data.
Both check tools also accept a private `port-data/program/` directory instead
of a ROM. Its manifest lists sparse LoROM ranges and SHA-256 hashes, and
`ProgramImage` rejects every read outside those extracted ranges. Set
`ZAKURO_PROGRAM_OUT` while running `vm-full-run.mjs` with an owned ROM to
regenerate that private data from the addresses the VM actually reads.
`tools/build-full-program-data.mjs` creates the private complete-image variant
as 64 KiB SHA-checked ranges. The sparse image remains useful for detecting
unexpected reads, while the complete image is required for arbitrary branches.

The IPL firmware is private data and is never embedded in this repository.
`check-vm-apu.mjs` injects it into `new APU({ ipl })`, applies `POWER_ON`, and
loads `sound/boot-dsp.bin` as the power-on DSP register image, then
constructs `new MasterLink(apu, LINK_TIMING)`. Without an IPL argument it uses
the high-level `APU.boot(readBootRecords(rom), APU_TIMING)` fallback.

Current bring-up status (2026-11-25): the real cartridge reaches the SPC IPL
handshake through scanline-derived HVBJOY/NMI scheduling. The master clock now
includes the 176-cycle reset sequencer, 6/8/12-cycle bus regions, alternating
357368/357364-cycle PPU fields, the three-scanline
HVBJOY auto-read window, and exact 18 + 8/channel + 8/byte `$420B` DMA CPU
halts. DMA now also performs mode-specific B-bus transfers and implements the
`$2180-$2183` WRAM data/address ports. This fixes the missing 5,006-byte
ROM-to-WRAM boot transfer: the post-DMA path now executes the same instruction
count as the native trace instead of skipping about 15,600 instructions. The
native/VM instruction tracing over 190,649 matching instructions showed that
the remaining apparent refresh conflict was actually a store-cycle bug: most
STA/STX/STY/STZ modes added their documented total on top of the common opcode
fetch cycle. Correcting that one-cycle overcharge removes 60,088 master clocks
in the critical interval while keeping the hardware's 40-clock-per-scanline
DRAM refresh enabled. Refresh timing now follows the real PPU scanline grid:
H=538/H=534 alternate, odd-field V=240 is 1360 clocks, and that short line does
not toggle the refresh phase. Against private trace commit e286471, the matching
APUIO prefix is now 66,425 rows; the greeting and initial upload begin with zero
cycle error. The one-field mismatch at row 24,614 came from observable power-on
WRAM: the native reference fills untouched WRAM with `$55`, while a fresh
`Uint8Array` had supplied `$00`. Zakuro reads the never-written `$01EC` byte in
its first enabled NMI and branches on it. Matching the native WRAM pattern gets
past that transition; the next mismatch is row 66,426 at 112,960,322 master
cycles, with a 40-cycle current delta and 80-cycle maximum. Optional
`ZAKURO_VM_STATE_TRACE`, `ZAKURO_VM_NMI_TRACE`, `ZAKURO_VM_KEEP_RUNNING`, and
`ZAKURO_VM_STOP_MASTER` settings let the checker capture state across a mismatch.
The comparator still fails at the first semantic mismatch by default so timing
cannot be hidden by resynchronizing the trace. A field-by-field NMI comparison
then exposed a two-master-clock interrupt-entry shortfall: the native CPU's
first interrupt I/O cycle is an 8-master opcode fetch plus a 6-master internal
cycle, while the VM's integer CPU-cycle accounting had supplied only 12 master
clocks. NMI/IRQ now enter at a separately scheduled opcode boundary (VBlank
boundary +6, NMITIMEN edge +6) and carry the remaining two master clocks. This gets
past row 66,428. Odd-field V=240 now uses the inverted refresh phase without
changing the phase carried into V=241. The remaining frame-403 shift was a
false NMITIMEN enable-edge NMI: the VM honored a stale RDNMI flag during the
visible region, whereas the hardware permits that immediate trigger only while
VBlank is active. Adding the VBlank condition removes that extra interrupt.

The private `port-data/trace/input.tsv` contains all 3,713 native controller
frames through the first choice. `readInputTrace()` feeds each VBlank sample to
the `$4218/$4219` auto-joypad registers and the `$4016/$4017` serial interface.
The browser may call `vm.setJoypad(mask)` to override `input.tsv` once at the
next auto-joypad sample; later fields return to recorded input unless another
mask is queued. Choice-mode WRAM uses `$007F` as the active flag, `$0081` as the
cursor, `$0082` as the last option index, and `$0083/$0085/$0087/$0089` as the
four target block IDs. Save/load uses selected slot `$0348` (0-2); exact menu
row hit boxes still need PPU/text-row observation. `vm.getTouchState()` exposes
the proven choice state and full-width touch rectangles. Power-on `$55` is
ignored until the game writes `$007F`; `choice.ready` remains false and its
rectangles stay empty while zero/unwritten targets are still being built. The initial rectangle
derivation comes from the native 256x224 first-choice capture: y=20+48*n,
height=48. Non-choice screens currently report `text`; menu and bookmark/save
must not be inferred from that value until their native WRAM flags are traced.
Startup validation walks `$0348` through 0, 1, 2, and 0 without displaying a
save screen, so `saveSlot` deliberately remains null.
`vm.exportSram()` and `vm.importSram()` move the complete 8 KiB battery image.
Browser persistence can pass `onSramWrite` to the VM constructor and debounce
storage writes using the callback's monotonically increasing `revision`, or
poll `vm.bus.consumeSramDirty()`. The game continues to own its three native
save slots inside that opaque image.
With that input, `tools/vm-full-run.mjs` reaches the end without a stop or CPU
error and finds all 252,918 reference CPU writes. The former extra idle-clear
triplets at reference frames 422, 760, and 1798 are gone, and the write sequence
has no unmatched reference rows or drift sections. The frame-784 main-thread
split was an unmapped LoROM SRAM read at `$70:0000`: native SRAM powers on as
`$60`, while the VM had returned zero. The VM now derives SRAM size from the
cartridge header, maps LoROM SRAM banks, and uses the same `$60` power-on fill.
The former row-947,770 value mismatch is gone; all 1,253,625 APUIO rows now
match in order and value. Exact master timing has one remaining six-access
section at frame 422 (rows 523,881-523,886, delta -42) where DRAM refresh and
NMI entry meet, then returns to zero.
Internal IO clocks for the measured native-mode absolute-indexed,
direct-page-indexed, direct-page-low-byte penalty, and stack-relative modes are
charged immediately before their documented bus access instead of being
collected at the end of the instruction. ROM-free `ProgramImage` manifests also
carry explicit SRAM size/fill metadata, so the browser and owned-ROM paths
produce the same complete APUIO result.
All legacy `[WP]` and `[STUCK]` diagnostics are disabled unless
`globalThis.ZAKURO_VM_DEBUG` is explicitly enabled, so they no longer print or
perform timing-visible watchpoint reads in normal runs.

Screen-output bring-up is separate from the timing-complete CPU/APU path.
`PPU` receives `$2100-$213F` and DMA B-bus accesses, maintains VRAM, CGRAM,
OAM, scroll, and color state, and presents a 256x224 RGBA frame per field. The
compositor covers tiled BG modes, sprites, windows, brightness, fixed/subscreen
color math, and mode 7; the native Zakuro replay through the first choice uses
only BGMODE 1. `tools/check-vm-ppu.mjs` converts frames back to the reference
core's little-endian RGB565 stream and searches for the four private hashes.
The first end-to-end run reached choice-ready at field 3502 and rendered the
expected scene, but none of the four hashes matched yet. The current choice and
branch hashes are `e57338a2387b3f6ffcc93f81c490f5da1280140e7eabc8829db14414f1e88d8f`
and `15419ff10fc4099c378b132c2e8e63047192d59bc6da1467fbc6d2f30e272339`.
The verifier intentionally exits nonzero until priority/palette timing becomes
bit-exact; the audio/APUIO result does not imply PPU correctness.
Mode 1 uses epoch-invalidated decoded-tile, BG-layer, and sprite caches plus
32-bit RGBA writes. `tools/bench-ppu.mjs` measures a real replay snapshot; on
the reference development machine field 2000 measured 2.30 ms and the heavier
first-choice field 3520 measured 1.53 ms after warm-up. Set `vm.skipRender=true`
while catching up to advance PPU state and field numbering without composing a
frame that the player will discard.

The native page-wait dispatcher maps A/L to next page and B to the yellow
previous-page view. X, Y, Start, Select, and R are ignored there; there is no
save/quit/title menu button or stable menu-active WRAM flag in that loop.

The CPU core provenance and license are in `THIRD_PARTY_NOTICES.md`.
