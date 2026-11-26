// The game's asynchronous file load, ported from the per-frame routine 0x80036bd4.
// While gp[0x10c] is set a CdRead is in flight; when libcd's CdReadSync(1) reports it done
// (0 or -1), an "ike"-compressed file is copied to the work buffer (0x800794d8) and unpacked
// back into place (0x800356c8), and the load slot (0x801d58f8 + 20·gp[0x114]) is marked
// loaded {state 2, address, size}.
//   libcd's CdReadSync goes through libcd(ctx) (libcd.js).
import { libcd } from "./libcd.js";
import { ike } from "./screen/ike.js";

const GP = 0x8007913c, RESULT = 0x80079420, WORK = 0x800794d8, FILE = 0x801f7430, SLOTS = 0x801d58f8;
const unported = (addr) => { throw new Error(`cd: path at 0x${addr.toString(16)} is not ported`); };

export function copyBytes(m, src, dst, n) { // 0x80045448
  if (!src) return 0;
  for (let i = 0; i < n; i++) m.write(dst + i, m.read(src + i, 1), 1);
  return src;
}

export function cdTick(ctx) {
  const { m } = ctx, r32 = (a) => m.read(a, 4) >>> 0, w32 = (a, v) => m.write(a, v >>> 0, 4);
  if (!m.read(GP + 0x10c, 1)) return;
  const r = libcd({ ...ctx, sp: ctx.sp - 0x18 }).CdReadSync(1, RESULT) | 0;
  w32(GP + 0x2d4, r);
  if (r !== 0 && r !== -1) return;
  const buf = r32(GP + 0x2f0);
  if (m.read(buf + 2, 1) === 0x69 && m.read(buf + 3, 1) === 0x6b && m.read(buf + 4, 1) === 0x65) { // "ike"
    if (r32(FILE + 4) > 0x137ff) unported(0x80036c8c); // too big for the work buffer: error message
    copyBytes(m, buf, r32(WORK), r32(FILE + 4));
    w32(FILE + 4, ike(m, r32(WORK), r32(GP + 0x2f0)));
  }
  const slot = SLOTS + 20 * m.read(GP + 0x114, 2);
  m.write(slot, 2, 1);
  w32(slot + 4, r32(GP + 0x2f0));
  const size = r32(FILE + 4);
  m.write(GP + 0x10c, 0, 1);
  w32(slot + 0x10, size); w32(GP + 0x120, size);
}
