// Explore every distinct choice state reachable by the scenario VM.
//
//   node tools/explore-scenario.mjs <port-data> <report.json> [entry-row] [max-paths] [max-path-steps] [max-total-steps]
//
// Every item of a previously unseen choice state is queued from an in-memory VM snapshot. The
// state key includes all scenario-visible flags, variables, bits, stack frames and control bytes,
// so paths that merge do not cause an exponential replay. This is concrete execution: conditions
// that require external state not produced by a choice remain listed as coverage gaps.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { VM } from "../src/vm.js";

const [dataPath, outputPath, entryText = "27000", maxPathsText = "50000",
  maxPathStepsText = "200000", maxTotalStepsText = "50000000"] =
  process.argv.slice(2);
if (!outputPath)
  throw new Error("usage: explore-scenario.mjs <port-data> <report.json> [entry-row] [max-paths] [max-path-steps] [max-total-steps]");

const scenarioPath = path.join(dataPath, "scenario");
const banks = {};
for (const name of fs.readdirSync(scenarioPath)) {
  if (!name.endsWith(".bin")) continue;
  banks[Number.parseInt(name, 16)] = new Uint8Array(fs.readFileSync(path.join(scenarioPath, name)));
}

const entryRow = Number(entryText);
const maxPaths = Number(maxPathsText);
const maxPathSteps = Number(maxPathStepsText);
const maxTotalSteps = Number(maxTotalStepsText);
const queue = [{ path: [], snapshot: null }];
const expandedChoices = new Set();
const sites = new Set();
const rows = new Set();
const opcodes = new Set();
const edges = new Set();
const unimplemented = new Set();
const choiceStates = [];
const terminals = [];
const rowVisits = new Map();
let pathCount = 0;
let totalSteps = 0;
let truncated = false;

const hex = (value, width = 2) => value === undefined ? "past-end" : value.toString(16).padStart(width, "0");
const bytesHex = (values) => Buffer.from(values).toString("hex");
const rowAt = (vm, bank, offset) => {
  const starts = vm.rows[bank] ?? [];
  let lo = 0, hi = starts.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (starts[mid] <= offset) lo = mid + 1;
    else hi = mid;
  }
  return lo ? bank * 1000 + lo - 1 : null;
};
const choiceKey = (vm) => {
  const state = [
    vm.bank, vm.offset, vm.ram.group, vm.ram.slot, vm.ram.pending,
    vm.ram.effectDisabled, vm.ram.effectBypass, vm.ram.overlayActive,
    bytesHex(vm.ram.flags), bytesHex(vm.ram.vars), bytesHex(vm.ram.bits),
    vm.ram.stack.map(({ bank, offset }) => `${bank}:${offset}`).join(","),
    vm.choiceState?.entries.map(({ row, key = "" }) => `${row}:${key}`).join(",") ?? "",
  ].join("|");
  return createHash("sha256").update(state).digest("hex");
};
const snapshot = (vm) => ({
  bank: vm.bank,
  offset: vm.offset,
  halted: vm.halted,
  waiting: vm.waiting,
  ram: structuredClone(vm.ram),
  choiceState: structuredClone(vm.choiceState),
  choiceSelection: vm.choiceSelection,
  collectingChoice: vm.collectingChoice,
  waitFrames: vm.waitFrames,
  audioWait: structuredClone(vm.audioWait),
  pendingAudio: structuredClone(vm.pendingAudio),
  clockWaitTarget: vm.clockWaitTarget,
});
const restore = (vm, state) => {
  if (!state) return;
  for (const name of ["bank", "offset", "halted", "waiting", "choiceState", "choiceSelection",
    "collectingChoice", "waitFrames", "audioWait", "pendingAudio", "clockWaitTarget"])
    vm[name] = structuredClone(state[name]);
  vm.ram = structuredClone(state.ram);
};

