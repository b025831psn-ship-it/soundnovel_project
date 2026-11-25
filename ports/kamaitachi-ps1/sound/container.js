// Sound containers inside MUS.PAC / VCE.PAC members, and the sound tables in SLPS_017.94.
// Readers only; callers pass bytes from the user's own disc.

const be32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

// VCE.PAC member: BE {count, (offset, size) x count}; read by 0x80044e50 (offset) and
// 0x80044e90 (size). Part 0 = VAB head, part 1 = VAB body, part 2 = effect script.
export function vceParts(bytes) {
  const count = be32(bytes, 0);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const offset = be32(bytes, 4 + 8 * i), size = be32(bytes, 8 + 8 * i);
    parts.push({ offset, size, bytes: bytes.subarray(offset, offset + size) });
  }
  return { head: parts[0], body: parts[1], script: parts[2], parts };
}

// MUS.PAC member: BE {vabHead, vabBody, seq} offsets, read by 0x800284b0 via 0x80044de8.
export function musParts(bytes) {
  return { vabHead: be32(bytes, 0), vabBody: be32(bytes, 4), seq: be32(bytes, 8) };
}

// PS-X EXE: load address at 0x18, text at file offset 0x800.
export function exeReader(exe) {
  const base = (exe[0x18] | (exe[0x19] << 8) | (exe[0x1a] << 16) | (exe[0x1b] << 24)) >>> 0;
  const at = (addr) => 0x800 + (addr - base);
  return {
    u8: (a) => exe[at(a)],
    u16: (a) => exe[at(a)] | (exe[at(a) + 1] << 8),
    u32: (a) => (exe[at(a)] | (exe[at(a) + 1] << 8) | (exe[at(a) + 2] << 16) | (exe[at(a) + 3] << 24)) >>> 0,
    bytes: (a, n) => exe.subarray(at(a), at(a) + n),
  };
}

export const SONG_COUNT = 88; // (0x8006a7c4 - 0x8006a714) / 2

// Game sound tables (data, not code): read at startup from the user's EXE.
export function readSoundTables(exe) {
  const r = exeReader(exe);
  const songs = [];
  for (let i = 0; i < SONG_COUNT; i++) {
    songs.push({
      reverbType: r.u8(0x8006a714 + 2 * i), // 0x800284b0: SsUtSetReverbType(table[0])
      reverbDepth: r.u8(0x8006a715 + 2 * i), // SsUtSetReverbDepth(table[1], table[1])
      duration: r.u16(0x8006a7c4 + 4 * i), // frames until auto stop, 0xffff = none (gp+0x4b4)
      loops: r.u16(0x8006a7c6 + 4 * i), // SsSeqPlay l_count
      volume: r.u32(0x8006a924 + 4 * i), // gp+0x30c target = volume * 90
    });
  }
  // 0x800292b0: ids < 88 jump through 0x800119e0; entries that go to 0x80029360 stop the music.
  const musicSilence = [];
  for (let i = 0; i < SONG_COUNT; i++) if (r.u32(0x800119e0 + 4 * i) === 0x80029360) musicSilence.push(i);
  // Effect tables indexed by (id - 1000) % 1000, 2 bytes each (read past their end as the game does).
  const effects = [];
  for (let n = 0; n < 1000; n++) {
    effects.push({ restart: r.u8(0x8006b04c + 2 * n), pairMode: r.u8(0x8006b1cc + 2 * n), partner: r.u8(0x8006b1cd + 2 * n) });
  }
  return { panLaw: Uint8Array.from(r.bytes(0x8006aa84, 64)), songs, musicSilence, effects };
}
