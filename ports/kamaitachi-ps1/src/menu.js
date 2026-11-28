// The in-game menus reached from the main loop and the choice loop:
//   0x80018cdc menu()     △ (game code 0x10) opens the menu while it is allowed (0x8007929f);
//                         0x800795e2 = 1 while it is being checked
//   0x80024fd0 backlog()  START (game code 0x800) at a page marker opens the backlog (earlier
//                         pages again: ↑ back, ↓ forward, × / L1 out), not in resources 0x19 / 0x1f and
//                         only with at least two history points
// Both are translated from the original (menu/translated.js).
export { menu } from "./menu/translated.js"; // generator: yield* menu(ctx)

export { backlog } from "./menu/translated.js"; // generator: yield* backlog(ctx), the R1 check included
