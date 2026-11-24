import fs from "node:fs";
import path from "node:path";
import { VM } from "../src/vm.js";
import { traceLine, TRACE_HEADER } from "../src/trace.js";

const [dataPath, limitText = "2000"] = process.argv.slice(2);
if (!dataPath) throw new Error("usage: trace-scenario.mjs <port-data> [limit]");
const scenario = path.join(dataPath, "scenario");
const banks = {};
for (const name of fs.readdirSync(scenario)) {
  if (!name.endsWith(".bin")) continue;
  banks[Number.parseInt(name, 16)] = new Uint8Array(
    fs.readFileSync(path.join(scenario, name)),
  );
}
const lines = [];
const vm = new VM({
  banks,
  text: { feed: () => "none" },
  trace: (event) => lines.push(traceLine(event)),
});
const limit = Number(limitText);
while (!vm.halted && lines.length < limit && vm.waiting !== "choice") {
  vm.step();
  if (vm.waiting !== "none" && vm.waiting !== "choice") vm.resume();
}
console.log(TRACE_HEADER);
console.log(lines.join("\n"));
console.error(
  JSON.stringify({
    count: lines.length,
    wait: vm.waiting,
    unimplemented: [...vm.unimplemented],
  }),
);
