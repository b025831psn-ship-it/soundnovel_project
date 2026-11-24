import test from "node:test";
import assert from "node:assert/strict";
import { InterruptController, RootCounter, installSystemDevices } from "../src/devices.js";
import { PsxMemory, R3000A } from "../src/r3000a.js";

test("I_STAT and I_MASK drive and acknowledge the shared hardware IRQ line", () => {
  const levels = [];
  const irq = new InterruptController({ line: (active) => levels.push(active) });
  irq.setMask(1 << 2);
  irq.raise(2);
  assert.equal(irq.status, 1 << 2);
  assert.equal(levels.at(-1), true);
  irq.acknowledge(0xfffb);
  assert.equal(irq.status, 0);
  assert.equal(levels.at(-1), false);
});

test("root counter reaches target, resets, and requests its interrupt", () => {
  const events = [];
  const counter = new RootCounter({ interrupt: (reason) => events.push(reason) });
  counter.targetDevice().write(3);
  counter.modeDevice().write((1 << 3) | (1 << 4));
  counter.tick(3);
  assert.equal(counter.count, 0);
  assert.deepEqual(events, ["target"]);
  assert.equal(counter.modeDevice().read() & (1 << 10), 1 << 10);
  assert.equal(counter.modeDevice().read() & (1 << 10), 0);
});

test("installed timer IRQ enters the CPU exception vector", () => {
  const memory = new PsxMemory();
  const cpu = new R3000A({ memory, pc: 0x80012340 });
  const { counters } = installSystemDevices(memory, cpu);
  cpu.cop0[12] = 0x00000401;
  memory.set16(0x1f801074, 1 << 4);
  memory.set16(0x1f801108, 2);
  memory.set16(0x1f801104, (1 << 3) | (1 << 4));
  counters[0].tick(2);
  assert.equal(cpu.pc, 0x80000080);
  assert.equal(cpu.cop0[14], 0x80012340);
  assert.equal(memory.u16(0x1f801070), 1 << 4);
  memory.set16(0x1f801070, 0xffef);
  assert.equal(cpu.cop0[13] & 0x400, 0);
});
