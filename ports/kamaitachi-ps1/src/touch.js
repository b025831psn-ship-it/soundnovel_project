// What the player can tap (machine mode): the selection loops publish their rows while they run.
// ctx.touch is { menu } (made by the machine; absent on the oracle, so nothing is published there).
// menu = { rows: [{ index, left, right, top, bottom }] in 320x240 screen pixels, index(): the
// original's own cursor, keys: [less, more] (the pad directions that move it) }.
export function offer(ctx, rows, index, keys) { if (ctx.touch) ctx.touch.menu = { rows, index, keys }; }
export function withdraw(ctx) { if (ctx.touch) ctx.touch.menu = null; }
export const box = (index, left, top, w, h) => ({ index, left, right: left + w, top, bottom: top + h });
