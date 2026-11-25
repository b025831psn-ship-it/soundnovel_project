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

Checks against a private copy (counts only):
`node tools/check-sound-data.mjs <dir>` → 73 MUS / 301 VCE members parse, 747 VAGs decode
within their table sizes. `node tools/check-vce-scripts.mjs <dir> [frames] [flagFrame]` →
all 301 effect scripts run through the module without unknown opcodes or runaway loops.

Next: the libsnd side behind `ss` (SsSeqCalledTbyT sequencer, SsUtKeyOnV/ChangePitch/
SetVVol voice paths) and the SPU voice model (ADSR, pitch, reverb), then compare with the trace.
