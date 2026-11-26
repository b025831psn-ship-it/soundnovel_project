// The picture animation player, 0x8003dbe0 (per frame): three channels, each running a
// script of {u8 op, u8 frames} pairs. op >= 0 shows member `op` of the PAC at gp[0x3bc]
// (unpacked by 0x800360b8 into the buffer at 0x800794d8, then put on screen by 0x8003b19c
// at the channel's x/y) and waits `frames`. Negative ops: -1 end, -2 restart, -4 jump by
// frames/2 pairs, -5 end with a hand-off to the text side, -6 (not ported).
// When a channel ends, its kind (0x80079416) decides what follows: 1 / 2 run
// 0x8001db2c dropLayer(2 / 3), 0 dropPicture(5) (0x8001fd1c) unless 0x800792c1 is set.
//   0x80044e50 pacMember(pac, i): address of member i (big-endian offsets after the count)
import { loadPicture } from "./picture.js";
import { windowPalette } from "./fader.js";
import { dropLayer, dropPicture } from "../helpers.js";

const GP = 0x8007913c, FRAME_STEP = 0x80079278, AUTO = 0x800792c6, AUTO_HOLD = 0x8007928e;
const OFF = 0x80079283, ACTIVE = 0x80079530, OP = 0x8007950c, SCRIPT = 0x801fdfc8, PC = 0x8007949a, WAIT = 0x80079436;
const KIND = 0x80079416, BUF = 0x800794d8, X = 0x80079494, Y = 0x800794a0, LAYERS = 0x801fe058;
const HANDOFF = 0x800792be, HANDOFF2 = 0x800792bf, NO_NEXT = 0x800792c1, TEXT_ON = 0x80079284, H1 = 0x80079450, H2 = 0x80079618;
const unported = (addr) => { throw new Error(`anim: path at 0x${addr.toString(16)} is not ported`); };
const s8 = (v) => (v << 24) >> 24;
const bswap = (v) => ((v & 0xff) << 24 | (v & 0xff00) << 8 | (v >>> 8) & 0xff00 | v >>> 24) >>> 0;

export function pacMember(m, pac, i) { return (pac + bswap(m.read(pac + 8 * (i & 0xffff) + 4, 4) >>> 0)) >>> 0; }

export function animTick(ctx) {
  const { m } = ctx, r8 = (a) => m.read(a, 1), w8 = (a, v) => m.write(a, v & 0xff, 1), r16 = (a) => m.read(a, 2), r32 = (a) => m.read(a, 4) >>> 0;
  if (r8(OFF) === 1) return;
  const sp = ctx.sp - 0x38, call = (addr, args) => ctx.call(addr, args, sp);
  const pair = (i) => r32(SCRIPT + 4 * i) + 2 * s8(r8(PC + i));
  for (let i = 0; i < 3; i++) {
    if (r8(ACTIVE + i) !== 1) continue;
    if (r8(AUTO) === 1) w8(AUTO_HOLD, 1);
    if (s8(r8(WAIT + i)) > 0) { w8(WAIT + i, r8(WAIT + i) - 1); continue; }
    w8(OP + i, r8(pair(i)));
    if (s8(r8(OP + i)) === -5) {
      for (let j = 0; j < 4; j++) { m.write(H1 + 2 * j, 0xffff, 2); m.write(H2 + 2 * j, 0xffff, 2); }
      w8(TEXT_ON, 1);
      m.write(H1, (s8(r8(HANDOFF)) + 0x320) & 0xffff, 2);
      w8(OP + i, -1); w8(HANDOFF, -1); w8(HANDOFF2, -1); w8(NO_NEXT, 1);
    }
    const op = () => s8(r8(OP + i));
    if (op() === -6) unported(0x8003dd80);
    if (op() === -4) { w8(PC + i, r8(PC + i) + (s8(r8(pair(i) + 1)) >> 1)); w8(OP + i, r8(pair(i))); }
    if (op() === -2) { w8(PC + i, 0); w8(OP + i, r8(r32(SCRIPT + 4 * i))); }
    if (op() === -1) {
      w8(HANDOFF, -1); w8(ACTIVE + i, 0);
      const k = r8(KIND + i);
      if (k === 1) dropLayer(m, 2);
      else if (k === 2) dropLayer(m, 3);
      else if (k === 0 && !r8(NO_NEXT)) dropPicture(m, 5);
      for (let j = 0; j < 3; j++) w8(ACTIVE + j, 0);
      for (let j = 0; j < 3; j++) { const p = LAYERS + 8 * j; m.write(p, 0, 2); w8(p + 2, 0); m.write(p + 4, 0, 2); m.write(p + 6, 0, 2); }
      w8(HANDOFF, -1);
      continue;
    }
    w8(WAIT + i, r8(pair(i) + 1));
    call(0x800360b8, [pacMember(m, r32(GP + 0x3bc), s8(r8(OP + i))), r32(BUF)]);
    const k = r8(KIND + i), at = [r32(BUF), r16(X + 2 * i), r16(Y + 2 * i)];
    const sub = { ...ctx, sp };
    if (k === 1) loadPicture(sub, 0xb, ...at);
    else if (k === 2) loadPicture(sub, 0x15, ...at);
    else if (k === 0) { loadPicture(sub, 0x18, ...at); windowPalette(sub); }
    w8(PC + i, r8(PC + i) + 1);
    w8(WAIT + i, r8(WAIT + i) - r8(FRAME_STEP));
  }
}
