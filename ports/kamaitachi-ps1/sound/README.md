# PS1 sound (Claude-PS1)

Engine side of the PS1 port's audio. Goal: play the game's music and effects from
the original MUS/VCE data by porting the game's sound module and the libsnd paths
it uses onto a JS SPU. Native SPU-register traces are the oracle.

Done so far (formats the SPU and libsnd consume):

- `vag.js`: SPU ADPCM block decoder (filters, shift, loop flags).
- `vab.js`: VAB bank head (programs, tones with ADSR words, VAG size table).
- `seq.js`: SEQ header and event reader (running status, tempo, end of track).

- `container.js`: member layouts and the sound tables in the EXE.
  MUS.PAC member = BE `{vabHead, vabBody (=0x0c), seq}` offsets.
  VCE.PAC member = BE `{count=3, (offset, size) x 3}`: VAB head, VAB body, effect script
  (read by `0x80044e50`/`0x80044e90`). Song table (88 entries): reverb type/depth
  `0x8006a714`, duration/loop count `0x8006a7c4`, volume `0x8006a924`; pan law `0x8006aa84`.
- `module.js`: port of the game sound module. Effect-script engine (19 opcodes, table
  `0x8006aac4`, 6 channels on SPU voices 18-23, per-frame ramps for volume/pan/pitch,
  scenario flags, pad vibration), music controller (`0x800284b0` play, `0x80028334` stop,
  fade and duration in `0x80029008`, VSync callback `0x80028f88`), UI sound banks
  (`0x80028b10`, `0x80028c74`), reset `0x80028ccc`. All libsnd/libspu calls go through
  an `ss` object named after the library functions (see `LIBSND.md`).

Scenario entry point: `scenarioOp(opcode, operands, skip)` for primary ops `0x2f` stop,
`0x30` play, `0x31` stop with fade `{fade, id}`, `0x32` play with fade `{fade, id}` (fade x10
frames), `0x35`/`0x36` set effect variant `{bank, id}`. Sound ids < 1000 are songs (0x800292b0;
ids in the 0x800119e0 table that point at 0x80029360 stop the music), ids >= 1000 are effects:
`1000 + bank*1000 + n`; the bank becomes the script flag `flags[n]` (0x80026534) and only
restartable effects (0x8006b04c) load the bank's own member. Pair effects (0x8006b1cc mode 1)
load two halves from VCP.PAC onto adjacent channels. The VM calls `vsync()` per VSync and
`frame()` once per main-loop frame.

Checks against a private copy (counts only):
`node tools/check-sound-data.mjs <dir>` → 73 MUS / 301 VCE members parse, 747 VAGs decode
within their table sizes. `node tools/check-vce-scripts.mjs <dir> [frames] [flagFrame]` →
all 301 effect scripts run through the module without unknown opcodes or runaway loops.
`node tools/check-scenario-sound.mjs <port-data> <dir>` → every sound op the scenario sweep
reaches (765 ops, 35 songs, 80 effect ids) runs through the module; all members exist.

Next: the libsnd side behind `ss` (SsSeqCalledTbyT sequencer, SsUtKeyOnV/ChangePitch/
SetVVol voice paths) and the SPU voice model (ADSR, pitch, reverb), then compare with the trace.
