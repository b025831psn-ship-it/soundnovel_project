// Shared helpers of the scenario handlers (RAM level, original addresses).
//   0x80044dd0 swap16          0x8001bfb8 resolveLabel(table, label): loads SCE resource
//   label/1000 if it is not the current one, returns its offset of entry label%1000
//   0x8003276c checkpoint()   snapshot of the display state for the jump targets
//   0x8003cf28 animStop()     0x800390ec textStart(p)
import { cdLoad } from "../cd-load.js";
export const GP = 0x8007913c, CURSOR = 0x80079578, BASE = 0x8007948c, RESOURCE = 0x8007929c;
export const unported = (addr) => { throw new Error(`scenario: path at 0x${addr.toString(16)} is not ported`); };
export const s8 = (v) => (v << 24) >> 24, s16 = (v) => (v << 16) >> 16;
export const swap16 = (v) => ((v & 0xffff) >>> 8 | v << 8) & 0xffff;

export function io(m) {
  return {
    r8: (a) => m.read(a, 1), r16: (a) => m.read(a, 2), r32: (a) => m.read(a, 4) >>> 0,
    w8: (a, v) => m.write(a, v & 0xff, 1), w16: (a, v) => m.write(a, v & 0xffff, 2), w32: (a, v) => m.write(a, v >>> 0, 4),
    g8: (o) => m.read(GP + o, 1), p8: (o, v) => m.write(GP + o, v & 0xff, 1),
  };
}
// Operand readers: the cursor advances past what is read.
export function operand(m) {
  const { r8, r32, w32 } = io(m);
  return {
    u8() { const p = r32(CURSOR); w32(CURSOR, p + 1); return r8(p); },
    u16() { const p = r32(CURSOR); w32(CURSOR, p + 2); return swap16(r8(p) << 8 | r8(p + 1)); }, // little-endian word
    skip(n) { w32(CURSOR, r32(CURSOR) + n); },
  };
}

export function animStop(m) { // 0x8003cf28
  for (let i = 0; i < 3; i++) m.write(0x80079530 + i, 0, 1);
  for (let i = 0; i < 3; i++) { const p = 0x801fe058 + 8 * i; m.write(p, 0, 2); m.write(p + 2, 0, 1); m.write(p + 4, 0, 2); m.write(p + 6, 0, 2); }
  m.write(0x800792be, 0xff, 1);
}

export function textStart(m, p) { // 0x800390ec
  const i = m.read(0x800792a7, 1);
  m.write(0x800794c0 + 4 * i, p >>> 0, 4); m.write(0x8007951a + i, 0, 1);
}

// The resource switch shared by resolveLabel and the call command: a resource kept in
// memory (gp[2] = 1 and gp[0x45c]) or resource 31 (in the EXE) are copied, others loaded.
export function switchResource(ctx, res, at) {
  const { m } = ctx, { r32, g8, p8 } = io(m), base = r32(BASE);
  if (g8(2) === 1 && s8(g8(0x45c)) === res) unported(at); // copy from 0x80079544 + 0x28000
  else if (res === 0x1f) unported(at + 0x34); // copy from 0x800677e8
  else { p8(4, 1); return true; }
  return false;
}

export function* resolveLabel(ctx, table, label) { // 0x8001bfb8
  const { m } = ctx, { r16, r32, w8, w16, g8, p8 } = io(m), sp = ctx.sp - 0x28;
  label &= 0xffff;
  p8(0x330, Math.trunc(label / 1000));
  const res = g8(0x330);
  if (r16(RESOURCE) !== res) {
    const base = r32(BASE);
    if (g8(2) === 1 && s8(g8(0x45c)) === res) unported(0x8001c034);
    else if (res === 0x1f) unported(0x8001c068);
    p8(4, 1);
    animStop(m);
    yield* cdLoad({ ...ctx, sp }, 2, base, res);
    p8(4, 0);
    w16(RESOURCE, res);
  }
  return r16(table + 2 * (label % 1000));
}

export function checkpoint(m) { // 0x8003276c
  const { r8, r16, w8, w16 } = io(m);
  for (let i = 0; i < 4; i++) w16(0x801f7320 + 2 * i, r16(0x801fec68 + 2 * i));
  for (let i = 0; i < 4; i++) w16(0x80079618 + 2 * i, r16(0x80079450 + 2 * i));
  for (let i = 0; i < 3; i++) {
    const a = 0x801fe058 + 8 * i, b = 0x801f7300 + 8 * i;
    w16(b, r16(a)); w8(b + 2, r8(a + 2)); w16(b + 4, r16(a + 4)); w16(b + 6, r16(a + 6));
  }
  const t1 = r8(0x800792b3);
  w8(0x800792b2, t1); w8(0x800792c0, r8(0x800792c1)); w8(0x800792bf, r8(0x800792be)); w16(0x80079292, r16(0x80079290));
  w8(0x800792ab, r8(0x800792ac)); w8(0x800792ad, r8(0x800792ae)); w8(0x800792b9, r8(0x800792ba)); w8(0x800792b3, t1);
  for (let i = 0; i < 6; i++) {
    const v = r16(0x801d6240 + 0x68 * i + 6);
    w16(0x801d55f0 + 2 * i, v); w8(0x800794e8 + i, r8(0x801fc460 + s16(v)));
  }
  w16(0x800795c0, r16(0x800792b4)); w8(0x80079600, r8(0x800792a1)); w16(0x80079458, r16(RESOURCE));
}
