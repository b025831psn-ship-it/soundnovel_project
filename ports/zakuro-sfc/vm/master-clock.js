export const SCANLINE_MASTER_CYCLES = 1364;
export const FRAME_MASTER_CYCLES = 357368;
export const VBLANK_START_MASTER = 225 * SCANLINE_MASTER_CYCLES;
export const SHORT_FIELD_MASTER_CYCLES = FRAME_MASTER_CYCLES - 4;
const FIELD_PAIR_MASTER_CYCLES = FRAME_MASTER_CYCLES + SHORT_FIELD_MASTER_CYCLES;

export function vblankBoundary(index) {
  const pair = Math.floor(index / 2);
  return VBLANK_START_MASTER + pair * FIELD_PAIR_MASTER_CYCLES + (index & 1 ? FRAME_MASTER_CYCLES : 0);
}

export function vblankOrdinal(master) {
  if (master < VBLANK_START_MASTER) return -1;
  const pair = Math.floor((master - VBLANK_START_MASTER) / FIELD_PAIR_MASTER_CYCLES);
  return master >= vblankBoundary(pair * 2 + 1) ? pair * 2 + 1 : pair * 2;
}

export function inVblank(master) {
  const index = vblankOrdinal(master);
  if (index < 0) return false;
  const fieldLength = index & 1 ? SHORT_FIELD_MASTER_CYCLES : FRAME_MASTER_CYCLES;
  return master - vblankBoundary(index) >= 0 && master - vblankBoundary(index) < fieldLength - VBLANK_START_MASTER;
}

export function inAutoJoypadRead(master) {
  const index = vblankOrdinal(master);
  return index >= 0 && master - vblankBoundary(index) < 3 * SCANLINE_MASTER_CYCLES;
}

export function scanlineTiming(master) {
  const pair = Math.floor(master / FIELD_PAIR_MASTER_CYCLES);
  const pairOffset = master - pair * FIELD_PAIR_MASTER_CYCLES;
  const oddField = pairOffset >= FRAME_MASTER_CYCLES;
  const fieldOffset = oddField ? pairOffset - FRAME_MASTER_CYCLES : pairOffset;
  let line, lineStart, completedNormalLines;
  const shortLineStart = 240 * SCANLINE_MASTER_CYCLES;
  if (!oddField || fieldOffset < shortLineStart) {
    line = Math.floor(fieldOffset / SCANLINE_MASTER_CYCLES);
    lineStart = fieldOffset - (fieldOffset % SCANLINE_MASTER_CYCLES);
    completedNormalLines = line;
  } else if (fieldOffset < shortLineStart + SCANLINE_MASTER_CYCLES - 4) {
    line = 240; lineStart = shortLineStart; completedNormalLines = 240;
  } else {
    const afterShort = fieldOffset - (shortLineStart + SCANLINE_MASTER_CYCLES - 4);
    line = 241 + Math.floor(afterShort / SCANLINE_MASTER_CYCLES);
    lineStart = shortLineStart + SCANLINE_MASTER_CYCLES - 4
      + Math.floor(afterShort / SCANLINE_MASTER_CYCLES) * SCANLINE_MASTER_CYCLES;
    completedNormalLines = line - 1;
  }
  const fieldStart = pair * FIELD_PAIR_MASTER_CYCLES + (oddField ? FRAME_MASTER_CYCLES : 0);
  const normalLinesBefore = pair * 523 + (oddField ? 262 : 0) + completedNormalLines;
  return {
    field: pair * 2 + (oddField ? 1 : 0), line,
    start: fieldStart + lineStart,
    length: oddField && line === 240 ? SCANLINE_MASTER_CYCLES - 4 : SCANLINE_MASTER_CYCLES,
    refresh: 538 - ((normalLinesBefore & 1) ? 4 : 0),
  };
}

function nextRefreshAfter(master) {
  let timing = scanlineTiming(master);
  let refresh = timing.start + timing.refresh;
  if (refresh <= master) {
    timing = scanlineTiming(timing.start + timing.length);
    refresh = timing.start + timing.refresh;
  }
  return refresh;
}
export function accessCycles(address, fastRom = false) {
  const a = address & 0xffffff, bank = a >>> 16, offset = a & 0xffff;
  if ((bank & 0x40) === 0 && offset < 0x2000) return 8;
  if ((bank & 0x40) === 0 && offset >= 0x2000 && offset < 0x4000) return 6;
  if ((bank & 0x40) === 0 && offset >= 0x4000 && offset < 0x4200) return 12;
  if ((bank & 0x40) === 0 && offset >= 0x4200 && offset < 0x6000) return 6;
  if (bank === 0x7e || bank === 0x7f) return 8;
  if (offset >= 0x8000 && fastRom && (bank & 0x80)) return 6;
  return 8;
}

export class MasterClock {
  constructor(master = 0, { refresh = true } = {}) { this.master = master; this.refresh = refresh; }
  advance(count) {
    let target = this.master + count;
    if (this.refresh) {
      // S-CPU DRAM refresh steals 40 master clocks once per 1364-clock scanline,
      // at alternating H=538/H=534. Odd-field V=240 is four clocks short and
      // does not toggle the refresh phase. A steal can cross another boundary.
      for (;;) {
        const next = nextRefreshAfter(this.master);
        if (next > target) break;
        target += 40; this.master = next;
      }
    }
    this.master = target;
    return this.master;
  }
  charge(address, fastRom = false) { return this.advance(accessCycles(address, fastRom)); }
  idle(count) {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('invalid master-cycle count');
    this.advance(count);
  }
}
