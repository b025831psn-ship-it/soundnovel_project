// Splits the owned ROM into the program image the ROM-free player loads (private port-data only):
//   node tools/extract-program.mjs <rom.sfc> <kamaitachi-sfc-kor/port-data/program>
// Writes bank-pair files (64 KiB each) and manifest.json with each range's offset, length and
// SHA-256, plus the whole image's SHA-256. The player checks every range before it runs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [romPath, out] = process.argv.slice(2);
if (!romPath || !out) { console.error('usage: extract-program.mjs <rom.sfc> <out dir>'); process.exit(2); }
let rom = fs.readFileSync(romPath);
if (rom.length % 0x8000 === 512) rom = rom.subarray(512); // copier header
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const EXPECT = '3228a3b35f7d234a7bf91f8159ccc56518199222e84d258c14a153f54f9fcbc7';
if (sha(rom) !== EXPECT) throw new Error(`Unexpected ROM ${sha(rom)} (want Rev 0, ${EXPECT})`);
fs.mkdirSync(out, { recursive: true });
const SIZE = 0x10000, ranges = [];
for (let offset = 0; offset < rom.length; offset += SIZE) {
  const data = rom.subarray(offset, offset + SIZE), file = `${(offset / SIZE).toString().padStart(2, '0')}.bin`;
  fs.writeFileSync(path.join(out, file), data);
  ranges.push({ file, offset, length: data.length, sha256: sha(data) });
}
fs.writeFileSync(path.join(out, 'manifest.json'), `${JSON.stringify({ format: 'kamaitachi-sfc-program-v1', mapping: 'LoROM', size: rom.length, sha256: sha(rom), ranges }, null, 1)}\n`);
console.log(`${ranges.length} ranges, ${rom.length} bytes`);
