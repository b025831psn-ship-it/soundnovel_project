// The game's start-up, ported from 0x80014314 up to its loop head 0x8001443c (main-loop.js):
// library and buffer set-up, graphics, the PAC index, sound, the logo movie, the built-in
// first scenario (resource 0x1f), the title picture, then the first SCE resource.
// Callees that are not ported yet run through ctx.call (on the oracle: native).
// ctx.sp is the caller's sp (the routine's own frame is ctx.sp - 0x18).
import { memcpy } from "./screen/weather.js";
import { fadeIn, fadeOut } from "./screen/fader.js";
import { spriteClearAll } from "./screen/sprites.js";
import { effect } from "./screen/weather.js";
import { dropLayer, textWindowReset, resetStream } from "./helpers.js";
import { checkpoint, animStop } from "./scenario/lib.js";
import { sceneReset } from "./scenario/state.js";
import { cdReadFile, cdLoad } from "./cd-load.js";
import { sound } from "./sound-bridge.js";
import { soundReset } from "./sound-reset.js";
import { libcd } from "./libcd.js";
import { tickQuiet } from "./tick.js";
import { loadPicture } from "./screen/picture.js";
import { spritePage } from "./screen/sprites.js";

const GP = 0x8007913c, BASE = 0x8007948c, RESOURCE = 0x8007929c, CURSOR = 0x80079578, CURSOR2 = 0x8007940c;
const PACS = 0x8006afe8, INDEX = 0x8008dbb8, MEMBERS = 0x801f7530, PAGE = 0x800792ca;
const unported = (addr) => { throw new Error(`init: path at 0x${addr.toString(16)} is not ported`); };
const io = (m) => ({ r8: (a) => m.read(a, 1), r16: (a) => m.read(a, 2), r32: (a) => m.read(a, 4) >>> 0,
  w8: (a, v) => m.write(a, v & 0xff, 1), w16: (a, v) => m.write(a, v & 0xffff, 2), w32: (a, v) => m.write(a, v >>> 0, 4) });

export function crtInit(m) { if (!m.read(0x80079020, 4)) m.write(0x80079020, 1, 4); } // 0x80062380 (no constructors)

export function bufferInit(m) { // 0x80037250: work buffer addresses
  for (const [o, v] of [[0x354, 0x800d39bc], [0x348, 0x801091c0], [0x39c, 0x801311c4], [0x3cc, 0x801449c8], [0x350, 0x800c89b8], [0x304, 0x801729cc], [0x408, 0x801855d0]])
    m.write(GP + o, v >>> 0, 4);
}

export function bufferAliases(m) { // 0x800340d4
  const { r32, w32 } = io(m), pic = r32(0x80079544), a = r32(0x80079440), win = r32(0x80079508);
  w32(GP + 0x458, a); w32(GP + 0x3a0, pic); w32(GP + 0x3a4, pic + 0x28000);
  w32(GP + 0x394, win); w32(GP + 0x398, win + 0xf000); w32(GP + 0x498, r32(0x800794d8));
}

export function textSlotReset(m, w) { // 0x80038f80(window)
  const { w8, w16, w32 } = io(m);
  w &= 0xff;
  w16(0x800794b0 + 2 * w, 8); w16(0x800794b8 + 2 * w, 8); w16(0x800794b4 + 2 * w, 0x11); w16(0x800794bc + 2 * w, 0x11);
  w16(0x80079560 + 2 * w, 1); w16(0x80079590 + 2 * w, 1);
  for (const a of [0x800794ee, 0x800795d0, 0x800794f0, 0x800795d2]) w8(a + w, 0);
  w32(0x800794c0 + 4 * w, 0);
  for (const a of [0x8007951a, 0x80079510, 0x800795c8, 0x8007943a, 0x800794ce, 0x80079500]) w8(a + w, 0);
}
export function textSlotsReset(m) { for (let w = 0; w < 2; w++) textSlotReset(m, w); } // 0x800390ac

export function animInit(m) { // 0x8003cee0
  for (let i = 0; i < 8; i++) m.write(0x801d5628 + 0x48 * i, 0x80000000, 4);
  m.write(GP + 0x1b8, 0, 1); m.write(GP + 0x1bc, 0, 2);
}

