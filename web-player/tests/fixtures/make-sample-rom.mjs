// Builds the synthetic test ROM read by rom/sample-adapter.js. All text is self-written.
// Usage: node tests/fixtures/make-sample-rom.mjs <out.gba>
import { writeFile } from 'node:fs/promises';

const strings = [];
const s = (t) => { let i = strings.indexOf(t); if (i < 0) { i = strings.length; strings.push(t); } return i; };
const ops = [];
const op = (code, ...args) => ops.push([code, ...args]);

op(1, s('gate')); op(2, s('yard'));
op(5, s('대문 앞에서 잠시 망설였다.'), 2);
op(6, s('안으로 들어간다.'), s('inside'));
op(6, s('돌아선다.'), s('back'));
op(1, s('inside')); op(2, s('hall'));
op(4, s('현관에는 불이 켜져 있었다.'), s('玄関には明かりがついていた。'));
op(3, s('누군가 기다리고 있었던 것 같다.'));
op(8);
op(1, s('back')); op(2, s('yard'));
op(3, s('발길을 돌려 언덕을 내려갔다.'));
op(8);

const enc = new TextEncoder();
const body = [];
const u16 = (v) => body.push(v & 0xff, v >> 8);
u16(strings.length);
for (const t of strings) { const b = enc.encode(t); u16(b.length); body.push(...b); }
u16(ops.length);
for (const [code, ...args] of ops) { body.push(code); args.forEach(u16); }

const rom = new Uint8Array(0x100 + body.length);
rom.set(enc.encode('SAMPLE NOVEL'), 0xa0);
rom.set(enc.encode('SNSM'), 0xac);
rom.set(enc.encode('01'), 0xb0);
rom.set(body, 0x100);
await writeFile(process.argv[2], rom);
console.log(`${process.argv[2]}: ${rom.length} bytes, ${strings.length} strings, ${ops.length} ops`);
