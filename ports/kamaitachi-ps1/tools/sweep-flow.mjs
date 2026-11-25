#!/usr/bin/env node
import { sweep } from "../src/sweep.js";

const [root, resource = "25", record = "7"] = process.argv.slice(2);
if (!root) {
  console.error("usage: node tools/sweep-flow.mjs PORT_DATA [RESOURCE_ID] [RECORD_ID]");
  process.exit(2);
}
const start = { resourceId: Number(resource), recordId: Number(record) };
const fresh = await sweep(root, { ...start, unlockPolicy: "fresh" });
const unlock = await sweep(root, { ...start, unlockPolicy: "both" });
console.log(JSON.stringify({ fresh, unlock }, null, 2));
