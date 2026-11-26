# libsnd oracle (verification only)

`mips.js` is a small R3000A interpreter. `libsnd-oracle.mjs` loads the user's own
`SLPS_017.94` at run time and runs the game's original libsnd/libspu routines on it,
with SPU registers and DMA4 wired to `sound/spu.js`. It exposes the same `ss` interface
that `sound/module.js` calls, so the module can drive the original library code and the
JS libsnd port alike, and their SPU register logs can be compared write by write.

Nothing here ships with the web player and no EXE bytes are committed. Outputs (WAV,
`*.spu.json` register logs) stay local.

Stubs: the module's VSync advances one 735-sample frame; BIOS B(08) OpenEvent returns a
handle and B(0B) TestEvent returns 1 (DMA completes at once); other BIOS calls return 0.
Interrupts and the CD are not modelled.

    node tools/oracle/render-song.mjs <dir> <song> [seconds] [out.wav]
    node tools/oracle/run-all-oracle.mjs <dir> [seconds]

First full run (30 s per item): 73/73 songs audible, 301 effects run without error
(298 audible; 208, 213 and 1091 stay silent alone; 76 loop until the scenario ends them).

## Whole-game ground truth (`game-boot.mjs`)

Boots `SLPS_017.94` from its entry point (0x800622d8) with `gpu-oracle.mjs` (GPU model,
DMA2/DMA6) and the SPU model, and runs the game's own code headlessly. Only library services
are replaced: libcd reads are served from the PAC files at their disc extents, libetc VSync
is one frame (the VSync callback runs, then the libpad buffer at 0x801d6660 gets a digital
pad report), the memory card sync 0x80063748 reports "no card", and the STR movie player
0x800343b0 is skipped. Title, memory card screens, the opening owl and the story text with
pictures and silhouettes all come out of the original code, so screen ports can be compared
against these frames and GP0 streams. About 50 frames of story per second of run time.

    node tools/oracle/game-boot.mjs <dir with SLPS_017.94 and *.PAC> --out <local dir> \
      --every 25 --steps 300000000 --pads '[[300,"circle"],[600,"circle"],[720,"down"],[780,"circle"]]'

The pad script above starts a game without a memory card. Frames are the game's pictures:
keep them local.

## Screen ports against the original (`compare-screen.mjs`)

Runs the game twice with the same pad script, once original and once with the JS ports
hooked in at their addresses, and compares every GP0/GP1 word per frame, the picture every
10 frames and all RAM below the stack at the end.

    node tools/oracle/compare-screen.mjs <dir> 1500 [--ports glyph]

`glyph` (`src/text/glyph.js`, 0x800380ec with 0x80037fac): 13,493 calls over the title,
memory card screens, opening and first story pages, 0 differences.

`text` (`src/text/text.js`, 0x80039288 with 0x80037604): 11,018 calls over 12,000 frames
(title to the evening at the pension, pages turned every 45 frames), 0 differences.
