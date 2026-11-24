import fs from "node:fs";
import path from "node:path";
import { VM } from "../src/vm.js";
import { traceLine, TRACE_HEADER } from "../src/trace.js";

const [dataPath, limitText = "2000", entryRowText = "27000", choicesText = ""] = process.argv.slice(2);
if (!dataPath) throw new Error(
  "usage: trace-scenario.mjs <port-data> [limit] [entry-row] [choice-indexes]",
);
const choices = choicesText === ""
  ? []
  : choicesText.split(",").map((value) => {
    const choice = Number(value);
    if (!Number.isInteger(choice) || choice < 0)
      throw new Error(`invalid choice index: ${value}`);
    return choice;
  });
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
  entryRow: Number(entryRowText),
  text: { feed: () => "none" },
  trace: (event) => lines.push(traceLine(event)),
});
const limit = Number(limitText);
let choicesConsumed = 0;
while (!vm.halted && lines.length < limit) {
  if (vm.waiting === "choice") {
    if (choicesConsumed >= choices.length) break;
    const choice = choices[choicesConsumed++];
    if (!vm.choiceState?.entries[choice])
      throw new Error(`choice ${choice} is out of range at ${vm.bank.toString(16)}:${vm.offset.toString(16)}`);
    vm.resume(choice);
  }
  vm.step();
  if (vm.waiting !== "none" && vm.waiting !== "choice") vm.resume();
}
console.log(TRACE_HEADER);
console.log(lines.join("\n"));
console.error(
  JSON.stringify({
    count: lines.length,
    wait: vm.waiting,
    choicesConsumed,
    unimplemented: [...vm.unimplemented],
  }),
);