export function clearVram(ctx) { // 0x80035174: all of VRAM black
  const { m, gs } = ctx, rect = ctx.sp - 0x20 + 0x10;
  gs.DrawSync(0);
  m.write(rect, 0, 2); m.write(rect + 2, 0, 2); m.write(rect + 4, 0x400, 2); m.write(rect + 6, 0x200, 2);
  gs.ClearImage(rect, 0, 0, 0);
  m.write(0x80079288, 0, 1); m.write(0x80079287, 0, 1);
}

// 0x800361b4: read each archive's member table (from its sector 0 on, 0x200 entries per
// sector, up to the 0xffff entry) into 0x801f7530, and its {first, count} into 0x8008dbb8.
export function* buildIndex(ctx) {
  const { m } = ctx, { r16, r32, w16 } = io(m), sub = { ...ctx, sp: ctx.sp - 0x38 };
  let total = 0;
  for (let e = PACS; r16(e) !== 8; e += 8) {
    const name = r32(e + 4);
    let n = total, out = MEMBERS + 4 * total;
    for (let sec = 0; sec >= 0; sec++) {
      yield* cdReadFile(sub, name, sec & 0xffff, 1, r32(0x80079484));
      for (let k = 0, a = r32(0x80079484); k < 0x200; k++, a += 4) {
        for (let i = 0; i < 4; i++) m.write(out + i, m.read(a + i, 1), 1);
        out += 4; n++;
        if (r16(a) === 0xffff) { sec = -10; break; }
      }
    }
    w16(INDEX + 4 * r16(e), total);
    w16(INDEX + 4 * r16(e) + 2, (n & 0xffff) - total);
    total = n & 0xffff;
  }
}

function copyText(m, src, dst) { // 0x80044cf8: SJIS pairs, single bytes below 0x81, then the 0
  for (let b; (b = m.read(src, 1)); ) {
    m.write(dst++, b, 1); src++;
    if (b >= 0x81) { m.write(dst++, m.read(src, 1), 1); src++; }
  }
  m.write(dst, 0, 1);
}
export function textStrings(m) { // 0x8003ab98
  copyText(m, m.read(0x8006b74c, 4) >>> 0, m.read(0x8006b034, 4) >>> 0);
  copyText(m, m.read(0x8006b750, 4) >>> 0, m.read(0x8006b038, 4) >>> 0);
}

export function textInit(ctx) { // 0x8003a91c: clear the text page, both windows to their start
  const { m, gs } = ctx, { r8, r32, w8, w16, w32 } = io(m), rect = ctx.sp - 0x20 + 0x10;
  if (r8(PAGE) >= 0x10) unported(0x8003a934);
  w16(rect + 2, 0); w16(rect + 4, 0xa0); w16(rect + 6, 0xf0); w16(rect, (r8(PAGE) & 0xf) << 6);
  gs.ClearImage(rect, 0, 0, 0);
  for (w8(GP + 0x19b, 0); r8(GP + 0x19b) < 2; w8(GP + 0x19b, r8(GP + 0x19b) + 1)) {
    const k = 2 * r8(GP + 0x19b);
    w16(0x800794b0 + k, 8); w16(0x800794b8 + k, 8); w16(0x800794b4 + k, 0x11); w16(0x800794bc + k, 0x11);
    w16(0x80079560 + k, 1); w16(0x80079590 + k, 1);
  }
  w32(CURSOR, r32(CURSOR2));
  textSlotsReset(m);
  for (const a of [0x80079295, 0x80079430, 0x800794cb, 0x80079297, 0x80079296, 0x80079298, 0x8007928e]) w8(a, 0);
}

export function cardInit(ctx) { // 0x80029864: memory card library on, its 3 buffers cleared
  const sp = ctx.sp - 0x18;
  ctx.call(0x80062468, [0], sp); ctx.call(0x800624b4, [], sp);
  for (let i = 0; i < 3 * 0x1f00; i++) ctx.m.write(0x800abe90 + i, 0, 1);
}

export function cdInit(ctx) { // 0x80036b8c
  const { m } = ctx, sp = ctx.sp - 0x18, cd = libcd({ ...ctx, sp });
  cd.CdInit(); ctx.call(0x8004eb00, [0], sp); // CdSetDebug(0)
  const r = cd.CdReadCallback(0x8009ed28) | 0;
  m.write(GP + 0x4a0, r >>> 0, 4);
  if (!r) unported(0x80036bbc); // error message
}

