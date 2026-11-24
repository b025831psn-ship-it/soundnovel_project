// Sequencer and mixer checks for m4a.js with a song written by hand (no cartridge data).
// Usage: node ports/kamaitachi-gba/sound/test-m4a.mjs
import { M4A, Memory } from './m4a.js';
import { SceneAudio } from './scene-audio.js';
import { Effects } from './effects.js';

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

// m4aMPlayVolumeControl: volume >> 2 lands in volX as a byte (0x4000 wraps to 0).
e.startSong(0);
e.immInit(0);
e.volumeControl(0, 0xffff, 0x100);
check(e.players[0].tracks[0].volX === 64, '음량 0x100은 volX 64');
e.volumeControl(0, 0xffff, 0x4000);
check(e.players[0].tracks[0].volX === 0, '음량 0x4000은 u8로 잘려 volX 0');

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

// The game's controller above m4a (0800A1E8/0800A414). Track volume measured in mGBA,
// starting at the first frame update after a fade-in start (opcode 32 path).
const engine = new M4A(new Memory(mem, BASE), cfg);
const tables = { requestSong: [0, -1], volume: [0x100, 0x100, 0x100], length: [[-1, 0], [-1, 0], [3, 1]] };
for (const [speed, expected] of [
  [10, [22, 28, 34, 40, 46, 54, 60, 64, 64, 64]],
  [17, [18, 22, 26, 30, 34, 38, 42, 46, 48, 52, 56, 60, 64, 64, 64, 64, 64]],
]) {
  const audio = new SceneAudio(engine, tables);
  audio.play(0, speed);
  const track = engine.players[0].tracks[0];
  const actual = expected.map(() => { audio.frame(); engine.vblank(); return track.volX; });
  check(actual.every((v, f) => v === expected[f]), `페이드인 속도 ${speed} 프레임별 volX (${actual.join(',')})`);
}
{
  const audio = new SceneAudio(engine, tables);
  audio.play(0);
  check(engine.players[0].tracks[0].volX === 64 && audio.request === 0 && audio.scene === 0, '속도 0 요청은 목표 음량으로 바로 시작');
  audio.play(0);
  check(audio.active === 1, '같은 요청은 무시');
  audio.fade(0, 4);
  for (let f = 0; f < 3; f++) audio.frame();
  check(audio.request === 0 && audio.fadeLeft === 1, '감쇠 중에는 요청 유지');
  audio.frame();
  check(audio.request === -1 && !engine.players[0].active, '감쇠가 끝나면 곡 정지');
  audio.play(1);
  check(audio.request === -1 && audio.scene === -1, '곡 번호가 -1인 요청은 정지로 처리');
  tables.requestSong[2] = 0;
  audio.play(2);
  check(audio.playLeft === 3, '길이 표의 프레임 수로 재생 카운트 시작');
  for (let f = 0; f < 3; f++) { audio.irq(); audio.frame(); }
  check(audio.request === -1, '재생 카운트가 0이 되면 정지');
  check(!audio.waiting(2, 0), '34: 재생 중인 요청이 없으면 대기 없음');
  audio.play(2);
  check(audio.waiting(1, 0) && !audio.waiting(1, 1), '34: 길이 -1인 요청은 첫 확인만 통과');
  check(audio.waiting(2, 1) && audio.waiting(2, 600) && !audio.waiting(2, 601), '34: 재생 중이면 최대 601프레임 대기');
}

// Effect scripts (08002B00): a hand-written script on player 1 with the native opcode bytes.
{
  // Song 1 = song 0's header on player 1 (the script names the player itself).
  w32(songTable + 8, header); w16(songTable + 12, 1); w16(songTable + 14, 1);
  w32(players + 12, 0x02000100); w32(players + 16, 0x03000100); w8(players + 20, 1);
  const engine2 = new M4A(new Memory(mem, BASE), { ...cfg, playerCount: 2 });
  const BASEFX = 0x100;
  const script = [
    0x04, 0x7f, 0x00, 0x00, // volume 0x7F00 now
    0x05, 0x40, 0x00, 0x00, // pan centre now
    0x07, 0x00, 0x30, 0x00, 0x00, // pitch 0x3000 now
    0x03, 0x01, 0x00, 0x00, 0x30, // play song 1, pitch base 0x3000
    0x01, 0x03, 0x00, // wait 3
    0x0a, 0x09, 0x1b, 0x00, // flag == 9: jump to +0x1B
    0x0f, // done (ends the frame)
    0x13, // end
    0x0e, // +0x1B: stop and done
    0x13, // end
  ];
  const bytes = new Uint8Array(0x40);
  bytes.set(script);
  const fx = new Effects(engine2, { base: BASEFX, programs: [BASEFX] }, bytes);
  fx.start(0, 0);
  fx.vblank();
  const t = engine2.players[1].tracks[0];
  check(fx.busy[1] === 1 && fx.slots[0].players[1] === 1 && engine2.players[1].active, '효과 스크립트가 player 1에서 곡 시작');
  // 0800235C: ((0x7F00 >> 8) * (0x10000 >> 8) >> 8) << 1 = 254, and volX = 254 >> 2.
  check(t.volX === 63, `효과 음량 volX ${t.volX}`);
  check(t.panX === 0 && t.keyShiftX === 0 && t.pitX === 0, '팬 0x40은 가운데(0), 기준 음높이는 변화 없음');
  for (let f = 0; f < 3; f++) fx.vblank();
  check(fx.slots[0].done === 1 && fx.slots[0].id === 0, '대기 뒤 done 표시, 슬롯 유지');
  fx.slots[0].done = 0;
  fx.setFlag(9, 0);
  check(fx.waiting(0, 0), '34: done 전에는 효과를 기다림');
  fx.vblank();
  check(fx.slots[0].id === 0 && fx.busy[1] === 1, '종료 명령은 재생 중이면 10프레임 뒤 다시 확인');
  fx.start(0, 0);
  fx.slots[0].flag = 9;
  for (let f = 0; f < 5; f++) fx.vblank();
  check(!engine2.players[1].active && fx.busy[1] === 0 && !fx.waiting(0, 0), '플래그 분기 → 정지·done, 34 대기 해제');
  fx.start(0, 20);
  fx.vblank();
  fx.fade(0, 10);
  for (let f = 0; f < 10; f++) fx.vblank();
  check(fx.slots[0].id === -1 && fx.busy[1] === 0, '마스터 감쇠가 0에 닿으면 슬롯 해제');
}

console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
