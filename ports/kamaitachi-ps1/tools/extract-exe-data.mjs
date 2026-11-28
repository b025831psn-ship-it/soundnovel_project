// Extracts the data sections of the game's EXE (SLPS_017.94) for the browser machine:
// only the EXE_DATA ranges of src/machine.js, never code. The output is the user's own asset
// and is not committed.   node tools/extract-exe-data.mjs <SLPS_017.94> <exe-data.bin>
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { EXE_DATA } from "../src/machine.js";
import { pack } from "../src/exe-data.js";

const SHA1 = "e0064532ca31b5c30b7b422636bfe9d829d49b2e"; // SLPS-01794 (Japan) as read from the disc
const [src, dst] = process.argv.slice(2);
if (!src || !dst) { console.error("usage: node tools/extract-exe-data.mjs <SLPS_017.94> <exe-data.bin>"); process.exit(2); }
const exe = readFileSync(src), sha1 = createHash("sha1").update(exe).digest("hex"), text = exe.readUInt32LE(0x18);
if (sha1 !== SHA1) console.warn(`warning: EXE sha1 ${sha1} is not the one the port was made from (${SHA1})`);
const parts = EXE_DATA.map(([a, b]) => ({ addr: a, bytes: exe.subarray(0x800 + a - text, 0x800 + b - text) }));
writeFileSync(dst, pack(parts));
console.log(`${dst}: ${parts.map((p) => `${p.addr.toString(16)}+${p.bytes.length.toString(16)}`).join(", ")}`);