export function padInit(ctx) { // 0x80026138
  const { m } = ctx, sp = ctx.sp - 0x18, { w8, w32 } = io(m);
  ctx.call(0x80066c38, [0x801d6660, 0x801d6682], sp); // PadInitDirect
  ctx.call(0x80064b58, [], sp); // PadStartCom
  for (let i = 0; i < 0x22; i++) {
    w8(0x801d6660 + i, 0xff); w8(0x801d6682 + i, 0xff); w8(0x801f66d8 + i, 0); w8(0x801f66fa + i, 0);
    w8(0x8009d9f8 + i, 0xff); w8(0x8009da1a + i, 0xff);
  }
  for (let i = 0; i < 4; i++) w32(0x801eef40 + 4 * i, 0);
  ctx.call(0x80045438, [0], sp);
}

export function effectsInit(ctx) { // 0x8002d72c: shake/wave state, the 0..0xef·256 table, the VSync callback
  const { m } = ctx, sp = ctx.sp - 0x28, { w16, w32 } = io(m);
  for (const o of [0x90, 0x98, 0xb0, 0xb8]) w32(GP + o, 0x6400);
  for (const o of [0x84, 0x8c, 0x94, 0x9c, 0xa0, 0xa4, 0xac, 0xb4, 0xbc, 0xc0]) w32(GP + o, 0);
  w16(GP + 0x88, 0); w16(GP + 0xa8, 0); w32(GP + 0xc4, 0x100);
  for (let i = 0; i < 0xf0; i++) { w32(0x8009d1f8 + 8 * i, 0); w32(0x8009d1fc + 8 * i, i * 256); } // double(i) * 256.0, to int
  ctx.call(0x800533a8, [0x8002d46c], sp); // VSyncCallback(0x8002d46c)
  for (let i = 0; i < 0xb; i++) {
    w32(0x801fdf98 + 4 * i, 0); w32(0x801f7500 + 4 * i, 0); w32(0x801f5e68 + 4 * i, 0x10000);
    w16(0x8008cda8 + 2 * i, 0); w16(0x800a7058 + 2 * i, 0xffff); w16(0x800c89a0 + 2 * i, 0);
  }
  w32(0x801fdfbc, 0x8000); w32(0x801f7524, 0x8000);
  w32(GP + 0x320, 0); w32(0x80079584, 0); w32(GP + 0x444, 0); w32(0x800795fc, 0); w32(GP + 0x4bc, 0); // 0x80031e68
}

export function graphicsInit(ctx) { // 0x800351d0
  const { m, gs } = ctx, sp = ctx.sp - 0x48, sub = { ...ctx, sp }, { w8, w16, w32 } = io(m), call = (a, args) => ctx.call(a, args, sp) | 0;
  cdInit(sub); padInit(sub); effectsInit(sub);
  call(0x800454b8, [1]);
  w32(sp + 0x10, 0); gs.GsInitGraph(0x140, 0xf0, 0, 0, 0);
  gs.GsDefDispBuff(0, 0, 0, 0xf0);
  for (let i = 0; i < 2; i++) { w32(0x801d5600 + 0x14 * i + 4, 0x8009d978 + 0x40 * i); w32(0x801d5600 + 0x14 * i, 4); }
  gs.GsInit3D();
  gs.GsSetOrign(0, 0);
  gs.DrawSync(0);
  const rect = sp + 0x30;
  w16(rect + 2, 0); w16(rect, 0); w16(rect + 4, 0x400); w16(rect + 6, 0x200);
  gs.ClearImage(rect, 0, 0, 0);
  w8(0x80079288, 0); w8(0x80079287, 0);
  animInit(m);
  for (const [o, v] of [[0x10, 0x2c0], [0x14, 0], [0x18, 0x300], [0x1c, 0x100], [0x20, 0], [0x24, 0x200]]) w32(sp + o, v);
  call(0x80047d18, [0xa0, 0x10, 0x100, 0xc8]); // debug fonts (library; HLE in the browser)
  call(0x80046f08, [0x3c0, 0x100]); // FntLoad
  w32(sp + 0x10, 0); w32(sp + 0x14, 0x200);
  call(0x80046ec8, [call(0x80046fa8, [0x10, 0x10, 0x100, 0xc8])]); // SetDumpFnt(FntOpen(...))
  w16(rect, 0); w16(rect + 2, 8); w16(rect + 6, 0xe0); w16(rect + 4, 0x140); w16(rect, 0); w16(rect + 2, 0); w16(rect + 4, 0x140); w16(rect + 6, 0xf0);
  gs.GsSetDrawBuffClip(rect);
  gs.GsSetDrawBuffClipActive();
  gs.DrawSync(0);
}

