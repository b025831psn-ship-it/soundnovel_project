// 0x80020108 (per frame): a pending "clear the screen" request (gp[1] = 1) from the
// scenario. Clears the 320x240 8-bit picture buffer (0x80079440) and uploads it to page
// 0x18 (0x8003cbb8), drops the picture sprite (0x801f66a2, via 0x8003bc3c), resets the
// shake offsets and the 0x800795e4 window defaults. Callees not ported yet go through ctx.call.
const GP = 0x8007913c, PICTURE = 0x80079440, IDS = 0x801f6698, SHAKE = 0x8009da48, H1 = 0x80079450, TEXT_ON = 0x80079284;

export function clearTick(ctx) {
  if (ctx.m.read(GP + 1, 1) !== 1) return;
  clearScreen({ ...ctx, sp: ctx.sp - 0x18 });
  ctx.m.write(GP + 1, 0, 1);
}

// The clear itself, shared with scenario command 0x2c; ctx.sp is the caller's own frame.
export function clearScreen(ctx) {
  const { m, sp } = ctx, r32 = (a) => m.read(a, 4) >>> 0;
  const clear = () => { const b = r32(PICTURE); for (let i = 0; i < 0x12c00; i++) m.write(b + i, 0, 1); };
  clear();
  ctx.call(0x8003cbb8, [0x18, r32(PICTURE), 0], sp);
  const id = m.read(IDS + 0xa, 2);
  if (id) {
    ctx.call(0x8003bc3c, [(id << 16) >> 16], sp);
    m.write(IDS + 0xa, 0, 2); m.write(TEXT_ON, 0, 1);
    for (let j = 0; j < 4; j++) m.write(H1 + 2 * j, 0xffff, 2);
    clear();
  }
  m.write(GP + 0x15c, 1, 1);
  ctx.call(0x8002f3c0, [], sp);
  for (let i = 0; i < 16; i++) { m.write(SHAKE + 8 * i + 4, 0, 4); m.write(SHAKE + 8 * i, 0, 4); }
  m.write(0x800795e4, 5, 1); m.write(0x800795e6, 0xf, 1); m.write(0x800795e5, 0, 1);
}
