// Owned-ROM helpers for the SFC sound driver. The ROM itself is never committed.
import { createHash } from 'node:crypto';
export const ROM_SHA256 = '3228a3b35f7d234a7bf91f8159ccc56518199222e84d258c14a153f54f9fcbc7';
export const IPL_DESCRIPTOR = 0x3a3f; // CPU $00:BA3F

export function checkRom(rom) {
  const sha = createHash('sha256').update(rom).digest('hex');
  if (sha !== ROM_SHA256) throw new Error(`unexpected ROM ${sha}`);
}

// `[len:u16le][dest:u16le][payload]` records; a zero length ends the list.
export function readIplRecords(rom, at = IPL_DESCRIPTOR) {
  const records = []; let p = at;
  for (;;) {
    const n = rom[p] | (rom[p + 1] << 8), dest = rom[p + 2] | (rom[p + 3] << 8);
    records.push({ dest, payload: n ? rom.subarray(p + 4, p + 4 + n) : null });
    if (!n) break; p += 4 + n;
  }
  return records;
}
