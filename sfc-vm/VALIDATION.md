# SFC VM validation bundle

This records the combined A/B/C run requested in soundnovel_project PR #24
comment 7159428172.  The ROM-derived tables and complete failure lists live in
the private `kamaitachi-sfc-kor` repository under `port-data/trace/`.

## A. Instruction timing matrix

The native Snes9x harness and `tools/timing-matrix.mjs` execute all 256 opcode
bytes in five E/M/X configurations and six address profiles: slow ROM, fast
ROM, 7E WRAM, $2100 I/O, $4200 I/O, and bank crossing.  WAI and STP have no
ordinary next-instruction boundary, so their 60 combinations are recorded but
excluded from the duration comparison.

| item | result |
| --- | ---: |
| rows captured | 7,680 |
| rows compared | 7,620 |
| matching | 7,069 |
| different | 551 |
| $2100 I/O differences | 258 |
| $4200 I/O differences | 288 |
| bank-cross differences | 5 |
| slow ROM / fast ROM / WRAM differences | 0 / 0 / 0 |

The work fills every formerly unimplemented opcode, fixes branch-taken and
page-cross charging, indirect/indexed/RMW internal cycles, and delayed
$4202-$4206 result publication.  The remaining I/O rows are not declared
passing: the synthetic native harness distinguishes operand/pointer accesses
from final PPU/CPU-register accesses, while the VM currently applies one speed
class to both.  The five bank-cross rows are also retained in the failure file.
`compare-timing-matrix.mjs` reproduces the complete list.

The VM table records each bus access as `master:direction:address:value`.  The
native table in this bundle has opcode-to-next duration only; therefore native
per-access timestamp equality remains an explicit incomplete part of A.
DBR and bank wrapping are exercised by the profiles, but DMA/HDMA alignment,
WRAM refresh, IRQ/NMI and math-register timing do not yet have a complete
cross-product reference table.

## B. Long automatic run

Both runners use WRAM fill `$55` and press A for two frames every 90 frames
after frame 300.  They completed 20,000 requested frames without throwing.
The comparator aligns VM frame `native emu_frame + 1`; 19,996 frames overlap.

| signal | mismatching frames | mismatch intervals |
| --- | ---: | ---: |
| WRAM | 19,962 | 3 |
| VRAM | 16,959 | 241 |
| CGRAM | 1,686 | 88 |
| OAM | 779 | 48 |
| NMI PC | 3,792 | 510 |
| raw APUIO digest/count | 19,976 / 19,974 | 1 / 2 |
| semantic APUIO digest | 19,973 | 2 |

At the final row CGRAM, OAM, and NMI PC agree; WRAM, VRAM, and APUIO do not.
The complete intervals, including first and last expected/actual digest, are
in `port-data/trace/long-run/comparison.json`.  This is the requested failure
inventory, not a claim that the long run is lockstep-clean.

## C. `SfcMachine` scheduler extraction

`machine.js` now owns master-clock execution, alternating NMI scheduling,
frame boundaries, joypad latching, and APU synchronization.  The extraction
was checked before the A timing changes against the existing frame-5700 trace:
both files had SHA-256
`55caf761f0a76ad6c7b58bc1373f8bab86f27a50a8225d47b81dd61f3c938d8e`.
The MasterLink stop-point fix from `91dbf2f` is included, with a regression test
that prevents `sync()` from running beyond a port-rule boundary.

## Reproduction

```sh
node --test sfc-vm/tests/*.test.mjs
node sfc-vm/tools/timing-matrix.mjs vm.tsv
node sfc-vm/tools/compare-timing-matrix.mjs native.tsv vm.tsv differences.json
node sfc-vm/tools/long-run.mjs ROM.sfc ports/kamaitachi-sfc/sound/apu.js vm-long.tsv 20000
node sfc-vm/tools/compare-long-run.mjs native-long.tsv vm-long.tsv comparison.json
```

## Bundle 5: colour and input phase

Framebuffer comparison now quantizes both captures to SNES BGR555 before
comparison, reports the maximum 5-bit channel delta for every mismatching
frame, and also compares VM NMI `n` with native `n-1`, `n`, and `n+1`.

| alignment | comparable frames | mismatching frames | different pixels |
| --- | ---: | ---: | ---: |
| native `n-1` | 5,699 | 5,250 | 214,886,946 |
| native `n` | 5,700 | 5,258 | 217,799,338 |
| native `n+1` | 5,699 | 5,264 | 219,177,975 |

The aligned frame wins 5,070 of 5,700 per-frame comparisons; `n-1` wins 509
and `n+1` wins 121.  There is therefore no global one-frame framebuffer
offset.  NMI 19 is specifically a capture-boundary case: its aligned 8x8
region has 13 different pixels (maximum BGR delta 14/14/0), while VM NMI 19
equals native NMI 18 exactly.  NMI 100--120 retains the same 58x72 OBJ region,
falling from 631 to 228 different pixels, with up to 31/31/31 channel delta.
It is not removed by either adjacent-frame comparison.  OBJ name-select is now
decoded from the OBSEL gap instead of using a fixed tile-256 base, with a
dedicated regression test; the remaining early region is a renderer defect,
not a frame-wide phase error.

