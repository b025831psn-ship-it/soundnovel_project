// Extracts the sound driver boot records from an owned ROM into the private port-data.
// Usage: node tools/extract-sound.mjs <rom.sfc> <out-dir>   (out-dir = kamaitachi-sfc-kor/port-data/sound)
// Writes ipl-records.bin: the raw `[len:u16le][dest:u16le][payload]...[0][exec]` chain read
// by CPU $00:B74B -> $00:B9C8 from file $003A3F, unchanged.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { checkRom, IPL_DESCRIPTOR, readIplRecords } from './rom.mjs';

const [romPath, outDir] = process.argv.slice(2);
const rom = readFileSync(romPath); checkRom(rom);
const recs = readIplRecords(rom);
const len = recs.reduce((n, r) => n + 4 + (r.payload ? r.payload.length : 0), 0);
const bytes = rom.subarray(IPL_DESCRIPTOR, IPL_DESCRIPTOR + len);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'ipl-records.bin'), bytes);
const sha = createHash('sha256').update(bytes).digest('hex');
console.log(JSON.stringify({ file: 'ipl-records.bin', bytes: bytes.length, sha256: sha, records: recs.map((r) => ({ dest: r.dest, length: r.payload?.length ?? 0 })) }));
