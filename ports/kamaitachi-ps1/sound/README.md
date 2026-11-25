# PS1 sound (Claude-PS1)

Engine side of the PS1 port's audio. Goal: play the game's music and effects from
the original MUS/VCE data by porting the game's sound module and the libsnd paths
it uses onto a JS SPU. Native SPU-register traces are the oracle.

Done so far (formats the SPU and libsnd consume):

- `vag.js`: SPU ADPCM block decoder (filters, shift, loop flags).
- `vab.js`: VAB bank head (programs, tones with ADSR words, VAG size table).
- `seq.js`: SEQ header and event reader (running status, tempo, end of track).

Container layouts found on the disc (details in `kamaitachi-ps1-kor/sound/ANALYSIS.md`):
MUS.PAC member = BE header `{vabHeadOffset, 0x0c, seqOffset}`, VAG body from 0x1c,
then SEQ, then VAB head. VCE.PAC member = BE `{3, vhOffset, ?, vbOffset, bodySize, total, ?}`.

Check against a private copy: `node tools/check-sound-data.mjs <dir>` → all 73 MUS
and 301 VCE members parse; 747 MUS VAG samples decode within their table sizes.

Next: name the libsnd entry points the game module calls, port the sequencer tick
(SsSeq*), and the SPU voice model (ADSR, pitch, reverb), then compare with the trace.
