export function normalizeRom(bytes) {
  const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return raw.length % 0x8000 === 512 ? raw.subarray(512) : raw;
}

// LoROM maps each bank's $8000-$FFFF window to a consecutive 32 KiB ROM page.
export function loRomOffset(address, romLength) {
  const bank = (address >>> 16) & 0xff;
  const word = address & 0xffff;
  if (word < 0x8000) return null;
  const offset = (((bank & 0x7f) << 15) | (word & 0x7fff)) % romLength;
  return offset;
}
