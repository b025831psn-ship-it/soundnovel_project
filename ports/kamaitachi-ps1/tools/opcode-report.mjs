#!/usr/bin/env node
import { createHeadless } from "../src/headless.js";

const [root] = process.argv.slice(2);
if (!root) { console.error("usage: node tools/opcode-report.mjs PORT_DATA"); process.exit(2); }
console.log(JSON.stringify((await createHeadless(root)).opcodeStatus(), null, 2));
