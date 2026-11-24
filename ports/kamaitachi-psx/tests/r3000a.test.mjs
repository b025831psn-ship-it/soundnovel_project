import assert from "node:assert/strict";
import test from "node:test";
import { PsxMemory, R3000A, loadPsxExe } from "../src/r3000a.js";

const r = (rs, rt, rd, shift, fn) => (rs << 21) | (rt << 16) | (rd << 11) | (shift << 6) | fn;
const i = (op, rs, rt, imm) => ((op << 26) | (rs << 21) | (rt << 16) | (imm & 0xffff)) >>> 0;
const j = (op, address) => ((op << 26) | ((address >>> 2) & 0x03ffffff)) >>> 0;

function cpuWith(words, pc = 0x80010000, options = {}) {
  const memory = new PsxMemory();
  words.forEach((word, index) => memory.set32(pc + index * 4, word));
  return new R3000A({ memory, pc, ...options });
}

test("branch executes its delay slot before the target", () => {
  const cpu = cpuWith([i(0x09, 0, 1, 1), i(0x04, 1, 1, 2), i(0x09, 0, 2, 7), i(0x09, 0, 2, 9), i(0x09, 0, 3, 11)]);
  for (let n = 0; n < 4; n++) cpu.step();
  assert.equal(cpu.regs[2], 7);
  assert.equal(cpu.regs[3], 11);
});

test("jal links PC+8 and returns through a jr delay slot", () => {
  const pc = 0x80010000;
  const cpu = cpuWith([j(0x03, pc + 16), i(0x09, 0, 4, 1), i(0x09, 0, 5, 2), 0,
    i(0x09, 0, 6, 3), r(31, 0, 0, 0, 0x08), i(0x09, 0, 7, 4)], pc);
  for (let n = 0; n < 6; n++) cpu.step();
  assert.equal(cpu.regs[31], pc + 8);
  assert.equal(cpu.regs[4], 1);
  assert.equal(cpu.regs[5], 2);
  assert.equal(cpu.regs[6], 3);
  assert.equal(cpu.regs[7], 4);
});

test("KSEG aliases read and write little-endian RAM", () => {
  const cpu = cpuWith([i(0x0f, 0, 1, 0x8000), i(0x0d, 1, 1, 0x0100), i(0x09, 0, 2, 0x1234),
    i(0x2b, 1, 2, 0), i(0x23, 1, 3, 0)]);
  for (let n = 0; n < 5; n++) cpu.step();
  assert.equal(cpu.memory.u32(0x00000100), 0x1234);
  assert.equal(cpu.regs[3], 0x1234);
  assert.equal(cpu.memory.u32(0x807ffffc), cpu.memory.u32(0x801ffffc));
});

test("BIOS hook returns to the caller without fetching BIOS memory", () => {
  const pc = 0x80010000;
  let called = 0;
  const hooks = new Map([[0xa0, (cpu) => {
    called++;
    assert.equal(cpu.regs[9], 0x39);
    cpu.pc = cpu.regs[31];
    cpu.nextPc = cpu.pc + 4;
  }]]);
  const cpu = cpuWith([j(0x03, pc + 16), 0, i(0x09, 0, 2, 5), 0,
    i(0x09, 0, 10, 0xa0), r(10, 0, 0, 0, 0x08), i(0x09, 0, 9, 0x39)], pc, { hooks });
  for (let n = 0; n < 7; n++) cpu.step();
  assert.equal(called, 1);
  assert.equal(cpu.regs[2], 5);
});

test("32-bit MMIO devices observe register reads and writes", () => {
  const memory = new PsxMemory();
  let written = 0;
  memory.map32(0x1f801074, { read: () => 0x12345678, write: (value) => { written = value; } });
  assert.equal(memory.u32(0xbf801074), 0x12345678);
  memory.set32(0x1f801074, 0x89abcdef);
  assert.equal(written, 0x89abcdef);
});

test("16-bit MMIO devices observe register reads and writes", () => {
  const memory = new PsxMemory();
  let written = 0;
  memory.map16(0x1f801074, { read: () => 0x5678, write: (value) => { written = value; } });
  assert.equal(memory.u16(0xbf801074), 0x5678);
  memory.set16(0x1f801074, 0xabcd);
  assert.equal(written, 0xabcd);
});

test("8-bit MMIO devices observe register reads and writes", () => {
  const memory = new PsxMemory();
  let written = 0;
  memory.map8(0x1f801800, { read: () => 0x34, write: (value) => { written = value; } });
  assert.equal(memory.u8(0xbf801800), 0x34);
  memory.set8(0x1f801800, 0xab);
  assert.equal(written, 0xab);
});

