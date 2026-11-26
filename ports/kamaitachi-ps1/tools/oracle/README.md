# libsnd oracle (verification only)

`mips.js` is a small R3000A interpreter. `libsnd-oracle.mjs` loads the user's own
`SLPS_017.94` at run time and runs the game's original libsnd/libspu routines on it,
with SPU registers and DMA4 wired to `sound/spu.js`. It exposes the same `ss` interface
that `sound/module.js` calls, so the module can drive the original library code and the
JS libsnd port alike, and their SPU register logs can be compared write by write.

Nothing here ships with the web player and no EXE bytes are committed. Outputs (WAV,
`*.spu.json` register logs) stay local.

Stubs: VSync (0x80060ff8) advances one 735-sample frame; BIOS B(08) OpenEvent returns a
handle and B(0B) TestEvent returns 1 (DMA completes at once); other BIOS calls return 0.
Interrupts and the CD are not modelled.

    node tools/oracle/render-song.mjs <dir> <song> [seconds] [out.wav]
    node tools/oracle/run-all-oracle.mjs <dir> [seconds]

First full run (30 s per item): 73/73 songs audible, 301 effects run without error
(298 audible; 208, 213 and 1091 stay silent alone; 76 loop until the scenario ends them).
