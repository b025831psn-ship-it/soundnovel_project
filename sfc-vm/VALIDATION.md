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
