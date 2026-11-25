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
handshake through scanline-derived HVBJOY/NMI scheduling. With `LINK_TIMING`
and `POWER_ON`, the first 29 APUIO rows match in order and value. The next
mismatch is IPL port 0 still reading `cc` where the reference first reads `00`;
the CPU timeline is 1,433,944 master cycles early at that point. The next
timing work is per-cycle 65C816 bus phasing and
DMA/PPU register timing; the comparator intentionally fails at the first
semantic mismatch so timing cannot be hidden by resynchronizing the trace.

The CPU core provenance and license are in `THIRD_PARTY_NOTICES.md`.
