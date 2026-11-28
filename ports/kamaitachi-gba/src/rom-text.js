// Fixed strings the native screens print, read at their cartridge addresses from kgk
// ui/system-text.bin (ROM 0x19400..0x1C000). The port's literals are the Japanese bytes at those
// addresses; a translated ROM that rewrote the strings in place brings its own text along.
export const SYSTEM_TEXT_BASE = 0x19400;

// The bytes at ROM `address` up to the terminating 0, or null when the blob does not cover it.
export function romString(blob, address) {
  const at = address - SYSTEM_TEXT_BASE;
  if (!blob || at < 0 || at >= blob.length) return null;
  const end = blob.indexOf(0, at);
  return Array.from(blob.subarray(at, end < 0 ? blob.length : end));
}

// Replaces the contents of `target` (kept as the same array) with the string at `address`.
export function adoptRomString(target, blob, address) {
  const bytes = romString(blob, address);
  if (bytes && bytes.length) target.splice(0, target.length, ...bytes);
}
