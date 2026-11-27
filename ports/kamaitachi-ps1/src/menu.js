// The in-game menus reached from the main loop and the choice loop:
//   0x80018cdc menu()     START (0x10) opens the menu while it is allowed (0x8007929f);
//                         0x800795e2 = 1 while it is being checked
//   0x80024fd0 backlog()  R1 (0x800) opens the backlog, not in resources 0x19 / 0x1f and
//                         only with at least two history points
// The menu is translated from the original (menu/translated.js); the backlog is not ported yet.
const PAD = 0x801eef40, RESOURCE = 0x8007929c;
const unported = (addr) => { throw new Error(`menu: path at 0x${addr.toString(16)} is not ported`); };
export { menu } from "./menu/translated.js"; // generator: yield* menu(ctx)

export function backlog(ctx) {
  const { m } = ctx, res = m.read(RESOURCE, 2);
  if (res === 0x1f || res === 0x19) return;
  if (!(m.read(PAD, 4) & 0x800)) return;
  if (((m.read(0x800792b4, 2) - 2) << 16) < 0) return;
  unported(0x8002505c);
}
