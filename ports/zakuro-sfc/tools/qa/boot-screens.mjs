import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const [vmDir, romPath, iplPath, dspPath, outDir, seq] = process.argv.slice(2);
const { createApuLink, ZakuroVM } = await import(pathToFileURL(resolve(vmDir, 'vm/index.js')));
const [rom, ipl, powerOnDsp] = await Promise.all([readFile(romPath), readFile(iplPath), readFile(dspPath)]);
const { link } = createApuLink({ ipl, powerOnDsp });
let last = null;
const vm = new ZakuroVM({ rom, masterLink: link, onFrame({ rgba }) { last = rgba; } });
const B = { S: 0x1000, A: 0x0080, D: 0x0400, U: 0x0800, R: 0x0100, L: 0x0200, B: 0x8000, N: 0, Y: 0x4000, E: 0x2000, X: 0x0040, l: 0x0020, r: 0x0010 };
const step = (b) => { vm.setJoypad(b); const f = vm.ppu.field; while (vm.ppu.field === f) vm.step(); };
const shot = async (name) => { const rgb = Buffer.alloc(256 * 224 * 3); for (let i = 0, j = 0; i < last.length; i += 4) { rgb[j++] = last[i]; rgb[j++] = last[i + 1]; rgb[j++] = last[i + 2]; } await writeFile(`${outDir}/${name}.ppm`, Buffer.concat([Buffer.from('P6\n256 224\n255\n'), rgb])); };
// seq: comma list of tokens "<button><frames>" e.g. N301,S3,N181 ; "@name" takes a screenshot; "?" prints WRAM probes
const w = vm.bus.wram;
for (const t of seq.split(',')) {
  if (t.startsWith('@')) { await shot(t.slice(1)); continue; }
  if (t === 'RESET') { vm.reset(); continue; }
  if (t.startsWith('W')) { const [a, n] = t.slice(1).split(':').map((x) => parseInt(x, 16)); console.log(t, Buffer.from(w.subarray(a, a + n)).toString('hex')); continue; }
  if (t === '?') { console.log(JSON.stringify({ scene: w[0x1000] === 0xf6 ? w[0x1002] | (w[0x1003] << 8) : -1, slot: w[0x348], s0: [...vm.bus.sram.subarray(0, 2)], s1: [...vm.bus.sram.subarray(0x48a, 0x48c)], s2: [...vm.bus.sram.subarray(0x914, 0x916)] })); continue; }
  const n = Number(t.slice(1)); for (let i = 0; i < n; i++) step(B[t[0]]);
}
