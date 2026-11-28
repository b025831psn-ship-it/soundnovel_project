// Writes a private, ROM-free ProgramImage containing every normalized LoROM byte.
// Usage: node tools/build-full-program-data.mjs <rom> <output-directory>
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [romPath, outputDirectory] = process.argv.slice(2);
if (!outputDirectory) throw new Error('expected ROM and output directory');
let rom = new Uint8Array(await readFile(romPath));
if ((rom.length & 0x3ff) === 512) rom = rom.subarray(512);
if (!rom.length || (rom.length & 0x7fff)) throw new Error(`invalid LoROM length: ${rom.length}`);
await mkdir(outputDirectory, { recursive: true });
const ranges = [], chunkSize = 64 * 1024;
for (let offset = 0, index = 0; offset < rom.length; offset += chunkSize, index++) {
  const data = rom.subarray(offset, Math.min(rom.length, offset + chunkSize));
  const file = `full-${String(index).padStart(3, '0')}.bin`;
  await writeFile(join(outputDirectory, file), data);
  ranges.push({ offset, length: data.length, file,
    sha256: createHash('sha256').update(data).digest('hex') });
}
const exponent = rom[0x7fd8];
const manifest = {
  format: 1, mapping: 'LoROM-linear', complete: true,
  sourceSha256: createHash('sha256').update(rom).digest('hex'),
  ...(exponent ? { sram: { size: 1 << (exponent + 10), fill: 0x60 } } : {}), ranges,
};
await writeFile(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ bytes: rom.length, ranges: ranges.length,
  sourceSha256: manifest.sourceSha256 }, null, 2));
