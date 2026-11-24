// Per-frame sequencer and channel state, to diff against the same fields read from mGBA RAM.
// Usage: node trace.mjs <port-data/sound dir> <song> <frames>
// Columns: frame, then for player 0..: clock, tempoD, tempoC; per track: cmdPtr(hex), wait, key, vol;
// then per DirectSound channel: status(hex), key, env, frequency.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { M4A, Memory } from './m4a.js';

const [dir, song, frames = '300'] = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(path.join(dir, 'm4a.json'), 'utf8'));
const e = new M4A(new Memory(new Uint8Array(readFileSync(path.join(dir, 'm4a.bin'))), cfg.base), cfg);
e.startSong(Number(song));
const p = e.players.find((x) => x.song === Number(song));
for (let f = 0; f < Number(frames); f++) {
  e.vblank();
  const tracks = p.tracks.filter((t) => t.flags).map((t) => [t.cmdPtr.toString(16), t.wait, t.key, t.vol].join(','));
  const chans = e.channels.map((c) => (c.status ? [c.status.toString(16), c.key, c.env, c.frequency].join(',') : '-'));
  console.log([f, p.clock, p.tempoD, p.tempoC, tracks.join(' '), chans.join(' ')].join('\t'));
}
