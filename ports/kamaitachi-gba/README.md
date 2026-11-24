# Kamaitachi GBA native-bytecode port skeleton

This directory runs native scenario-bank bytes, not the JSON novel-player path. It contains no game data and fetches the versioned `kamaitachi-gba-kor/port-data/` private-submodule output at runtime.

Implemented foundations: original-width bank reader, native RAM-shaped state, handler-address traceability, BG tile/palette rendering on a 240×160 canvas, palette groups and deferred `04`, native glyph RLE lookup/decoding, `r p P g o n` text-window state, GBA keyboard input, fixed 60 Hz VBlank loop, and common trace comparison.

## Opcode status

| status | opcodes |
|---|---|
| state/control implemented | `00 01 02 03 04 0A 0C 0D 0E 0F 13 1A 21 22 23 25 2D 2F 30 31 32 34 40 41 45 53 56 57 5E` |
| width decoded; visual/system effect hook pending | `08 09 0B 15 1C 29 2C 2E 35 37 3E 4D 53 58 5F` |
| not implemented | every other opcode; VM halts and records the byte in `unimplemented` |

The VM resolves entry row 27000 through each bank's native LE16 row table. `tools/trace-scenario.mjs` reaches the first `57` choice after 171 commands with no unimplemented opcode. Opcode `2D` consumes its native three-byte effect ID, updates the overlay state without adding a wait, and both first-choice branches now continue to the next choice. Opcode `2F` performs the native byte swap and stops the selected audio class. Visual/system hooks listed above preserve native widths and trace ordering but still need their display effects completed.

Trace columns are: `frame, bank, offset, opcode, argument values, group(02004606), slot(020006FC), pending(020117C4), sp, writes, wait`. `tools/compare-traces.mjs --ignore-frame` compares command order before text timing is calibrated. Both runners use `tests/fixtures/input.tsv` as their input schedule.
