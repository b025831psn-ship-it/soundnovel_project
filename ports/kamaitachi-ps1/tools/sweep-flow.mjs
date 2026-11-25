#!/usr/bin/env node
import { sweep } from "../src/sweep.js";

const [root, resource = "25", record = "7"] = process.argv.slice(2);
if (!root) {
  console.error("usage: node tools/sweep-flow.mjs PORT_DATA [RESOURCE_ID] [RECORD_ID]");
  process.exit(2);
}
console.log(JSON.stringify(await sweep(root, {
  resourceId: Number(resource), recordId: Number(record),
}), null, 2));
