import { readFile } from 'node:fs/promises';

export async function readApuPorts(path) {
  const lines = (await readFile(path, 'utf8')).trimEnd().split(/\r?\n/);
  if (lines.shift() !== 'frame\tmaster_cycle\tdir(w/r)\tport\tvalue') throw new Error('unexpected apu-ports.tsv header');
  return lines.map((line, index) => {
    const [frame, master, dir, port, value] = line.split('\t');
    if (!/^[rw]$/.test(dir)) throw new Error(`bad direction at row ${index + 2}`);
    return { frame: Number(frame), master: Number(master), dir, port: Number(port), value: Number.parseInt(value, 16) };
  });
}

export class ApuTraceComparator {
  constructor(reference) { this.reference = reference; this.index = 0; this.maxMasterDelta = 0; }
  observe(actual) {
    const expected = this.reference[this.index];
    if (!expected) throw new Error(`extra APUIO access #${this.index + 1}`);
    const delta = actual.master - expected.master;
    this.maxMasterDelta = Math.max(this.maxMasterDelta, Math.abs(delta));
    if (actual.dir !== expected.dir || actual.port !== expected.port || actual.value !== expected.value) {
      throw new Error(`APUIO mismatch #${this.index + 1}: expected ${expected.dir}${expected.port}=${expected.value.toString(16).padStart(2, '0')} @${expected.master}, got ${actual.dir}${actual.port}=${actual.value.toString(16).padStart(2, '0')} @${actual.master}`);
    }
    this.index++; return delta;
  }
  finish() {
    if (this.index !== this.reference.length) throw new Error(`APUIO trace ended at ${this.index}/${this.reference.length}`);
    return { rows: this.index, maxMasterDelta: this.maxMasterDelta };
  }
}
