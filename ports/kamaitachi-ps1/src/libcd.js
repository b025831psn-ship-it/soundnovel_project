// libcd as the game uses it, served from the PAC files instead of a disc drive (HLE).
// One implementation for both sides: the oracle (tools/oracle/game-boot.mjs) hooks the
// library's entry points to it, and the browser machine hands it to the ported routines.
// A read completes at once: CdSync reports CdlComplete, CdReadSync 0 (done).
//   files: [{ name: "SCE", lba, data: Uint8Array }] (ISO 9660 extents of SLPS-01794)
//   m: { read(a, w), write(a, v, w) } — the game's RAM
export const LIBCD_ENTRY = {
  CdInit: 0x8004e928, CdSync: 0x8004eb7c, CdFlush: 0x8004efa0, CdControl: 0x8004ebe4, CdControlB: 0x8004ee54,
  CdSearchFile: 0x80050988, CdRead: 0x80051928, CdReadSync: 0x80051a28, CdReadCallback: 0x8004e6d8, CdDataCallback: 0x8004e6a8,
  CdPosToInt: 0x8004f148, CdIntToPos: 0x8004f044, CdSetDebug: 0x8004eb00,
};
export const DISC_LBA = { SCE: 250, VCE: 581, BGD: 5600, SDW: 21279, BIN: 29098, MUS: 29963, ANM: 37429, VCP: 37873 };
// CD-XA files: never read as data; ReadS with the XA mode streams them to the SPU (xa.js).
export const DISC_XA = { PINK: { lba: 97568, size: 277774336 } };
const bcd = (n) => ((n / 10) | 0) << 4 | n % 10;
const fromBcd = (b) => (b >> 4) * 10 + (b & 15);

export class LibCd {
  // xa: an XaStream (xa.js) the drive plays CD-XA into; without one XA reads are silent.
  constructor({ m, pacs = {}, onEvent = null, frame = () => 0, xa = null }) {
    this.m = m; this.loc = 0; this.onEvent = onEvent; this.frame = frame; this.xa = xa; this.filter = { file: 0, chan: 0 }; this.mode = 0;
    this.files = Object.entries(DISC_LBA).map(([name, lba]) => ({ name, lba, data: pacs[name] ?? new Uint8Array(0) }));
    // A file that has outgrown its place on the disc (the Korean SCE.PAC) moves past the last one;
    // the game takes every position from CdSearchFile.
    let free = 400000;
    for (const f of this.files) if (this.files.some((g) => g !== f && g.lba > f.lba && g.lba < f.lba + f.data.length / 2048)) { f.lba = free; free += Math.ceil(f.data.length / 2048) + 16; }
  }
  str(a) { let s = ""; for (let ch; (ch = this.m.read(a++, 1)); ) s += String.fromCharCode(ch); return s; }
  CdInit() { return 1; }
  CdSync() { return 2; } // CdlComplete
  // 0x8004efa0 is CdMix(CdlATV*) (the XA player passes its attenuation; CD L→L, L→R, R→R, R→L)
  CdFlush(p) { p >>>= 0; if (p >= 0x80000000) { const a = [0, 1, 2, 3].map((i) => this.m.read(p + i, 1)); this.xa?.setMix(a); this.onEvent?.({ frame: this.frame(), cdMix: a }); } return 1; }
  CdReadCallback() { return 1; }
  CdDataCallback() { return 0; }
  CdSetDebug() { return 0; }
  CdControl(com, p) {
    com &= 0xff; p >>>= 0;
    if (com === 2 && p) this.loc = this.CdPosToInt(p); // CdlSetloc
    if (com === 0x0d && p) this.filter = { file: this.m.read(p, 1), chan: this.m.read(p + 1, 1) }; // CdlSetfilter
    if (com === 0x0e && p) this.mode = this.m.read(p, 1); // CdlSetmode
    if ((com === 0x1b || com === 0x06) && p) { // CdlReadS / CdlReadN
      this.loc = this.CdPosToInt(p);
      const x = Object.values(DISC_XA).find((f) => this.loc >= f.lba && this.loc < f.lba + f.size / 2048);
      if (x && (this.mode & 0x40)) { this.xa?.start(this.loc - x.lba, this.filter.chan); this.onEvent?.({ frame: this.frame(), xa: this.loc - x.lba, chan: this.filter.chan }); }
    }
    if (com === 0x08 || com === 0x09) { if (this.xa?.playing) this.onEvent?.({ frame: this.frame(), xaStop: com }); this.xa?.stop(); } // CdlStop / CdlPause
    return 1;
  }
  CdControlB(com, p) { return this.CdControl(com, p); }
  CdSearchFile(fp, namePtr) {
    const { m } = this, name = this.str(namePtr >>> 0);
    const f = this.files.find((x) => name.startsWith("\\" + x.name + ".")) ?? Object.entries(DISC_XA).filter(([n]) => name.startsWith("\\" + n + ".")).map(([n, x]) => ({ name: n, lba: x.lba, data: { length: x.size } }))[0];
    this.onEvent?.({ frame: this.frame(), search: name, found: !!f });
    if (!f) return 0;
    fp >>>= 0; this.CdIntToPos(f.lba, fp); m.write(fp + 3, 0, 1); m.write(fp + 4, f.data.length, 4);
    return fp;
  }
  CdRead(n, buf) {
    const { m } = this, f = this.files.find((x) => this.loc >= x.lba && this.loc < x.lba + x.data.length / 2048);
    if (f) { const off = (this.loc - f.lba) * 2048, src = f.data.subarray(off, off + n * 2048);
      if (m.setBytes) m.setBytes(buf >>> 0, src); else for (let i = 0; i < src.length; i++) m.write((buf >>> 0) + i, src[i], 1); }
    this.onEvent?.({ frame: this.frame(), read: f?.name ?? null, sector: f ? this.loc - f.lba : this.loc, count: n });
    this.loc += n; return 1;
  }
  CdReadSync() { return 0; }
  CdPosToInt(p) { const { m } = this; p >>>= 0; return (fromBcd(m.read(p, 1)) * 60 + fromBcd(m.read(p + 1, 1))) * 75 + fromBcd(m.read(p + 2, 1)) - 150; }
  CdIntToPos(i, p) { const { m } = this, l = i + 150; p >>>= 0; m.write(p, bcd((l / 4500) | 0), 1); m.write(p + 1, bcd(((l / 75) | 0) % 60), 1); m.write(p + 2, bcd(l % 75), 1); return p; }
}

// The ported routines reach libcd through libcd(ctx): ctx.cd in the browser, otherwise the
// library's own entry points through ctx.call (hooked to the same LibCd on the oracle).
export function libcd(ctx) {
  if (ctx.cd) return ctx.cd;
  const lib = {};
  for (const [name, addr] of Object.entries(LIBCD_ENTRY)) lib[name] = (...args) => ctx.call(addr, args, ctx.sp) | 0;
  return lib;
}
