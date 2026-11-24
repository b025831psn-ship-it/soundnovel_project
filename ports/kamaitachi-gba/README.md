# Kamaitachi GBA native-bytecode port skeleton

This directory runs native scenario-bank bytes, not the JSON novel-player path. It contains no game data and fetches the versioned `kamaitachi-gba-kor/port-data/` private-submodule output at runtime.

Implemented foundations: original-width bank reader, native RAM-shaped state, handler-address traceability, BG tile/palette rendering on a 240×160 canvas, palette groups and deferred `04`, native glyph RLE lookup/decoding, `r p P g o n` text-window state, GBA keyboard input, fixed 60 Hz VBlank loop, and common trace comparison.

## Opcode status

| status | opcodes |
|---|---|
| state/control implemented | `00 01 02 03 04 05 0A 0C 0D 0E 0F 13 14 15 16 17 1A 1C 1D 1E 21 22 23 25 2D 2F 30 31 32 33 34 40 41 45 4B 4C 53 56 57 5B 5E` |
| width decoded; visual/system effect hook pending | `08 09 0B 29 2C 2E 35 37 39 3B 3C 3D 3E 4D 4E 4F 53 58 59 5F 63` |
| not implemented | every other opcode; VM halts and records the byte in `unimplemented` |

The VM resolves entry row 27000 through each bank's native LE16 row table. To include the cartridge's pre-story boot path, open the player with `?entryRow=31000`, or pass `31000` as the third argument to `tools/trace-scenario.mjs` after the data path and command limit. `tools/trace-scenario.mjs` reaches the first `57` after 171 commands, executes the original 47-command candidate collection block with the native `0200077E` suppression state, and opens the choice at `16` after 218 commands with no unimplemented opcode. Opcode `2D` forms its effect ID as `(high << 8) + LE16`, updates the overlay state without adding a wait, and both first-choice branches now continue to the next choice. Opcode `2F` reads its request as LE16 and stops the selected audio class. Both commands honor the native `0200077E`/`0200078E` suppression gates and `02000781` update flag; `2D` also compares mask slots as signed halfwords. Opcodes `30` and `32` execute an immediately following `00` text command through the native `0800337C` ordering before starting their audio work.

Trace columns are: `frame, bank, offset, opcode, argument values, group(02004606), slot(020006FC), pending(020117C4), sp, writes, wait`. `tools/compare-traces.mjs --ignore-frame` compares command order before text timing is calibrated. Both runners use `tests/fixtures/input.tsv` as their input schedule.