Controller input is now sampled at the physical frame event.  Auto-joypad sets
`$4212` bit 0 for 4,224 master cycles and publishes `$4218-$421f` only when the
read completes.  Replaying the recorded input one physical frame earlier or
later causes PC and semantic APUIO divergence at NMI 408/409; the current
alignment remains clean there.  The first current-alignment WRAM mismatch is a
transient controller-history value at NMI 501, and the persistent interval
starts at NMI 676.  The reference `joypad.tsv` contains completed `$4218/19`
results, whereas libretro polls physical input at `retro_run` entry (and can
poll more than once per NMI).  Thus the NMI 501/676 WRAM difference is a replay
harness sampling-granularity artifact, not a global VM input-frame offset.  A
physical-poll/auto-read-completion trace is required to reproduce that history
byte exactly.

## Bundle 6: completed-frame colour and performance

The framebuffer callback now publishes the completed 224-line image at vblank
instead of publishing just after the first line of the next physical frame.
BG and mode-7 sampling also uses the S-PPU visible-line source row (`y + 1`).
With those two corrections NMI 2063 is bit-exact after BGR555 quantization: the
former 33,235-pixel, 26/26/24-channel difference is zero.  `$2100`, `$2105`,
`$212c-$2133`, enabled HDMA channel descriptors, VRAM, CGRAM, OAM, and scroll
state already matched; half/subtract, fixed colour, windows, and HDMA were not
the cause.

The NMI 100--120 Chunsoft logo region was a BG, not an OBJ.  Seventeen of the
21 frames are now exact.  The only remaining transition frames are NMI 100,
104, 107, and 113 with 406, 256, 165, and 66 pixels respectively; these are
partial-update boundaries rather than a persistent 58x72 decode error.

`tools/performance.mjs` measures the same machine with rendering disabled and
enabled after a JIT warm-up.  On this container, reset through NMI 2108 takes
27,977 ms for 2,153 rendered frames: 12.995 ms/frame or 76.96 fps.  The
CPU/scheduler accounts for 79.03% and rendering for 20.97%.  The speedup keeps
every scanline: OBJ evaluation now decodes only the active line, and unchanged
scanlines reuse the prior exact pixels based on the monotonic PPU revision.

## Bundle 7: NMI 719 and first-choice run

`trace-apu.mjs` now passes the physical frame (the second `SfcMachine` joypad
callback argument) to recorded-input lookup. It had retained the old
single-argument callback after scheduler extraction and was replaying an NMI
number as a frame number. With the corrected callback, native and VM APUIO
semantic streams match for all 213,612 rows through NMI 8,500. In the NMI 719
window, all 30 APUIO accesses within +/-2,000 master clocks match in master,
PC, opcode, direction, port, and value. The 65c816 instruction stream from NMI
718 entry to NMI 719 entry also matches for 13,204 instructions. The reported
NMI 719 difference is therefore not SPC700/MasterLink phase.

The remaining NMI 719 WRAM difference is one byte at `$7f:4e0b` (native `$00`,
VM `$ff`). It is in the `$7f:4000` graphics work buffer and remains until NMI
5,902, after which the hashes converge. It later feeds the VRAM differences
that begin at NMI 5,924. NMI 543 under generated input is a separate boundary:
WRAM `$0391` is cleared by `$00:85b5` immediately before native capture and
immediately after VM capture, and agrees again at the next NMI.

The native auto-read recording was extended through NMI 8,500, where the first
choice is visible (physical frame 8,545). At that boundary NMI PC, OAM, and
semantic APUIO agree throughout; WRAM differs on NMI 719--5,902, VRAM first
differs at NMI 5,924, and the first BGR555 difference remains the known 8x8
capture boundary at NMI 19. At NMI 8,400 the choice image differs by 6,390
pixels, downstream of the graphics-buffer/VRAM difference.

Finally, native and VM write identical INIDISP values on the same physical
frames during the NMI 315--328 fade, after visible rendering (native V=229,
VM raster line 230 under the corrected line convention). Native `n-1` being
pixel-identical is a libretro video-callback/NMI association artifact, not an
INIDISP write-timing error; the VM publication point should not be shifted.

## Bundle 8: absolute-indexed bank carry

Instruction tracing identifies the stale `$7f:4e0b` byte precisely. The VM
first writes `$ff` there at `$02:8628` (`STA long,X`). Native later clears the
word at master 273,353,912 with `$03:84ca` (`STA $4e0c,Y`), `DB=$7e`,
`Y=$fffe`, and `A=$0000`. The indexed addition carries into bank `$7f`; the VM
previously truncated the sum to 16 bits and incorrectly cleared `$7e:4e0a`.
The corrected VM clears `$7f:4e0a` at master 272,639,186. A regression fixture
now covers this exact bank-carry case.

This removes the persistent NMI 719 byte, but does not by itself satisfy the
bundle's long-run completion condition. The rerun still has a WRAM interval at
NMI 1,904--2,309 and the previous VRAM intervals beginning at NMI 5,924; the
choice image at NMI 8,400 still differs by 6,390 BGR555 pixels. The no-input
frame-3,360 capture also retains alternating background rows. These remaining
results show that the stripe/VRAM problem is an additional graphics-transfer
or scanline-rendering defect, not a consequence of `$7f:4e0b` alone.
