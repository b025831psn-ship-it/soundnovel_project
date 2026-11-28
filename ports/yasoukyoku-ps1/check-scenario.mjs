import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { decodeRecord } from "./scenario.mjs";

import { branchInfo } from "./branches.mjs";

const [disc, indexPath, scriptPath] = process.argv.slice(2);
if (!scriptPath) throw Error("Usage: node check-scenario.mjs track.bin scenario-index.json script.ja.json");
const read = filename => JSON.parse(fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, ""));
const expected = read(scriptPath);
let idCount = 0, records = 0, optionCount = 0;
const operations = {};
const branchCounts = {};
let explicitTargets = 0;
const fd = fs.openSync(disc, "r");
try {
  for (const asset of read(indexPath)) {
    const bytes = Buffer.alloc(asset.size);
    for (let i = 0; i < bytes.length; i += 2048) {
      const n = Math.min(bytes.length-i, 2048);
      if (fs.readSync(fd, bytes, i, n, (asset.lba+i/2048)*2352+24) !== n) throw Error("Short disc read");
    }
    if (crypto.createHash("sha256").update(bytes).digest("hex") !== asset.sha256) throw Error("Resource hash mismatch");
    const boundaries = [...asset.recordOffsets, asset.scenes[0].labelOffset];
    for (let i = 0; i < boundaries.length-1; i++) {
      records++;
      for (const command of decodeRecord(bytes, boundaries[i], boundaries[i+1])) {
        if (command.op === 4) {
          const branch = branchInfo(command, i);
          branchCounts[branch.kind] = (branchCounts[branch.kind] || 0) + 1;
          let targets;
          if (branch.kind === "jump") targets = [branch.target];
          else if (branch.kind === "choice") targets = branch.options.map(option => option.target);
          else targets = [...branch.tests.map(test => test.target), branch.fallback];
          for (const target of targets) {
            if (!Number.isInteger(target) || target < 0 || target >= boundaries.length - 1)
              throw Error("Unresolved branch target in " + asset.file + ": " + target);
            explicitTargets++;
          }
        }
        if (command.op) operations[command.op] = (operations[command.op] || 0)+1;
        for (const item of command.options || (command.kind === "text" ? [command] : [])) {
          const row = expected[idCount++];
          const hex = n => n.toString(16).toUpperCase().padStart(6,"0");
          const id = [path.posix.parse(asset.file).name, hex(boundaries[i]), hex(item.offset)].join("-");
          if (row?.id !== id || row.ja !== item.text || row.target !== item.target || row.endOffset !== item.end) throw Error("Extraction mismatch at "+id);
          if (item.target !== undefined) optionCount++;
        }
      }
    }
  }
} finally { fs.closeSync(fd); }
if (idCount !== expected.length) throw Error("Unconsumed source IDs");
console.log(JSON.stringify({records,idCount,optionCount,operations,branchCounts,explicitTargets}));
