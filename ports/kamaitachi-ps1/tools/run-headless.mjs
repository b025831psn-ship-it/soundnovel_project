#!/usr/bin/env node
import { run } from "../src/headless.js";

const [root, resource, record, choicePolicy = "first"] = process.argv.slice(2);
if (!root || resource == null || record == null) {
  console.error("usage: node tools/run-headless.mjs PORT_DATA RESOURCE_ID RECORD_ID [CHOICE_POLICY]");
  process.exit(2);
}
console.log(JSON.stringify(await run(root, Number(resource), Number(record), choicePolicy), null, 2));
