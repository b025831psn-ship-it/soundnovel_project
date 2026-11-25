// Boots the game's SPC driver from an owned ROM and replays the main-CPU boot handshake.
// Usage: node ports/kamaitachi-sfc/tools/boot-driver.mjs <rom.sfc> [--log out.tsv]
// Reads the IPL records at file $003A3F (CPU $00:BA3F), uploads them, then performs the
// CPU side of $00:B7BE: write "Chun" to $2140-$2143, wait for "SOFT", write 0 to $2140,
// wait for port 0 to read 0. Prints DSP register writes as `clock\treg\tvalue`.
import { readFileSync, writeFileSync } from 'node:fs';
import { APU } from '../sound/apu.js';
import { checkRom, readIplRecords } from './rom.mjs';

const [romPath, flag, logPath] = process.argv.slice(2);
const rom = readFileSync(romPath);
checkRom(rom);
const records = readIplRecords(rom);

const dsp = [];
const apu = new APU({ onDspWrite: (t, r, v) => dsp.push([t, r, v]) });
apu.cpu.uploadRecords(records);
const until = (cond, limit = 1e6) => { for (let i = 0; i < limit; i++) { if (cond()) return true; apu.cpu.step(); } return false; };
const readPorts = () => String.fromCharCode(...[0, 1, 2, 3].map((i) => apu.cpuRead(i)));

[...'Chun'].forEach((c, i) => apu.cpuWrite(i, c.charCodeAt(0)));
if (!until(() => readPorts() === 'SOFT')) throw new Error('driver never answered SOFT');
const softClock = apu.cpu.clock;
apu.cpuWrite(0, 0);
if (!until(() => apu.cpuRead(0) === 0)) throw new Error('driver never cleared port 0');
apu.run(SPC_SECONDS(1));

function SPC_SECONDS(s) { return Math.round(s * 1024000); }
console.log(`records ${records.length}, SOFT at clock ${softClock}, DSP writes ${dsp.length} in first second`);
const tsv = dsp.map(([t, r, v]) => `${t}\t${r.toString(16).padStart(2, '0')}\t${v.toString(16).padStart(2, '0')}`).join('\n');
if (flag === '--log' && logPath) writeFileSync(logPath, tsv + '\n'); else console.log(tsv.split('\n').slice(0, 40).join('\n'));
