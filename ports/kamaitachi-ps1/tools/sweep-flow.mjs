#!/usr/bin/env node
import { catalogTransfers, sweep } from "../src/sweep.js";
import { loadPortData } from "../src/port-data.js";

const [root, resource = "25", record = "7"] = process.argv.slice(2);
if (!root) {
  console.error("usage: node tools/sweep-flow.mjs PORT_DATA [RESOURCE_ID] [RECORD_ID]");
  process.exit(2);
}
const start = { resourceId: Number(resource), recordId: Number(record) };
const fresh = await sweep(root, { ...start, unlockPolicy: "fresh" });
const unlock = await sweep(root, { ...start, unlockPolicy: "both" });
const data = await loadPortData(root);
const scenarioSelectRoots = data.resources.get(39).records.map((row) => ({
  name: `title-menu:scenario-select:${row.id}`, resourceId: 39, recordId: row.id,
}));
const titleMenu = await sweep(root, { includeFreshRoot: false, unlockPolicy: "both", additionalRoots: [
  { name: "title-menu:main", resourceId: 31, recordId: 0 }, ...scenarioSelectRoots,
] });
const catalog = await catalogTransfers(root, 31);
console.log(JSON.stringify({ fresh, unlock, titleMenu, catalog }, null, 2));