while (queue.length && pathCount < maxPaths && totalSteps < maxTotalSteps) {
  const { path: decisions, snapshot: initial } = queue.shift();
  let previous = null;
  let steps = 0;
  let stop = "halted";
  const vm = new VM({
    banks,
    entryRow,
    text: { feed: () => "none" },
    trace(event) {
      const site = `${hex(event.bank)}:${hex(event.offset, 4)}`;
      sites.add(site);
      opcodes.add(event.opcode);
      if (previous) edges.add(`${previous}>${site}`);
      previous = site;
      const row = rowAt(vm, event.bank, event.offset);
      if (row !== null) {
        rows.add(row);
        rowVisits.set(row, (rowVisits.get(row) ?? 0) + 1);
      }
    },
  });
  restore(vm, initial);

  while (!vm.halted && steps < maxPathSteps && totalSteps < maxTotalSteps) {
    if (vm.waiting === "choice") {
      const key = choiceKey(vm);
      const entries = vm.choiceState?.entries ?? [];
      if (!expandedChoices.has(key)) {
        expandedChoices.add(key);
        choiceStates.push({
          id: key,
          path: decisions,
          bank: vm.bank,
          offset: vm.offset,
          opcode: vm.choiceState?.opcode,
          entries: entries.map(({ row, key: itemKey }) => ({ row, ...(itemKey === undefined ? {} : { key: itemKey }) })),
        });
        for (let index = 0; index < entries.length; index++) {
          const child = new VM({ banks, entryRow, text: { feed: () => "none" } });
          restore(child, snapshot(vm));
          child.resume(index);
          queue.push({ path: [...decisions, index], snapshot: snapshot(child) });
        }
        stop = "choice-expanded";
      } else stop = "choice-merged";
      break;
    }
    if (vm.waiting !== "none") {
      vm.resume();
      continue;
    }
    vm.step();
    steps++;
    totalSteps++;
  }
  if (steps >= maxPathSteps) stop = "path-step-limit";
  if (totalSteps >= maxTotalSteps) stop = "total-step-limit";
  for (const opcode of vm.unimplemented) unimplemented.add(opcode);
  if (vm.halted) stop = vm.unimplemented.size ? "unimplemented" : "halted";
  terminals.push({ path: decisions, stop, steps, bank: vm.bank, offset: vm.offset });
  pathCount++;
}

if (queue.length || pathCount >= maxPaths || totalSteps >= maxTotalSteps) truncated = true;
const probe = new VM({ banks, entryRow });
const allRows = Object.entries(probe.rows).flatMap(([bank, starts]) =>
  starts.map((_, index) => Number(bank) * 1000 + index));
const reachedRows = [...rows].sort((a, b) => a - b);
const stopCounts = terminals.reduce((counts, { stop }) => {
  counts[stop] = (counts[stop] ?? 0) + 1;
  return counts;
}, {});
const reportItemLimit = 2000;
const report = {
  version: 1,
  generatedAt: new Date().toISOString(),
  entryRow,
  limits: { maxPaths, maxPathSteps, maxTotalSteps },
  summary: {
    banks: Object.keys(banks).length,
    totalRows: allRows.length,
    reachedRows: reachedRows.length,
    rowCoverage: allRows.length ? reachedRows.length / allRows.length : 0,
    sites: sites.size,
    edges: edges.size,
    opcodes: opcodes.size,
    choiceStates: choiceStates.length,
    pathsRun: pathCount,
    totalSteps,
    terminalHalts: terminals.filter(({ stop }) => stop === "halted").length,
    unimplementedPaths: terminals.filter(({ stop }) => stop === "unimplemented").length,
    queuedStates: queue.length,
    stopCounts,
    truncated,
  },
  reachedRows,
  unreachedRows: allRows.filter((row) => !rows.has(row)),
  rowVisits: Object.fromEntries([...rowVisits].sort(([a], [b]) => a - b)),
  opcodes: [...opcodes].sort((a, b) => a - b).map((opcode) => hex(opcode)),
  unimplemented: [...unimplemented].sort((a, b) => a - b).map((opcode) => hex(opcode)),
  choices: choiceStates.slice(0, reportItemLimit),
  terminals: terminals.slice(0, reportItemLimit),
  reportItems: {
    limit: reportItemLimit,
    choicesTotal: choiceStates.length,
    terminalsTotal: terminals.length,
    truncated: choiceStates.length > reportItemLimit || terminals.length > reportItemLimit,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