export function bzero(m, p, n) { for (let i = 0; i < n; i++) m.write(p + i, 0, 1); } // 0x80044bc0

// 0x80028e74: libsnd on (sound(ctx).start: the library calls), then one quiet frame
export function* soundStart(ctx) {
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp };
  if (m.read(GP + 0x7b, 1) === 1) unported(0x80028e88); // SsEnd first
  m.write(GP + 0x7b, 0, 1);
  for (let i = 0; i < 12; i++) m.write(0x801eef50 + 2 * i, 0xffff, 2);
  sound(sub).start(sp);
  yield* tickQuiet(sub);
  m.write(GP + 0x7b, 1, 1);
}

// 0x800342e8(k): the logo movie k (table 0x8006aee4, 36 bytes each) with the work buffers
// cleared. The STR player 0x800343b0 is not ported: the movie is skipped (no MDEC), as on the oracle.
export function* logoMovie(ctx, k) {
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp }, r32 = (a) => m.read(a, 4) >>> 0;
  m.write(0x8007927c, 1, 1);
  clearVram(sub);
  ctx.call(0x80053318, [], sp); // ResetCallback
  libcd(sub).CdInit();
  ctx.gs.ResetGraph(0);
  ctx.gs.SetGraphDebug(0);
  bzero(m, r32(0x80079484), 0x28000); bzero(m, r32(0x800794d8), 0x13800);
  bzero(m, r32(0x80079440), 0x12c00); bzero(m, r32(0x80079508), 0x2e000);
  if (ctx.movie) yield* ctx.movie(0x8006aee4 + 36 * (k & 0xffff)); else ctx.call(0x800343b0, [0x8006aee4 + 36 * (k & 0xffff)], sp);
  m.write(0x8007927c, 0, 1);
}

function clearSaves(m) { // 0x8001b380
  for (const [p, n] of [[0x801f5bc0, 0x12c], [0x801f5d38, 0x12c], [0x801fa730, 0x200], [0x801fc258, 0x200], [0x801d6110, 0x12c], [0x801d6528, 0x12c]]) bzero(m, p, n);
  m.write(0x800792bc, 0, 2);
}

export function systemReset(m) { // 0x800332b0
  for (let i = 0; i < 5; i++) bzero(m, 0x8009eeb8 + 16 * i, 16);
  bzero(m, 0x801f74b0, 0x50);
  m.write(0x80079414, 0, 2);
  for (const [p, n] of [[0x8009ef08, 0x100], [0x8009f008, 0x200], [0x8009f208, 0x100], [0x8009f308, 0x50], [0x8009f312, 0x20], [0x8009f720, 0x800], [0x800a0320, 0x800]]) bzero(m, p, n);
  for (const [a, v, w] of [[0x800792b1, 1, 1], [0x800792b4, 0, 2], [0x800792b6, 0, 2], [0x800792b8, 0, 1], [0x800792ba, 0, 1], [0x800792b9, 0, 1], [0x800792be, 0xff, 1],
    [0x800792c1, 0, 1], [0x800792b2, 0, 1], [0x800792ae, 0, 1], [0x800792ac, 0, 1]]) m.write(a, v, w);
  clearSaves(m);
  textStrings(m);
}

export function routeReset(m, k) { // 0x80033420(k): route record k (100 bytes at 0x8008cdc0)
  const b = 0x8008cdc0 + 100 * (k & 0xff), h = (o, v) => m.write(b + o, v, 2), y = (o, v) => m.write(b + o, v, 1);
  for (let i = 0; i < 4; i++) h(2 + 2 * i, 0xffff);
  for (let i = 0; i < 4; i++) h(0xa + 2 * i, 0xffff);
  h(0x1c, 0xffff); h(0x1e, 0xffff);
  for (let i = 0; i < 5; i++) h(0x12 + 2 * i, 0xffff);
  y(0, 0xff); y(0, 0xff);
  y(0x40, 0xff); y(0x41, 0); y(0x42, 0); y(0x26, 0); y(0x25, 0); y(0x5a, 0); y(0x5b, 0); h(0x22, 0);
  m.write(0x80079414, 0, 2);
}

