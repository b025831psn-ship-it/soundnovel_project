// The STR movies: the STR player 0x800343b0 (the opening SN2_OP, and the title's 「特報！」
// trailers SN3_PRO, SN1_PRO, SN2_PRO). The drive streams the movie's sectors to the MDEC; the
// player shows frame after frame until the frame number reaches the entry's end frame, or,
// when the entry allows it, until START, ○ or L2 is pressed (0x800347d8: new presses & 0x821).
//
// The web port does not decode MDEC: the host plays the same movie converted to a video file
// (tools/convert-str.sh: the disc's STR file → <NAME>.mp4, picture and XA sound unchanged) and
// the game waits for it frame by frame, as the original waits for its player.
//   table 0x8006aee4 + 36·k: +0 name (char*, "\SN2_OP.STR;1"), +0xc end frame, +0x20 1 = skippable
//   host(name) -> { ended: boolean, stop() }   (none: the movie is skipped, as before)
import { inputTick } from "./input.js";

const PAD = 0x801eef40, SKIP_KEYS = 0x821; // START, ○, L2 in the game's pad code

export function movieName(m, entry) {
  let p = m.read(entry, 4) >>> 0, s = "";
  for (let i = 0; i < 32; i++) { const c = m.read(p + i, 1); if (!c) break; s += String.fromCharCode(c); }
  return s.replace(/^\\/, "").replace(/\.STR;1$/i, ""); // "\SN2_OP.STR;1" -> "SN2_OP"
}

export function* playMovie(ctx, entry, host) {
  const { m } = ctx, skippable = (m.read(entry + 0x20, 4) | 0) === 1;
  const h = host(movieName(m, entry));
  if (!h) return;
  try {
    for (;;) {
      inputTick(ctx);
      if (h.ended) break;
      if (skippable && (m.read(PAD, 4) & SKIP_KEYS)) break;
      yield;
    }
  } finally { if (!h.ended) h.stop(); }
}
