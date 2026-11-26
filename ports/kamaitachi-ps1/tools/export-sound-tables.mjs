// Usage: node tools/export-sound-tables.mjs <SLPS_017.94> > <private port-data>/sound/sound-tables.json
// The game's sound tables (song reverb/length/loops/volume, pan law, effect pairing) for
// the browser build, which does not load the EXE. Game data: keep the output private.
import { readFileSync } from "node:fs";
import { readSoundTables } from "../sound/container.js";
const t = readSoundTables(readFileSync(process.argv[2]));
process.stdout.write(JSON.stringify({ ...t, panLaw: Array.from(t.panLaw) }));
