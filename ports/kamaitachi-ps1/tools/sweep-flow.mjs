#!/usr/bin/env node
import { catalogTransfers, sweep } from "../src/sweep.js";
import { loadPortData } from "../src/port-data.js";
import { ScenarioFault, ScenarioVM } from "../src/vm.js";

const [root, resource = "25", record = "7"] = process.argv.slice(2);
if (!root) {
  console.error("usage: node tools/sweep-flow.mjs PORT_DATA [RESOURCE_ID] [RECORD_ID]");
  process.exit(2);
}
const start = { resourceId: Number(resource), recordId: Number(record) };
const fresh = await sweep(root, { ...start, unlockPolicy: "fresh" });
const unlock = await sweep(root, { ...start, unlockPolicy: "both" });
const data = await loadPortData(root);
const primary = data.manifest.opcodeTables.primary, sub1d = data.manifest.opcodeTables.sub1d;
const vm = new ScenarioVM({ primaryHandlers: primary.handlers, sub1dHandlers: sub1d.handlers,
  primaryLengths: primary.lengths || [], sub1dLengths: sub1d.lengths || [] });
const scenarioSelectEntries = [];
for (const row of data.resources.get(39).records) {
  const bytes = (await data.record(39, row.id)).bytes, queue = [0], seen = new Set();
  let marker = null;
  while (queue.length && !marker) {
    const offset = queue.shift();
    if (seen.has(offset) || offset >= bytes.length) continue;
    seen.add(offset);
    let events;
    try { events = vm.run(bytes, { resourceId: 39, recordId: row.id, offset }); }
    catch (error) { if (!(error instanceof ScenarioFault)) throw error; events = error.events; }
    marker = events.find((event) => event.opcode === "0x53");
    const transfer = [...events].reverse().find((event) =>
      ["choice", "choice-table", "jump", "call", "return", "branch", "ending"].includes(event.kind));
    if (transfer?.fallthrough?.resourceId === 39 && transfer.fallthrough.recordId === row.id)
      queue.push(transfer.fallthrough.offset || 0);
    if (transfer?.returnTo?.resourceId === 39 && transfer.returnTo.recordId === row.id)
      queue.push(transfer.returnTo.offset || 0);
  }
  const checkpointId = marker?.operands?.[0] | ((marker?.operands?.[1] || 0) << 8);
  scenarioSelectEntries.push({ recordId: row.id, checkpointId: marker ? checkpointId : null,
    menuEntry: checkpointId === row.id + 1 });
}
const scenarioSelectRoots = scenarioSelectEntries.filter((row) => row.menuEntry).map((row) => ({
  name: `title-menu:scenario-select:${row.recordId}`, resourceId: 39, recordId: row.recordId,
}));
const titleMenu = await sweep(root, { includeFreshRoot: false, unlockPolicy: "both", additionalRoots: [
  { name: "title-menu:main", resourceId: 31, recordId: 0 }, ...scenarioSelectRoots,
] });
const catalog = await catalogTransfers(root, 31);
const scenarioSelect = {
  evidence: "decoded opcode 0x53 checkpoint id equals resource-39 record id + 1",
  menuEntries: scenarioSelectEntries.filter((row) => row.menuEntry),
  internalEntries: scenarioSelectEntries.filter((row) => !row.menuEntry),
};
console.log(JSON.stringify({ fresh, unlock, titleMenu, scenarioSelect, catalog }, null, 2));
