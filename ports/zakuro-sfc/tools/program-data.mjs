import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ProgramImage } from '../vm/program-image.js';

export async function readProgramData(directory) {
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  return ProgramImage.load(manifest, async range => {
    const data = new Uint8Array(await readFile(join(directory, range.file)));
    const sha256 = createHash('sha256').update(data).digest('hex');
    if (sha256 !== range.sha256) throw new Error(`program range hash mismatch: ${range.file}`);
    return data;
  });
}
