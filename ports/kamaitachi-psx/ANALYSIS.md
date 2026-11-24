# Static analysis map

This file records addresses and control-flow facts only. It contains no disc
payload, extracted text, media, or trace data.

## Executable startup

- PS-X EXE entry: `0x800622d8`
- game main: `0x80014314`
- entry-stub global pointer: `0x8007913c`

## Title and name-entry path

- The title-menu draw/input loop is rooted near `0x80014e80`.
- The name-entry routine starts at `0x800426b0`; `0x800428e0` is an internal
  loop target, not a function entry.
- The script dispatcher at `0x80044384` uses the 108-entry jump table at
  `0x800129dc`.
- Script opcode 3 dispatches through `0x80044470`, invoking name modes 0 and 1
  in sequence. Opcode 4 dispatches through `0x80044488` for mode 2.
- Modes 0, 1, and 2 select the protagonist, partner, and culprit name buffers.
- The editor draws a 6-by-15 character grid and reads the normalized controller
  edge word at `0x801eef40`.
- Direction masks are `0x1000`, `0x4000`, `0x8000`, and `0x2000`. The editor
  tests `0x10` as its explicit finish action.
- The common epilogue returns through `0x800432e4`.

## Dynamic confirmation

An isolated private harness executes the original routine in the JavaScript
R3000A core while replacing only external rendering, CD/audio, VBlank pacing,
and controller-source boundaries. Both mode 0 and mode 1 reach the common
epilogue and return normally after the finish edge is injected. The harness and
all original data remain private.

The path requires base-integer `NOR` and COP2 `MTC2`/`CTC2` transfers in
addition to the previously inventoried CPU and MMIO subset. GTE commands have
not yet been demonstrated on this slice and remain unimplemented.

## Open analysis items

- Identify the exact nested SCE record and disc LBA that emits script opcode 3.
- Correlate title/name drawing with GP0 packets, VRAM rectangles, and CLUT
  uploads.
- Replace isolated subsystem hooks with trace-matched CD, VBlank, GPU, SPU, XA,
  and STR behavior.
- Extend the address map into a complete annotated script-opcode table.
