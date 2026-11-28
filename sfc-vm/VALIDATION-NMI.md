# NMI-aligned timing and performance validation

This is the follow-up to soundnovel_project PR #24 comment 7160267134.

## Opcode timing

The matrix now compares 7,620 ordinary opcode-to-next boundaries with zero
duration differences (7,680 captured rows minus the 60 WAI/STP rows that need
an external wake event).  The fixes distinguish resolved indirect I/O data
accesses from pointer reads, account for native-stack accesses in the I/O
windows, and correct the synthetic `D6` direct-page wrap case.

The table still does not constitute a native per-bus-access proof.  Snes9x's
reference artifact contains instruction duration, while the VM artifact alone
contains each access timestamp.  HDMA and IRQ do not yet have native/VM table
rows.  DMA setup/per-byte, WRAM refresh, NMI, and `$4202-$4206` delays remain
covered by executable regression tests.

## NMI-aligned execution

`SfcMachine` has a monotonic `nmiCount`.  Joypad input and snapshots are keyed
to this count, and snapshots are taken at NMI entry before interrupt-stack
writes.  The native runner uses the same definition and preserves every NMI in
a ring so multiple entries in one libretro call cannot be dropped.

The recorded-joypad 5,700-NMI comparison is aligned without a guessed offset.
NMI 1 has an identical WRAM hash.  NMI 2 already differs, with native PC
`00:9BA0` and VM PC `00:9B41`; consequently 5,699 of 5,700 WRAM snapshots
differ.  The requested all-NMI WRAM equality is therefore not met.  This
isolates the remaining problem to CPU execution phase between the first two
NMIs rather than frame numbering or joypad timing.

The complete 20,000-NMI automatic-input interval inventory is stored with the
private trace data.

## Performance

The CPU's per-byte JavaScript `Proxy` was replaced by a fixed four-method bus
facade.  On this container, the same 5,700-NMI run changed from 39.353 seconds
to 32.018 seconds (18.6% faster).  Both output files have SHA-256
`7067d582647eedd8e40d127faf98184a73888a5aa9e60884e9c67e9480bc69c9`.
The run represents about 95 seconds of NTSC game time, so the optimized Node
runner remains above the requested 2x real-time rate.