// 0x8001d080(id, layer): like showPicture (scenario/basic.js) without the skip check; only
// layer 0 (the title) is ported.
export function* titlePicture(ctx, id, layer) {
  const { m } = ctx, sp = ctx.sp - 0x28, sub = { ...ctx, sp }, { r16, r32, w8, w16 } = io(m);
  dropLayer(m, (layer + 1) & 0xff);
  layer &= 0xff;
  w16(0x801fec68 + 2 * layer, id);
  yield* cdLoad(sub, 1, r32(0x80079484), id & 0xffff);
  if (layer !== 0) unported(0x8001d0d8);
  w8(0x80079294, 1);
  for (let i = 0; i < 16; i++) { m.write(0x8009da48 + 8 * i + 4, 0, 4); m.write(0x8009da48 + 8 * i, 0, 4); }
  w8(0x800795e4, 5); w8(0x800795e6, 0xf); w8(0x800795e5, 0);
  loadPicture(sub, 8, r32(0x80079484));
  spritePage(sub, 8, 0, -4, 0x140, 0xf0);
  w16(0x801f669a, r16(0x80079528));
  const s = r32(0x800794f4);
  w8(s + 0x31, 1); w8(s + 0x33, 0xe); w16(s + 0x1e, 0x1000); w8(s + 0x38, 1);
  w8(0x80079294, 0);
}

// 0x8001c478: the state a new game starts from
export function* newGame(ctx) {
  const { m } = ctx, { r32, w8 } = io(m), sp = ctx.sp - 0x18, sub = { ...ctx, sp };
  checkpoint(m);
  for (const ch of [1, 2, 5, 8]) fadeOut(m, 1, ch);
  for (let i = 0, p = r32(0x80079440); i < 0x12c00; i++) m.write(p + i, 0, 1);
  yield* sceneReset(sub);
  for (let i = 0; i < 16; i++) { m.write(0x8009da48 + 8 * i + 4, 0, 4); m.write(0x8009da48 + 8 * i, 0, 4); }
  w8(0x800795e4, 5); w8(0x800795e6, 0xf); w8(0x800795e5, 0);
  yield* effect(sub, 0);
  textInit(sub);
  spriteClearAll(sub);
  textWindowReset(sub);
  yield* soundReset(sub);
  animStop(m);
  resetStream(m);
}

// 0x8001c5bc: the built-in first scenario (0x12a bytes at 0x800677e8) as resource 0x1f
export function* firstScenario(ctx) {
  const { m } = ctx, { r16, r32, w16, w32 } = io(m), sub = { ...ctx, sp: ctx.sp - 0x18 };
  if (r16(RESOURCE) !== 0x1f) {
    if (m.read(GP + 2, 1) === 1) unported(0x8001c5e8);
    memcpy(m, 0x800677e8, r32(BASE), 0x12a);
    w16(RESOURCE, 0x1f);
  }
  const p = r32(BASE) + r16(r32(BASE));
  w32(CURSOR, p); w32(CURSOR2, p);
  yield* newGame(sub);
  for (let i = 0; i < 8; i++) m.write(0x80079558 + i, 0, 1);
}

export function* init(ctx) {
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp }, call = (a, args = []) => ctx.call(a, args, sp);
  const step = () => { m.write(0x80079260, 0, 4); m.write(0x80079278, 1, 4); };
  crtInit(m);
  bufferInit(m);
  call(0x80053318); // ResetCallback
  cardInit(sub);
  graphicsInit(sub);
  spriteClearAll(sub);
  yield* buildIndex(sub);
  bufferAliases(m);
  yield* soundStart(sub);
  yield* logoMovie(sub, 0);
  textWindowReset(sub);
  textStrings(m);
  textSlotsReset(m);
  yield* firstScenario(sub);
  fadeIn(m, 1, 0); fadeIn(m, 1, 9); fadeOut(m, 1, 1);
  dropLayer(m, 1);
  step();
  yield* titlePicture(sub, 0x23f3, 0);
  fadeIn(m, 0x20, 1);
  systemReset(m);
  routeReset(m, 0); // 0x8003360c
  bufferAliases(m);
  yield* soundReset(sub);
  clearSaves(m);
  step();
  yield* cdLoad({ ...sub, sp: sp - 0x18 }, 0, m.read(0x80079490, 4) >>> 0, 0); // 0x80036b6c
  step();
}
