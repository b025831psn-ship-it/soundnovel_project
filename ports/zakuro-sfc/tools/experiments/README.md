# VM timing experiments (evidence only)

`io-placement-nmi6.diff` applies to Codex's VM branch at 2dd8594 (`ports/zakuro-sfc/vm/bus.js`, `vm.js`).
It is a scratch experiment, not the intended structure.

- `planIo()` peeks the opcode before `cpu.step()` and returns `{ index, master }`.
  `index` is the access number in the instruction (opcode fetch = 0) before which `master` IO clocks are charged.
  The end-of-instruction idle is reduced by the same amount.
  - abs,X / abs,Y writes and RMW: index 3, 6 clocks.
  - abs,X / abs,Y reads: index 3, 6 clocks, only when X is 16-bit or the page crosses.
  - dp,X / dp,Y: index 2, 6 clocks (+6 more when DL ≠ 0).
  - dp, (dp), (dp),Y, [dp], [dp],Y with DL ≠ 0: index 2, 6 clocks.
  - sr,S: index 2, 6 clocks.
  - Native mode only. Not yet covered: the RMW modify IO, the (dp),Y index IO, (dp,X), stack and branch IO.
- `NMI_POS` (default 12) sets the VBlank NMI trigger offset; the measurements used `NMI_POS=6`.

`nmi-phase.mjs <vm ports/zakuro-sfc> <rom> <apu-ports.tsv> <ipl.bin> [stopRow] [fromFrame]` prints, for each frame,
the VM NMI entry offset from VBlank, the interrupted PC, and the delta of the first NMI-routine APUIO row against the reference.
