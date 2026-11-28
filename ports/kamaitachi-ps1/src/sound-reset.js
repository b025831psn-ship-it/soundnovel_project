// The game's sound reset 0x80028ccc, ported: the game-side state (gp fields, the sound-effect
// buffer pointer, the driver's channel table, the bank ids at 0x801eef50) is written here at
// the original addresses; the sound library calls (libsnd / libspu) go through the sound
// bridge's lib(addr, args, sp): native on the oracle, the sound module or nothing in the browser.
//   0x80026358 channelsReset()   the six channels at 0x801d6240 (0x68 bytes each)
//   0x80028b10 loadBanks()       BIN member 1 to the work buffer, then up to five VAB banks
import { sound } from "./sound-bridge.js";
import { tickQuiet } from "./tick.js";
import { cdLoad } from "./cd-load.js";
import { pacMember } from "./screen/anim.js";
import { memcpy } from "./screen/weather.js";

const GP = 0x8007913c, BANKS = 0x801eef50;

export function channelsReset(m) { // 0x80026358
  for (let i = 0; i < 6; i++) m.write(0x801fd370 + 4 * i, 0xffff, 4);
  for (let i = 0; i < 6; i++) m.write(0x801f7338 + 2 * i, 0xffff, 2);
  for (let i = 0; i < 6; i++) {
    m.write(GP + 0x47c, i, 2);
    m.write(0x80079548 + i, 0, 1);
    const c = 0x801d6240 + 0x68 * i;
    m.write(GP + 0x344, c, 4);
    m.write(c, 0, 1); m.write(c + 1, 0, 1); m.write(c + 0x58, 0x4000, 4);
    for (const o of [2, 8, 0xc, 0xa, 0x50, 0x4c, 0x4e]) m.write(c + o, 0, 2);
    for (const o of [0x18, 0x20, 0x1c, 0x30, 0x38, 0x34, 0x54, 0x5c, 0x14, 0x10, 0x64, 0x60]) m.write(c + o, 0, 4);
    for (const o of [0x24, 0x2c, 0x28]) m.write(c + o, 0x7f00, 4);
    m.write(c + 0xe, 0x3000, 2); m.write(c + 4, 0xffff, 2); m.write(c + 6, 0xffff, 2);
  }
  m.write(GP + 0x47c, 6, 2);
  for (let i = 0; i < 0x100; i++) { m.write(0x801fc460 + i, 0, 1); m.write(0x801fd388 + i, 0, 1); }
}

export function* loadBanks(ctx) { // 0x80028b10
  const { m } = ctx, sp = ctx.sp - 0x38, sub = { ...ctx, sp }, snd = sound(ctx), lib = (a, args) => snd.lib(a, args, sp) | 0;
  const buf = () => m.read(0x80079484, 4) >>> 0;
  yield* cdLoad({ ...sub, sp: sp - 0x18 }, 0, buf(), 1); // 0x80036b6c
  for (let i = 0; i < 5; i++) {
    const slot = BANKS + 2 * i, was = (m.read(slot, 2) << 16) >> 16;
    if (was !== -1) continue;
    const head = pacMember(m, buf(), (2 * i) & 0xfffe), body = pacMember(m, buf(), 2 * i + 1), copy = 0x801f1d00 + 0xc80 * i;
    memcpy(m, head, copy, 0xc80);
    const addr = lib(0x8005fd48, [0x1010, ((m.read(head + 0xe, 2) << 16) + m.read(head + 0xc, 2) + 7) & ~7]); // SpuMalloc
    m.write(slot, lib(0x8005e188, [copy, -1, addr]), 2); // SsVabOpenHeadSticky
    if (((m.read(slot, 2) << 16) >> 16) === was) continue;
    m.write(GP + 0x7d, 1, 1);
    lib(0x8005e5b8, [body, (m.read(slot, 2) << 16) >> 16]); // SsVabTransBodyPartly
    lib(0x8005e678, [1]); // SsVabTransCompleted(SS_WAIT_COMPLETED)
    m.write(GP + 0x7d, 0, 1);
  }
}

export function* soundReset(ctx) { // 0x80028ccc
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp }, snd = sound(ctx), lib = (a, args = []) => snd.lib(a, args, sp);
  if (m.read(GP + 0x7b, 1) === 1) lib(0x80055d88); // SsEnd
  m.write(GP + 0x7b, 0, 1);
  for (let i = 0; i < 12; i++) m.write(BANKS + 2 * i, 0xffff, 2);
  lib(0x8005a728); lib(0x80055f28); lib(0x80058ec8, [0x801fc568, 0x10, 1]); lib(0x800590e8, [0x1000]); lib(0x800589a8); lib(0x800585b8, [0, 0, 1]);
  m.write(0x80079514, m.read(0x80079544, 4), 4);
  channelsReset(m);
  lib(0x8005e0a8, [0x11]);
  lib(m.read(0x800792c5, 1) ? 0x8005e098 : 0x8005e088); // stereo / mono
  m.write(GP + 0x7b, 1, 1); m.write(GP + 0x7c, 0, 1);
  for (let i = 0; i < 0x100; i++) m.write(0x801fd688 + i, 0xff, 1);
  for (const o of [0x414, 0x3c0, 0x340]) m.write(GP + o, 0, 4);
  m.write(GP + 0x80, 0xffff, 2); m.write(GP + 0x7e, 0xffff, 2); m.write(GP + 0x4a4, 0, 2); m.write(GP + 0x4b4, 0, 2);
  m.write(GP + 0x82, 0, 1); m.write(GP + 0x338, 0, 4); m.write(GP + 0x7d, 0, 1); m.write(GP + 0x30c, 0, 4);
  lib(0x8005a748); lib(0x800586c8, [0, 0]); lib(0x8005a5a8, [0, 0]); lib(0x80060ff8, [5]); lib(0x8005a6e8, [0]); lib(0x8005a638, [0]);
  yield* tickQuiet(sub);
  yield* loadBanks(sub);
  snd.reset?.(sp);
}
