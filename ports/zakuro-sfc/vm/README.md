# Zakuro 65C816 VM

This directory runs the original LoROM program on an integer SNES master clock.
CPU accesses to `$2140-$2143` are routed only through
`sound/master-link.js`, and `apu-trace.js` checks direction, port, value, order,
and maximum absolute master-cycle difference against `apu-ports.tsv`.

```powershell
npm test
npm run vm:check -- "path/to/Zakuro no Aji (Japan).sfc" "path/to/apu-ports.tsv" "private/port-data/sound/ipl.bin"
```

The IPL firmware is private data and is never embedded in this repository.
`check-vm-apu.mjs` injects it into `new APU({ ipl })`, applies `POWER_ON`, and
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
automatic scanline DRAM-refresh injection was removed from the VM wall clock:
the CPU's calibrated instruction totals already account for those elapsed
cycles, so adding another 40 clocks per line caused the critical wait to miss a
field boundary. That change reduces the first-upload error from 357,396 to 236
master cycles and raises the matching prefix from 20 to 23 rows. Explicit
refresh-steal modeling remains available as `new MasterClock(..., { refresh:
true })` for isolated timing tests. The next work is the residual CPU/APUIO
read-loop phasing. The comparator intentionally fails at the first semantic
mismatch so timing cannot be hidden by resynchronizing the trace.

The CPU core provenance and license are in `THIRD_PARTY_NOTICES.md`.
