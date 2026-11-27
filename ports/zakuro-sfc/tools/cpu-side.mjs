// Main-CPU side of the Zakuro APU transfer routines in bank $30, for tools and tests until
// the 65c816 VM runs them itself. Each wait steps the APU until the polled port matches.
const LIMIT = 4_000_000;

export class CpuSide {
  constructor(apu) { this.apu = apu; this.token = 0xcc; }
  write(port, v) { this.apu.cpuWrite(port, v); }
  read(port) { return this.apu.cpuRead(port); }
  wait(cond, what) {
    for (let i = 0; i < LIMIT; i++) { if (cond()) return; this.apu.cpu.step(); }
    throw new Error(`APU never answered: ${what}`);
  }
  idle(seconds) { this.apu.run(Math.round(seconds * 1024000)); }

  // $30:8383 with an explicit range list: $83E8, then $8673 per range, then $8652.
  upload(ranges) {
    this.write(0, 0xff); this.token = 0xcc; // $83E8
    this.wait(() => this.read(0) === 0xaa && this.read(1) === 0xbb, '$BBAA');
    for (const r of ranges) this.send(r.dest, r.bytes);
    this.write(1, 0); this.write(0, this.token); // $8652
    this.wait(() => this.read(0) === this.token, 'finish token');
    for (let p = 0; p < 4; p++) this.write(p, 0);
  }

  // $30:8673: one `[length][bytes]` record to ARAM `dest`.
  send(dest, bytes) {
    if (!bytes.length) return;
    this.write(2, dest & 0xff); this.write(3, dest >> 8);
    this.write(1, 1); this.write(0, this.token);
    this.wait(() => this.read(0) === this.token, 'record start');
    let i = 0;
    this.write(1, bytes[0]); this.write(0, 0);
    for (let k = 1; k < bytes.length; k++) {
      this.wait(() => this.read(0) === (i & 0xff), `byte ${i}`);
      i++; this.write(1, bytes[k]); this.write(0, i & 0xff);
    }
    this.wait(() => this.read(0) === (i & 0xff), `byte ${i}`);
    // $86BD-$86C6: CMP leaves carry set, so ADC #$03 adds 4; a zero token is skipped.
    let t = (i + 4) & 0xff;
    if (t === 0) t = 4;
    this.token = t;
  }
}
