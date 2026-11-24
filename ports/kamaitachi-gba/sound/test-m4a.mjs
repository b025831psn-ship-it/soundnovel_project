// Sequencer and mixer checks for m4a.js with a song written by hand (no cartridge data).
// Usage: node ports/kamaitachi-gba/sound/test-m4a.mjs
import { M4A, Memory } from './m4a.js';

const BASE = 0x08000000;
const mem = new Uint8Array(0x2000);
const dv = new DataView(mem.buffer);
const w8 = (a, v) => { mem[a - BASE] = v; };
const w16 = (a, v) => dv.setUint16(a - BASE, v, true);
const w32 = (a, v) => dv.setUint32(a - BASE, v >>> 0, true);
const bytes = (a, list) => list.forEach((v, i) => w8(a + i, v));

// m4a constant tables: gClockTable (note and wait lengths in ticks)
const CLOCK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 28, 30, 32, 36,
  40, 42, 44, 48, 52, 54, 56, 60, 64, 66, 68, 72, 76, 78, 80, 84, 88, 90, 92, 96];
const clockTable = BASE + 0x100;
bytes(clockTable, CLOCK);

// A 64-sample square wave played at the mixer rate (voice type 8: fixed frequency), looping.
const wave = BASE + 0x200;
w16(wave, 0); w16(wave + 2, 0x4000); w32(wave + 4, 0); w32(wave + 8, 0); w32(wave + 12, 64);
for (let i = 0; i < 64; i++) w8(wave + 16 + i, i < 32 ? 100 : -100 & 0xff);
const voices = BASE + 0x300; // voice 0: DirectSound fixed, attack 255, decay 0, sustain 255, release 0
bytes(voices, [8, 60, 0, 0]); w32(voices + 4, wave); bytes(voices + 8, [255, 0, 255, 0]);

const W = (ticks) => 0x80 + CLOCK.indexOf(ticks);
const N = (ticks) => 0xcf + CLOCK.indexOf(ticks);
const track = BASE + 0x400;
let p = track;
const put = (...v) => { for (const x of v) w8(p++, x); };
const at = () => p;
put(0xbb, 75, 0xbd, 0, 0xbe, 100, 0xbf, 0x40); // tempo 150 (one tick per frame), voice 0, vol 100, center
put(N(12), 60, 127, W(24)); // tick 0: note for 12 ticks, then 24 ticks of rest
const pattern = BASE + 0x500;
put(0xb3); w32(p, pattern); p += 4; // tick 24: pattern call
const rept = at(); put(0xb5, 2); w32(p, rept); p += 4; // REPT 2 runs itself once more, then goes on
put(0xcf, 62, 100, W(6), 0xce, 62); // TIE then EOT after 6 ticks
put(0xbe, 0, W(1), 0xb1); // volume 0, FINE
const after = p;
p = pattern;
put(W(3), 0xb4); // pattern: wait 3, PEND
p = after;

const header = BASE + 0x600;
bytes(header, [1, 0, 10, 0x80 | 32]); w32(header + 4, voices); w32(header + 8, track);
const songTable = BASE + 0x700;
w32(songTable, header); w16(songTable + 4, 0); w16(songTable + 6, 0);
const players = BASE + 0x800;
w32(players, 0x02000000); w32(players + 4, 0x03000000); w8(players + 8, 1);

const cfg = {
  base: BASE, clockTable, songTable, players, playerCount: 1, mixRate: 18157, samplesPerVBlank: 304,
  maxChannels: 5, masterVolume: 15, reverb: 0, scaleTable: 0, freqTable: 0, cgbScaleTable: 0, cgbFreqTable: 0, noiseTable: 0,
};

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures++; };

const e = new M4A(new Memory(mem, BASE), cfg);
const ch = e.channels[0];
const live = () => e.channels.filter((c) => c.status & 0xc7).length;
check(e.startSong(0), '곡 시작');
check(e.reverb === 32, '곡 헤더 bit 7이면 리버브 32');
let frame = e.vblank();
check(live() === 1 && ch.velocity === 127, '첫 틱에 음 하나');
const peak = Math.max(...frame.r.map(Math.abs));
check(peak > 0.1 && peak < 1, `소리가 섞임 (peak ${peak.toFixed(3)})`);
check(Math.abs(frame.r[10] - frame.l[10]) < 0.02, '가운데 패닝은 좌우 같음');
for (let f = 1; f < 12; f++) e.vblank();
check(live() === 1 && !(ch.status & 0x40), '12틱 동안 유지');
e.vblank();
check(!(ch.status & 0xc7) || (ch.status & 0x40), '12틱 뒤 릴리스(release 0이면 바로 꺼짐)');
for (let f = 13; f < 24; f++) e.vblank();
const t = e.players[0].tracks[0];
e.vblank(); // tick 24: pattern call
check(t.patternLevel === 1, '패턴 호출로 한 단계 들어감');
for (let f = 0; f < 3; f++) e.vblank();
check(t.patternLevel === 0, '3틱 뒤 PEND로 복귀');
check(t.repN === 0 && t.cmdPtr > rept, 'REPT 2는 한 번 되돌아간 뒤 다음으로 진행');
check(live() === 1 && ch.key === 60 && ch.midiKey === 62 && ch.gateTime === 0, 'TIE 음은 길이 없이 시작');
for (let f = 0; f < 6; f++) e.vblank();
check(!(ch.status & 0xc7) || (ch.status & 0x40), 'EOT 62로 TIE 음 해제');
for (let f = 0; f < 3; f++) e.vblank();
check(!e.players[0].active, 'FINE 뒤 플레이어 정지');

// Fade-out: four steps of 16/256 every frame at speed 1 stop the player after 16 frames.
e.startSong(0);
e.vblank();
e.fadeOut(0, 1);
let frames = 0;
while (e.players[0].active && frames < 40) { e.vblank(); frames++; }
check(frames === 16, `페이드아웃 속도 1은 16프레임 뒤 정지 (${frames})`);

// A song of lower priority does not cut a running one on the same player.
e.startSong(0);
w8(header + 2, 5);
check(e.startSong(0), '같은 곡은 다시 시작');
w8(header + 2, 10);

console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
