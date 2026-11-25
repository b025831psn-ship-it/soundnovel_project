#!/usr/bin/env node
import { catalogTransfers, sweep } from "../src/sweep.js";

const [root, resource = "25", record = "7"] = process.argv.slice(2);
if (!root) {
  console.error("usage: node tools/sweep-flow.mjs PORT_DATA [RESOURCE_ID] [RECORD_ID]");
  process.exit(2);
}
const start = { resourceId: Number(resource), recordId: Number(record) };
const fresh = await sweep(root, { ...start, unlockPolicy: "fresh" });
const unlock = await sweep(root, { ...start, unlockPolicy: "both" });
const titleMenu = await sweep(root, { includeFreshRoot: false, unlockPolicy: "both", additionalRoots: [
  { name: "title-menu:main", resourceId: 31, recordId: 0 },
  { name: "title-menu:scenario-select", resourceId: 39, recordId: 0 },
] });
const catalog = await catalogTransfers(root, 31);
console.log(JSON.stringify({ fresh, unlock, titleMenu, catalog }, null, 2));
