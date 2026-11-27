// What the player can tap (machine mode): the selection loops publish their rows while they run.
// ctx.touch is { menu } (made by the machine; absent on the oracle, so nothing is published there).
// menu = { rows: [{ index, left, right, top, bottom }] in 320x240 screen pixels, index(): the
// original's own cursor, keys: [less, more] (the pad directions that move it), press: rows that
// are buttons rather than cursor places, { index: button } (a tap there presses that button),
// grid: null, or { cols, across: [left, right] } when index = row · cols + column and keys move
// between rows }.
export function offer(ctx, rows, index, keys, press = null, grid = null) { if (ctx.touch) ctx.touch.menu = { rows, index, keys, press, grid }; }
export function withdraw(ctx) { if (ctx.touch) ctx.touch.menu = null; }
export const box = (index, left, top, w, h) => ({ index, left, right: left + w, top, bottom: top + h });
