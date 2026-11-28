// The game's file loaders, ported from 0x800369f8 (load and wait) and 0x80036ea0 (start a
// load that cdTick, ../cd.js, finishes). Files are members of the PAC archives: the table
// at 0x8006afe8 ({u16 pac, u32 file name}, ends with pac 8) names the archive, 0x8008dbb8
// ({u16 first, u16 count} by pac) points into 0x801f7530 ({u16 member, u16 sector}): a
// member's sectors run up to the next entry's. libcd goes through libcd(ctx) (../libcd.js).
// All of these are generators: they run frames (0x80035498 / 0x800354c4) while waiting.
//   0x80037084 cacheTake(pac, dst, member)  a finished background load of that member
//   0x80036460 cdReadFile(name, sector, count, dst)  read, then unpack "LZS" or "ike"
//   0x80036d04 cdStart(name, sector, count, dst)     start a read (gp[0x10c] = 1)
import { libcd } from "./libcd.js";
import { ike } from "./screen/ike.js";
import { maybeTick } from "./screen/picture.js";
import { memcpy } from "./screen/weather.js";
import { copyBytes } from "./cd.js";
import { waitText } from "./helpers.js";
import { tick, tickText } from "./tick.js";
import { textTask } from "./text/text.js";

const GP = 0x8007913c, PACS = 0x8006afe8, INDEX = 0x8008dbb8, MEMBERS = 0x801f7530, SLOTS = 0x801d58f8;
const SUFFIX = 0x80079240, WORK = 0x800794d8, WINDOW = 0x80079508, FILE = 0x801f7430, NAME = 0x8009ece8;
const POS = 0x80079408, MODE = 0x80079400;
const s16 = (v) => (v << 16) >> 16;
const unported = (addr) => { throw new Error(`cd-load: path at 0x${addr.toString(16)} is not ported`); };

function strcpy(m, dst, src) { let b; do { b = m.read(src++, 1); m.write(dst++, b, 1); } while (b); } // 0x800455e8
function strcat(m, dst, src) { while (m.read(dst, 1)) dst++; strcpy(m, dst, src); } // 0x800454c8

// 0x800354c4: a frame (text and tick) when 0x80079264 is set.
function* tickIf(ctx) {
  if (!ctx.m.read(0x80079264, 4)) return;
  const sub = { ...ctx, sp: ctx.sp - 0x18 };
  yield* textTask(sub);
  yield* tick(sub);
}

function findMember(m, pac, member, fatal) {
  member &= 0xffff;
  for (let e = PACS; m.read(e, 2) !== 8; e += 8) {
    if (m.read(e, 2) !== pac) continue;
    const first = m.read(INDEX + 4 * pac, 2), count = m.read(INDEX + 4 * pac + 2, 2);
    for (let k = 0, a = MEMBERS + 4 * first; k < count - 1; k++, a += 4)
      if (m.read(a, 2) === member) { const off = m.read(a + 2, 2); return { name: m.read(e + 4, 4) >>> 0, off, len: (m.read(a + 6, 2) - off) & 0xffff }; }
    unported(fatal); // "not in the archive" message
  }
  unported(fatal + 0x40); // unknown archive
}

export function* cacheTake(ctx, pac, dst, member) { // 0x80037084
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x28 }, r32 = (a) => m.read(a, 4) >>> 0;
  if ((m.read(GP + 0x118, 4) | 0) === (pac | 0) && s16(m.read(GP + 0x11c, 2)) === (member & 0xffff)) unported(0x800370ac);
  const slot = SLOTS;
  if ((m.read(slot + 8, 4) | 0) !== (pac | 0) || s16(m.read(slot + 0xc, 2)) !== (member & 0xffff)) return 0;
  if (m.read(slot, 1) === 1) while (m.read(GP + 0x10c, 1)) yield* tickText(sub, 1);
  if (r32(slot + 4) !== dst >>> 0) {
    yield* tickIf(sub);
    memcpy(m, r32(slot + 4), dst >>> 0, r32(slot + 0x10));
    yield* tickIf(sub);
  }
  const size = r32(slot + 0x10);
  m.write(slot, 0, 1); m.write(slot + 0xc, 0xffff, 2); m.write(slot + 8, 0xffffffff, 4);
  return size;
}

