import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { runScenarioSlice } from "../src/scenario.mjs";

const [exePath, cpuPath] = process.argv.slice(2);
const { Mips } = await import(pathToFileURL(resolve(cpuPath)));
const cpu = new Mips();
cpu.loadExe(await readFile(exePath));
cpu.r[29] = 0x801ff000;
cpu.r[28] = 0x80090000;
const base = 0x80140000;
const cursor = cpu.r[28] + 0x6fc;
const scene = 0x80160000;
const calls = [];
// Stub the service boundary, leaving dispatch, markers, PC writes and yields native.
for (let opcode = 1; opcode <= 0x2e; opcode++) {
  if (opcode === 0x24) continue;
  let pc = cpu.u32(0x80011e9c + 4 * opcode);
  for (let steps = 0; steps < 8; steps++, pc += 4) {
    const word = cpu.u32(pc);
    if (word >>> 26 === 2) pc = (0x80000000 + ((word & 0x03ffffff) * 4)) - 4;
    if (word >>> 26 !== 3) continue;
    const target = 0x80000000 + ((word & 0x03ffffff) * 4);
    cpu.hooks.set(target, c => {
      calls.push(target);
      c.ret();
    });
    break;
  }
}
let wait = 0;
cpu.hooks.set(0x8002f328, c => { c.r[2] = wait; c.ret(); });
cpu.hooks.set(0x80028780, c => { c.r[2] = scene; c.ret(); });
for (const busy of [0, 1]) {
  cpu.write(scene + 0x1f, busy, 1);
  for (wait of [0, 1, 2]) {
    for (let op = 0; op <= 0x2f; op++) {
      const bytes = new Uint8Array(14);
      bytes.set([0x40, op]);
      bytes.set([0x40, 0x24], op === 0 ? 10 : 2);
      cpu.setBytes(base, bytes);
      cpu.write(cursor, base, 4);
      calls.length = 0;
      cpu.call(0x80024bfc, [], 5000);
      const jsCalls = [];
      const state = {bytes, pc: 0};
      runScenarioSlice(state, {
        execute(address, opcode, offset) { jsCalls.push(address); return offset; },
        waitStatus: () => wait,
        sceneBusy: () => busy,
      });
      assert.equal(state.pc, cpu.u32(cursor) - base, "PC mismatch for " + op);
      assert.deepEqual(jsCalls, calls, "handler mismatch for " + op);
    }
  }
}
console.log("288 dispatch cases matched the original PC and handler call sequence");
