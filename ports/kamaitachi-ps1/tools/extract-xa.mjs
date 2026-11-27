// Extracts the CD-XA channels the game plays (PINK.XA, channel 0) for the browser machine
// (src/xa.js): each sector's 2304 bytes of sound groups, in order, one file per channel.
// Input: PINK.XA read from the disc as raw 2352-byte sectors, or as 2336-byte Form 2 sectors
// (subheader + data). The output is the user's own asset and is not committed.
//   node tools/extract-xa.mjs <PINK.XA (raw or 2336), or its parts in order...> <out dir>
import { openSync, readSync, fstatSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { XA_FILE_SECTORS, XA_BYTES, xaFileName } from "../src/xa.js";

const args = process.argv.slice(2), out = args.pop();
if (!args.length || !out) { console.error("usage: node tools/extract-xa.mjs <PINK.XA ...> <out dir>"); process.exit(2); }
const fds = args.map((p) => openSync(p, "r")), total = fds.reduce((s, fd) => s + fstatSync(fd).size, 0);
const size = total === XA_FILE_SECTORS * 2352 ? 2352 : total === XA_FILE_SECTORS * 2336 ? 2336 : 0;
if (!size) { console.error(`input: ${total} bytes, expected ${XA_FILE_SECTORS} sectors of 2352 or 2336 bytes`); process.exit(1); }
const skip = size === 2352 ? 16 : 0, channels = new Map(), sec = Buffer.alloc(size);
let fi = 0, n = 0;
for (; n < XA_FILE_SECTORS; n++) {
  let got = 0;
  while (got < size) { const r = readSync(fds[fi], sec, got, size - got, null); if (!r) { fi++; continue; } got += r; }
  const file = sec[skip], chan = sec[skip + 1], submode = sec[skip + 2], coding = sec[skip + 3];
  if (file !== 1 || !(submode & 4) || coding !== 1) continue; // audio sectors only (the last ones of the file are EOF markers)
  if (!channels.has(chan)) channels.set(chan, []);
  channels.get(chan).push(Buffer.from(sec.subarray(skip + 8, skip + 8 + XA_BYTES)));
}
mkdirSync(out, { recursive: true });
for (const [c, list] of [...channels].sort((a, b) => a[0] - b[0])) {
  if (c !== 0) continue; // the game's table (0x8006afbc) plays channel 0 only
  writeFileSync(join(out, xaFileName(c)), Buffer.concat(list));
  console.log(`${xaFileName(c)}: ${list.length} sectors`);
}
