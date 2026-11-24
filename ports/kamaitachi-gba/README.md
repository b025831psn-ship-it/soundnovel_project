# Kamaitachi GBA native-bytecode port skeleton

This directory runs decoded scenario-bank bytes, not the JSON novel-player path. It contains no game data. Generate `port-data/` from a legally obtained supported ROM with the private repository's `tools/extract_assets.py`, then serve this directory over HTTP.

Implemented foundations: original-width bank reader, native RAM-shaped state, handler-address traceability, BG tile/palette rendering on a 240×160 canvas, palette groups and deferred `04`, native glyph RLE lookup/decoding, `r p P g o n` text-window state, GBA keyboard input, fixed 60 Hz VBlank loop, and common trace comparison.

## Opcode status

| status | opcodes |
|---|---|
| state/control implemented | `01 02 03 0D 0E 0F 1A 21 22 23 25 40 41 04` |
| width decoded; effect hook pending | `13 56 57 5E` |
| not implemented | every other opcode; VM halts and records the byte in `unimplemented` |

The complete first-choice run and 2,000-instruction equality check remain integration gates: they require a generated local `port-data/`, exact row-27000 entry resolution, remaining opcode effects, and an mGBA trace produced with the same input schedule. `tools/compare-traces.mjs` reports the first 100 differing rows.

Trace columns are: `frame, bank, offset, opcode, argument hex, group(02004606), slot(020006FC), pending(020117C4)`.
