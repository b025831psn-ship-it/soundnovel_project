import { readFile } from 'node:fs/promises';

export async function readInputTrace(path) {
  const lines = (await readFile(path, 'utf8')).trimEnd().split(/\r?\n/);
  if (lines.shift() !== 'frame\tjoy1') throw new Error('unexpected input.tsv header');
  const frames = [];
  for (const [index, line] of lines.entries()) {
    const [frameText, joyText] = line.split('\t');
    const frame = Number(frameText), joy1 = Number.parseInt(joyText, 16);
    if (frame !== index || !Number.isInteger(joy1) || joy1 < 0 || joy1 > 0xffff) {
      throw new Error(`bad input.tsv row ${index + 2}`);
    }
    frames.push(joy1);
  }
  return frames;
}
