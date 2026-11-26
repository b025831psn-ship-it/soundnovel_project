// Pad input, ported from the game's per-frame routines. The pad report is the one libpad
// keeps at 0x801d6660 (status, type 0x41 digital / 0x73 analog, buttons active low); the
// game turns it into its own 16-bit code ((byte2 << 8 | byte3), active high) at 0x801eef40:
//   +0 pressed this frame (new), +4 previous +0, +8 held, +0xc previous +8.
//   0x80025440 inputTick()   per frame; d-pad auto-repeat when gp[0x60] = 1
//   0x80025600 inputClear()
//   0x80025eec padRead()     the 16-bit code; ctx.padState(0) is libpad's PadGetState
const GP = 0x8007913c, PAD = 0x801eef40, REPORT = 0x801d6660;
const AUTO = 0x800792c6, AUTO_HOLD = 0x8007928e, BLOCK = 0x800792a4, KEEP = 0x80079286, FRAME_STEP = 0x80079278;
const unported = (addr) => { throw new Error(`input: path at 0x${addr.toString(16)} is not ported`); };

export function padRead(ctx) {
  const { m } = ctx;
  let code = 0;
  if (m.read(REPORT, 1)) return 0;
  const type = m.read(REPORT + 1, 1);
  if (type === 0x41 || type === 0x73) code = ~(m.read(REPORT + 3, 1) | m.read(REPORT + 2, 1) << 8);
  if (ctx.padState(0) === 6) unported(0x80025f6c); // vibration pad setup
  return code & 0xffff;
}

export function inputClear(m) { for (let i = 0; i < 16; i += 4) m.write(PAD + i, 0, 4); }

export function inputTick(ctx) {
  const { m } = ctx, r32 = (a) => m.read(a, 4) >>> 0, w32 = (a, v) => m.write(a, v >>> 0, 4);
  w32(PAD + 0xc, r32(PAD + 8)); w32(PAD + 4, r32(PAD));
  const v = padRead(ctx) & 0xffff;
  w32(PAD + 8, v); w32(PAD, v & ~r32(PAD + 0xc));
  const blocked = (m.read(AUTO, 1) === 1 && m.read(AUTO_HOLD, 1) === 1) || m.read(BLOCK, 1) === 1;
  if (blocked) { w32(PAD + 8, 0); w32(PAD, 0); m.write(AUTO_HOLD, 0, 1); return; }
  const repeat = m.read(GP + 0x60, 1);
  m.write(AUTO_HOLD, 0, 1);
  if (repeat === 1) { // d-pad auto-repeat: first after 30 frames, then every 5
    const dpad = r32(PAD + 8) & 0xf000;
    if (!dpad) m.write(GP + 0x62, 0x1e, 2);
    if (dpad !== (m.read(GP + 0x64, 4) | 0)) m.write(GP + 0x62, 0x1e, 2);
    else if (((m.read(GP + 0x62, 2) << 16) >> 16) > 0) m.write(GP + 0x62, m.read(GP + 0x62, 2) - m.read(FRAME_STEP, 2), 2);
    else { w32(PAD, r32(PAD) | dpad); m.write(GP + 0x62, 5, 2); }
    m.write(GP + 0x64, r32(PAD + 8) & 0xf000, 4);
  }
  if (!m.read(KEEP, 1)) inputClear(m);
  if (m.read(AUTO, 1) === 1) { w32(PAD, r32(PAD) & 0x21); w32(PAD + 8, r32(PAD + 8) & 0x21); }
}
