// What the player can tap (machine mode): the selection loops publish their rows while they run.
// ctx.touch is { menu } (made by the machine; absent on the oracle, so nothing is published there).
// menu = { rows: [{ index, left, right, top, bottom }] in 320x240 screen pixels, index(): the
// original's own cursor, keys: [less, more] (the pad directions that move it), press: rows that
// are buttons rather than cursor places, { index: button } (a tap there presses that button),
// grid: null, or { cols, across: [left, right] } when index = row · cols + column and keys move
// between rows }.
// live: offered again before every frame wait of its loop (the translated loops), so it lapses by
// itself once the loop is left (current(): published at most two frames ago).
export function offer(ctx, rows, index, keys, press = null, grid = null, live = false) { if (ctx.touch) ctx.touch.menu = { rows, index, keys, press, grid, live, at: ctx.touch.frame ?? 0 }; }
export function offerLive(ctx, rows, index, keys, press = null, grid = null) { offer(ctx, rows, index, keys, press, grid, true); }
export function current(touch) { const t = touch?.menu; return t && (!t.live || (touch.frame ?? 0) - t.at <= 2) ? t : null; }
export function withdraw(ctx) { if (ctx.touch) ctx.touch.menu = null; }
export const box = (index, left, top, w, h) => ({ index, left, right: left + w, top, bottom: top + h });
