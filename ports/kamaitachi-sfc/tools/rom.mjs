// Owned-ROM helpers for the SFC sound driver. The ROM itself is never committed.
import { createHash } from 'node:crypto';
import { readIplRecords as readRecords } from '../sound/ipl.js';
export const ROM_SHA256 = '3228a3b35f7d234a7bf91f8159ccc56518199222e84d258c14a153f54f9fcbc7';
export const IPL_DESCRIPTOR = 0x3a3f; // CPU $00:BA3F

export function checkRom(rom) {
  const sha = createHash('sha256').update(rom).digest('hex');
  if (sha !== ROM_SHA256) throw new Error(`unexpected ROM ${sha}`);
}

export const readIplRecords = (rom, at = IPL_DESCRIPTOR) => readRecords(rom, at);