export function* cdReadFile(ctx, name, off, len, dst) { // 0x80036460
  const { m } = ctx, sp = ctx.sp - 0xa0, sub = { ...ctx, sp }, cd = libcd(sub), r32 = (a) => m.read(a, 4) >>> 0;
  dst >>>= 0; len &= 0xffff;
  const fp = sp + 0x18, pos = sp + 0x10, result = sp + 0x30, mode = sp + 0x78, path = sp + 0x38;
  strcpy(m, path, name); strcat(m, path, SUFFIX);
  yield* maybeTick(sub);
  let r;
  do {
    m.write(0x80079270, 0, 4);
    for (;;) { r = cd.CdSearchFile(fp, path) | 0; if (r !== 0 && r !== -1) break; yield* maybeTick(sub); }
    for (let i = 0; i < 3; i++) m.write(pos + i, m.read(fp + i, 1), 1);
    yield* maybeTick(sub);
    cd.CdIntToPos((cd.CdPosToInt(pos) + (off & 0xffff)) | 0, pos);
    if (len !== 0xffff) m.write(fp + 4, len << 11, 4);
    if (r32(fp + 4) > 0x40000) unported(0x8003654c); // read in pieces
    for (;;) {
      yield* maybeTick(sub);
      m.write(mode, 0x80, 1);
      if (!cd.CdControlB(0xe, mode, 0)) continue;
      if (!cd.CdControl(2, pos, 0)) continue;
      if (!cd.CdRead((r32(fp + 4) + 0x7ff) >>> 11, dst, 0x80)) continue;
      break;
    }
    do { yield* maybeTick(sub); r = cd.CdReadSync(1, result) | 0; } while (r !== 0 && r !== -1);
    yield* maybeTick(sub);
  } while (r === -1);
  const b = (i) => m.read(dst + i, 1);
  if (b(0) === 0x4c && b(1) === 0x5a && b(2) === 0x53) { // "LZS": LZSS, 4 KB window of spaces
    const work = r32(WORK), win = r32(WINDOW);
    copyBytes(m, dst + 3, work, r32(fp + 4) - 3);
    yield* maybeTick(sub);
    for (let i = 0; i < 0xfee; i++) m.write(win + i, 0x20, 1);
    let left = r32(fp + 4) - 3, src = work, out = dst, w = 0xfee;
    const put = (v) => { m.write(win + w, v, 1); w = (w + 1) & 0xfff; m.write(out++, v, 1); };
    lzs: for (;;) {
      const f = m.read(src, 1); if (--left < 0) break; src++;
      for (let flags = f | 0xff00; flags & 0x100; flags >>>= 1) {
        if (flags & 1) { const v = m.read(src, 1); if (--left < 0) break lzs; src++; put(v); continue; }
        const b0 = m.read(src++, 1), b1 = m.read(src++, 1); left -= 2;
        if (left < 0) break lzs;
        const at = b0 | (b1 & 0xf0) << 4, n = (b1 & 0xf) + 2;
        for (let k = 0; k <= n; k++) put(m.read(win + ((at + k) & 0xfff), 1));
      }
    }
    yield* maybeTick(sub);
  } else if (b(2) === 0x69 && b(3) === 0x6b && b(4) === 0x65) { // "ike"
    if (r32(fp + 4) > 0x137ff) unported(0x8003684c);
    copyBytes(m, dst, r32(WORK), r32(fp + 4));
    yield* maybeTick(sub);
    m.write(fp + 4, ike(m, r32(WORK), dst), 4);
    yield* maybeTick(sub);
  }
  return r32(fp + 4);
}

export function* cdLoad(ctx, pac, dst, member) { // 0x800369f8
  const sub = { ...ctx, sp: ctx.sp - 0x38 };
  member &= 0xffff;
  const hit = yield* cacheTake(sub, pac, dst, member);
  if (hit !== 0) return hit;
  yield* waitText(sub);
  const f = findMember(ctx.m, pac, member, 0x80036ae0);
  return yield* cdReadFile(sub, f.name, f.off, f.len, dst);
}

export function* cdStart(ctx, name, off, len, dst) { // 0x80036d04
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x28 }, cd = libcd(sub), r32 = (a) => m.read(a, 4) >>> 0;
  const set = (r) => { m.write(GP + 0x2d4, r, 4); return r; };
  m.write(GP + 0x404, off, 2); m.write(GP + 0x2f6, len, 2); m.write(GP + 0x2f0, dst >>> 0, 4);
  strcpy(m, NAME, name); strcat(m, NAME, SUFFIX);
  yield* tickIf(sub);
  for (;;) { const r = set(cd.CdSearchFile(FILE, NAME) | 0); if (r !== 0 && r !== -1) break; yield* tickIf(sub); }
  for (let i = 0; i < 3; i++) m.write(POS + i, m.read(FILE + i, 1), 1);
  yield* tickIf(sub);
  cd.CdIntToPos((cd.CdPosToInt(POS) + (off & 0xffff)) | 0, POS);
  if ((len & 0xffff) !== 0xffff) m.write(FILE + 4, (len & 0xffff) << 11, 4);
  for (;;) {
    yield* tickIf(sub);
    m.write(MODE + m.read(GP + 0x114, 2), 0x80, 1);
    if (!set(cd.CdControlB(0xe, MODE, 0))) continue;
    if (!set(cd.CdControl(2, POS, 0))) continue;
    if (!set(cd.CdRead((r32(FILE + 4) + 0x7ff) >>> 11, r32(GP + 0x2f0), r32(GP + 0x110)))) continue;
    break;
  }
  m.write(GP + 0x10c, 1, 1);
}

export function* cdLoadAsync(ctx, pac, dst, member) { // 0x80036ea0
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x40 };
  const f = findMember(m, pac, member, 0x80036f78);
  yield* cdStart(sub, f.name, f.off, f.len, dst);
  const k = m.read(GP + 0x114, 2);
  m.write(SLOTS + 20 * k, 1, 1);
  m.write(GP + 0x114, 0, 2);
  m.write(SLOTS + 20 * k + 8, pac, 4); m.write(SLOTS + 20 * k + 0xc, member, 2);
}
