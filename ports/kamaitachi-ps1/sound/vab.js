// Sony VAB sound bank: header ("pBAV"), 128 program slots, 16 tone attributes per
// program actually present, the VAG size table, then the VAG body (SPU ADPCM).
// Layout follows libsnd's VabHdr / ProgAtr / VagAtr structures.
const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const s16 = (b, o) => (u16(b, o) << 16) >> 16;
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

export function parseVabHead(bytes, offset = 0) {
  if (String.fromCharCode(...bytes.subarray(offset, offset + 4)) !== "pBAV") throw new Error("not a VAB header");
  const h = {
    version: u32(bytes, offset + 4), id: u32(bytes, offset + 8), size: u32(bytes, offset + 12),
    programCount: u16(bytes, offset + 18), toneCount: u16(bytes, offset + 20), vagCount: u16(bytes, offset + 22),
    volume: bytes[offset + 24], pan: bytes[offset + 25], attr1: bytes[offset + 26], attr2: bytes[offset + 27],
  };
  let at = offset + 32;
  const programs = [];
  for (let p = 0; p < 128; p++, at += 16) {
    programs.push({ tones: bytes[at], volume: bytes[at + 1], priority: bytes[at + 2], mode: bytes[at + 3],
      pan: bytes[at + 4], attr: u16(bytes, at + 6) });
  }
  // Tone blocks exist for each program that has tones, in program order, 16 slots each.
  const tones = [];
  for (let p = 0; p < 128 && tones.length < h.programCount * 16; p++) {
    if (!programs[p].tones) continue;
    const list = [];
    for (let t = 0; t < 16; t++, at += 32) {
      list.push({ priority: bytes[at], mode: bytes[at + 1], volume: bytes[at + 2], pan: bytes[at + 3],
        center: bytes[at + 4], shift: bytes[at + 5], min: bytes[at + 6], max: bytes[at + 7],
        vibW: bytes[at + 8], vibT: bytes[at + 9], porW: bytes[at + 10], porT: bytes[at + 11],
        pbmin: bytes[at + 12], pbmax: bytes[at + 13], adsr1: u16(bytes, at + 16), adsr2: u16(bytes, at + 18),
        program: s16(bytes, at + 20), vag: s16(bytes, at + 22) });
    }
    programs[p].toneList = list.slice(0, programs[p].tones);
    tones.push(...list);
  }
  // VAG size table: 256 u16 entries, each size >> 3; entry 0 is unused.
  const vagSizes = [];
  for (let v = 0; v < 256; v++) vagSizes.push(u16(bytes, at + v * 2) << 3);
  at += 512;
  const vagOffsets = [];
  let body = 0;
  for (let v = 1; v <= h.vagCount; v++) { vagOffsets[v] = body; body += vagSizes[v]; }
  return { ...h, programs, tones, vagSizes: vagSizes.slice(0, h.vagCount + 1), vagOffsets, headSize: at - offset, bodySize: body };
}
