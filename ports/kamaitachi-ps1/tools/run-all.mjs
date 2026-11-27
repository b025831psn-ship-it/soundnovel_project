#!/usr/bin/env node
import { createHeadless } from "../src/headless.js";

const [root, choicePolicy = "first"] = process.argv.slice(2);
if (!root) { console.error("usage: node tools/run-all.mjs PORT_DATA [CHOICE_POLICY]"); process.exit(2); }
const headless = await createHeadless(root, { followFlow: false });
const failures = [];
let records = 0;
for (const resource of headless.data.resources.values()) {
  for (const record of resource.records || []) {
    records++;
    const result = await headless.run(resource.id, record.id, choicePolicy);
    if (result.failure) failures.push(result.failure);
  }
}
console.log(JSON.stringify({ resources: headless.data.resources.size, records, failureCount: failures.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
