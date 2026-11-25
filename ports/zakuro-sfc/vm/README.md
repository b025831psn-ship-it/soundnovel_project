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
includes the 176-cycle reset sequencer, 6/8/12-cycle bus regions, 40-cycle DRAM
refresh steals, alternating 357368/357364-cycle PPU fields, the three-scanline
HVBJOY auto-read window, and exact 18 + 8/channel + 8/byte `$420B` DMA CPU
halts. The four power-on APUIO writes have zero cycle error. Against private
trace commit e286471, 21 APUIO rows match before IPL port 0 changes to `cc`
357,374 master cycles (one field) early. DMA event sizes and most event phases
now agree within tens of master cycles, isolating the remaining error to one
missing frame-state transition before the upload. The comparator intentionally
fails at the first semantic mismatch so timing cannot be hidden by
resynchronizing the trace.

The CPU core provenance and license are in `THIRD_PARTY_NOTICES.md`.
