// Convert an mGBA scene-audio probe log into cartridge-frame transition waits.
//
//   node tools/extract-transition-timings.mjs <native.tsv> <output.json>
//
// Cursor addresses in the probe point into the current bank's 020067F4 RAM
// copy. The output therefore uses stable "bank:offset" keys and preserves
// repeated visits to a site in capture order.
import fs from "node:fs";

const [input, output] = process.argv.slice(2);
if (!output) throw new Error("usage: extract-transition-timings.mjs <native.tsv> <output.json>");

const BUFFER = 0x020067f4;
const timed = new Set([
  0x02, 0x04, 0x05, 0x09, 0x0b, 0x15, 0x1c, 0x29, 0x2d, 0x2e,
  0x36, 0x39, 0x3b, 0x3e, 0x4b, 0x4c, 0x4d, 0x4f, 0x53, 0x58, 0x59, 0x5b, 0x5f,
]);
const dispatches = [];
const marks = new Map();
for (const line of fs.readFileSync(input, "utf8").split("\n")) {
  const fields = line.split("\t");
  if (!/^\d+$/.test(fields[0])) continue;
  const frame = Number(fields[0]);
  if (fields[1] === "op") {
    dispatches.push({
      frame,
      bank: Number.parseInt(fields[2], 16),
      cursor: Number.parseInt(fields[3], 16),
      opcode: Number.parseInt(fields[4], 16),
    });
  } else if (fields[1] === "call" && ["frame", "irq"].includes(fields[2])) {
    if (!marks.has(frame)) marks.set(frame, new Set());
    marks.get(frame).add(fields[2]);
  }
}

const sites = {};
for (let index = 0; index + 1 < dispatches.length; index++) {
  const current = dispatches[index];
  if (!timed.has(current.opcode)) continue;
  const frames = dispatches[index + 1].frame - current.frame;
  if (frames < 0) continue;
  const key = `${current.bank.toString(16)}:${(current.cursor - BUFFER).toString(16)}`;
  const span = Array.from({ length: frames }, (_, n) => marks.get(current.frame + n));
  (sites[key] ??= []).push({
    opcode: current.opcode,
    frames,
    audioFrame: span.map((set) => set?.has("frame") ? "1" : "0").join(""),
    audioIrq: span.map((set) => set?.has("irq") ? "1" : "0").join(""),
  });
}

fs.writeFileSync(output, `${JSON.stringify({ version: 1, sites }, null, 2)}\n`);
console.error(JSON.stringify({ sites: Object.keys(sites).length,
  visits: Object.values(sites).reduce((sum, entries) => sum + entries.length, 0) }));
