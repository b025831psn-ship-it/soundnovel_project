import test from "node:test";
import assert from "node:assert/strict";
import { DmaController, GpuPorts, InterruptController, RootCounter, gpuDmaWords, installSystemDevices } from "../src/devices.js";
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

test("GPU ports expose ready status and observe GP0/GP1 commands", () => {
  const commands = [];
  const gpu = new GpuPorts({ command: (event) => commands.push(event) });
  const gp0 = gpu.gp0Device(), gp1 = gpu.gp1Device();
  assert.equal(gp1.read(), 0x14802000);
  gp0.write(0xe1000400);
  gp1.write(0x03000001);
  assert.equal(gp1.read() & (1 << 23), 1 << 23);
  gp1.write(0x04000002);
  assert.equal(gp1.read() >>> 29 & 3, 2);
  assert.deepEqual(commands.map((event) => event.port), ["gp0", "gp1", "gp1"]);
});

test("system device installation maps GPU MMIO ports", () => {
  const memory = new PsxMemory();
  const cpu = new R3000A({ memory });
  const { gpu } = installSystemDevices(memory, cpu);
  memory.set32(0x1f801810, 0xe1000200);
  assert.deepEqual(gpu.gp0, [0xe1000200]);
  assert.equal(memory.u32(0x1f801814), 0x14802000);
});

test("interrupt and timer registers accept 16-bit and 32-bit SDK accesses", () => {
  const memory = new PsxMemory();
  const cpu = new R3000A({ memory });
  const { counters } = installSystemDevices(memory, cpu);
  memory.set32(0x1f801074, 1 << 5);
  memory.set32(0x1f801118, 7);
  memory.set16(0x1f801114, 1 << 3);
  counters[1].tick(3);
  assert.equal(memory.u32(0x1f801110), 3);
  assert.equal(memory.u16(0x1f801118), 7);
  assert.equal(memory.u16(0x1f801074), 1 << 5);
});

test("DMA channel start is observed and clears its busy bit", () => {
  const transfers = [];
  const dma = new DmaController({ transfer: (event) => transfers.push(event) });
  dma.device(0x1f8010a0).write(0x00123456);
  dma.device(0x1f8010a4).write(0x00010020);
  dma.device(0x1f8010a8).write(0x01000401);
  assert.deepEqual(transfers, [{
    channel: 2,
    madr: 0x00123456,
    bcr: 0x00010020,
    chcr: 0x01000401,
  }]);
  assert.equal(dma.device(0x1f8010a8).read(), 0x00000401);
});

test("system device installation maps DMA registers", () => {
  const memory = new PsxMemory();
  const cpu = new R3000A({ memory });
  installSystemDevices(memory, cpu);
  memory.set32(0x1f8010f0, 0x07654321);
  assert.equal(memory.u32(0x1f8010f0), 0x07654321);
});

test("GPU DMA block mode reads RAM words in address order", () => {
  const memory = new PsxMemory();
  memory.set32(0x100, 0x11111111);
  memory.set32(0x104, 0x22222222);
  assert.deepEqual(gpuDmaWords(memory, { madr: 0x100, bcr: 2, chcr: 0x01000001 }), [
    0x11111111, 0x22222222,
  ]);
});

test("GPU DMA linked list follows packet pointers until the end marker", () => {
  const memory = new PsxMemory();
  memory.set32(0x100, (2 << 24) | 0x200);
  memory.set32(0x104, 0xaaaa0001);
  memory.set32(0x108, 0xbbbb0002);
  memory.set32(0x200, (1 << 24) | 0x00800000);
  memory.set32(0x204, 0xcccc0003);
  assert.deepEqual(gpuDmaWords(memory, { madr: 0x100, bcr: 0, chcr: 0x01000401 }), [
    0xaaaa0001, 0xbbbb0002, 0xcccc0003,
  ]);
});

test("installed GPU DMA forwards linked-list words to GP0", () => {
  const memory = new PsxMemory();
  const cpu = new R3000A({ memory });
  const events = [];
  installSystemDevices(memory, cpu, { gpuCommand: (event) => events.push(event) });
  memory.set32(0x100, (1 << 24) | 0x00800000);
  memory.set32(0x104, 0xe1000200);
  memory.set32(0x1f8010a0, 0x100);
  memory.set32(0x1f8010a8, 0x01000401);
  assert.deepEqual(events, [{ port: "gp0", value: 0xe1000200 }]);
});
