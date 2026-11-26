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
