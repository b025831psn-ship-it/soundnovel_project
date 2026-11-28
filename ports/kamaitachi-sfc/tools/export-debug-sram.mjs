// Copy the QA campaign's complete-160.srm to the private port-data directory.
import { readFile, writeFile } from 'node:fs/promises';
import { endingFlags } from './campaign.mjs';
import { completedRows } from './gold.mjs';

const [source, target] = process.argv.slice(2);
if (!source || !target) throw new Error('usage: export-debug-sram.mjs <QA complete-160.srm> <private debug-save.srm>');
const sram = await readFile(source);
if (sram.length !== 8192 || !(sram[0x805] & 4) || endingFlags(sram).size !== 43 || completedRows(sram) !== 160) {
  throw new Error('QA bookmark 1 must have 43 endings, 160 complete rows, and the gold bookmark');
}
await writeFile(target, sram, { flag: 'wx' });