test("PS-X EXE loader copies payload and exposes entry registers", () => {
  const exe = new Uint8Array(0x808);
  exe.set(new TextEncoder().encode("PS-X EXE"));
  const view = new DataView(exe.buffer);
  view.setUint32(0x10, 0x80010004, true);
  view.setUint32(0x18, 0x80010000, true);
  view.setUint32(0x1c, 8, true);
  view.setUint32(0x30, 0x801ffff0, true);
  exe.set([1, 2, 3, 4, 5, 6, 7, 8], 0x800);
  const loaded = loadPsxExe(exe);
  assert.equal(loaded.pc, 0x80010004);
  assert.equal(loaded.stackAddress, 0x801ffff0);
  assert.deepEqual([...loaded.memory.bytes.subarray(0x10000, 0x10008)], [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("PS-X EXE loader derives GP and SP startup values", () => {
  const exe = new Uint8Array(0x804);
  exe.set(new TextEncoder().encode("PS-X EXE"));
  const header = new DataView(exe.buffer);
  header.setUint32(0x10, 0x80010000, true);
  header.setUint32(0x14, 0x80070000, true);
  header.setUint32(0x18, 0x80010000, true);
  header.setUint32(0x1c, 4, true);
  header.setUint32(0x30, 0x801ffff0, true);
  header.setUint32(0x34, 0x10, true);
  const loaded = loadPsxExe(exe);
  assert.equal(loaded.globalPointer, 0x80070000);
  assert.equal(loaded.stackAddress, 0x801ffff0);
  assert.equal(loaded.stackOffset, 0x10);
  assert.equal(loaded.stackPointer, 0x80200000);
});

test("variable shifts and multiply/divide use R3000A HI/LO", () => {
  const cpu = cpuWith([]);
  cpu.regs[1] = 4;
  cpu.regs[2] = 3;
  cpu.execute(r(1, 2, 3, 0, 0x04), cpu.pc);
  assert.equal(cpu.regs[3], 48);
  cpu.execute(r(1, 2, 0, 0, 0x18), cpu.pc);
  assert.equal(cpu.lo, 12);
  assert.equal(cpu.hi, 0);
  cpu.regs[1] = 13;
  cpu.regs[2] = 5;
  cpu.execute(r(1, 2, 0, 0, 0x1a), cpu.pc);
  assert.equal(cpu.lo, 2);
  assert.equal(cpu.hi, 3);
});

test("syscall delegates to the configured exception hook", () => {
  let code = null;
  const cpu = cpuWith([0x0001230c], 0x80010000, { syscall: (_cpu, value) => { code = value; } });
  cpu.step();
  assert.equal(code, 0x48c);
});

test("COP0 registers round-trip through mtc0 and mfc0", () => {
  const memory = new PsxMemory();
  memory.set32(0, 0x40826000); // mtc0 v0, Status
  memory.set32(4, 0x40036000); // mfc0 v1, Status
  const cpu = new R3000A({ memory });
  cpu.regs[2] = 0x00400401;
  cpu.step();
  cpu.step();
  assert.equal(cpu.cop0[12], 0x00400401);
  assert.equal(cpu.regs[3], 0x00400401);
});

test("accepted interrupts enter the COP0 exception vector and preserve EPC", () => {
  const cpu = new R3000A({ pc: 0x80012340 });
  cpu.cop0[12] = 0x00000401; // hardware interrupt 0 mask + current IE
  assert.equal(cpu.interrupt(0x400), true);
  assert.equal(cpu.pc, 0x80000080);
  assert.equal(cpu.nextPc, 0x80000084);
  assert.equal(cpu.cop0[14], 0x80012340);
  assert.equal((cpu.cop0[13] >>> 2) & 31, 0);
  assert.equal(cpu.cop0[12] & 0x3f, 0x04);
});

test("RFE restores the previous interrupt mode", () => {
  const memory = new PsxMemory();
  memory.set32(0, 0x42000010); // rfe
  const cpu = new R3000A({ memory });
  cpu.cop0[12] = 0x00000404;
  cpu.step();
  assert.equal(cpu.cop0[12], 0x00000401);
});

test("LWL and LWR merge an unaligned little-endian word", () => {
  const memory = new PsxMemory();
  memory.bytes.set([0xaa, 0x11, 0x22, 0x33, 0x44, 0xbb, 0xcc, 0xdd], 0x100);
  memory.set32(0, (0x22 << 26) | (1 << 21) | (2 << 16) | 3); // lwl v0,3(at)
  memory.set32(4, (0x26 << 26) | (1 << 21) | (2 << 16)); // lwr v0,0(at)
  const cpu = new R3000A({ memory });
  cpu.regs[1] = 0x101;
  cpu.regs[2] = 0xdeadbeef;
  cpu.step();
  cpu.step();
  assert.equal(cpu.regs[2], 0x44332211);
});

test("SWL and SWR store an unaligned little-endian word", () => {
  const memory = new PsxMemory();
  memory.bytes.fill(0xaa, 0x100, 0x108);
  memory.set32(0, (0x2a << 26) | (1 << 21) | (2 << 16) | 3); // swl v0,3(at)
  memory.set32(4, (0x2e << 26) | (1 << 21) | (2 << 16)); // swr v0,0(at)
  const cpu = new R3000A({ memory });
  cpu.regs[1] = 0x101;
  cpu.regs[2] = 0x44332211;
  cpu.step();
  cpu.step();
  assert.deepEqual([...memory.bytes.subarray(0x100, 0x106)], [0xaa, 0x11, 0x22, 0x33, 0x44, 0xaa]);
});
