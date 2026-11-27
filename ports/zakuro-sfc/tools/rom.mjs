// Owned-ROM helpers for the Zakuro no Aji SPC driver. The ROM itself is never committed.
import { createHash } from 'node:crypto';
export { APU_TIMING, LINK_TIMING, POWER_ON } from '../sound/zakuro-timing.js';
export const ROM_SHA256 = '4e0a7f639c185b49abe70de16bf7ef062a316d986753c7aabd9b98e6b956d0b6';
export const BOOT_DESCRIPTOR = 0x308010; // CPU $30:8010, read by the boot path $30:86CA

export const lorom = (addr) => ((addr >> 16) & 0x7f) * 0x8000 + ((addr & 0xffff) - 0x8000);

export function checkRom(rom) {
  const sha = createHash('sha256').update(rom).digest('hex');
  if (sha !== ROM_SHA256) throw new Error(`unexpected ROM ${sha}`);
}

// Boot descriptor: `[source:u24][aramDest:u16]` entries, first source byte 0 ends the list.
// Each source is `[length:u16][payload]`. Returns IPL-style records with a final entry
// whose destination is the driver entry (the first record's destination).
export function readBootRecords(rom, at = lorom(BOOT_DESCRIPTOR)) {
  const records = [];
  for (let p = at; rom[p] !== 0; p += 5) {
    const src = lorom(rom[p] | (rom[p + 1] << 8) | (rom[p + 2] << 16));
    const dest = rom[p + 3] | (rom[p + 4] << 8);
    const n = rom[src] | (rom[src + 1] << 8);
    records.push({ dest, payload: rom.subarray(src + 2, src + 2 + n) });
  }
  records.push({ dest: records[0].dest, payload: null });
  return records;
}

// APU power-on and timing constants that reproduce the reference run (zakuro-sfc-kor 599e867,
// Snes9x 1bcc369, cycles are SMP bus-access times). The driver's first instruction runs at
// SPC cycle 1,223,778; the timer dividers sit 3 clocks ahead of that point; every DSP write
// (all `MOV !$00F3,A`, 5 clocks) takes effect at the end of its instruction.
import { APU_TIMING } from '../sound/zakuro-timing.js';

// VM link timing for this driver (sound/master-link.js), fitted on the same run's 1,253,625
// CPU accesses against this core's instruction starts s and the CPU access time T:
// - a CPU read sees an SPC port write (MOV !$F4,Y / !$F4,A, 5 clocks) iff s + 5 < T
//   (last miss T - s = 4.99997, first hit 5.00012);
// - an SPC read sees a CPU write iff s + point >= T: CMP Y,!$F4 (5E) 1 (hit 0.887, miss
//   1.214), MOV Y,!$F4 (EC) 4 (hit 3.257, miss 4.132), MOV A,!$F4 (E5) 1 (hit 0.507,
//   miss 4.312; 1 keeps it with the other reads), CMP A,!$F4 (65) 1 (never decides).
// With the real IPL ROM (injected from private data, never committed) the run can start at
// power-on. The IPL polls with dp addressing, and a CPU read sees an SPC port write iff
// s + (clocks of the writing instruction) < T. Fitted the same way on all 1,000,707 CPU
// reads from power-on: CMP $F4,#$CC (78) 4, MOVW YA,$F6 (BA) 5, MOV Y/CMP Y/MOV A,dp
// (EB/7E/E4) 3; writes MOV dp,#imm (8F) 5, MOV dp,A / dp,Y (C4/CB) 4, abs (C5/CC) 5.
