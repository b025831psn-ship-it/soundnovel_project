import test from "node:test";
import assert from "node:assert/strict";
import { VM, HANDLERS, SUPPRESSION } from "../src/vm.js";
import { TextWindow } from "../src/font.js";

function bank(rows) {
  const tableBytes = rows.length * 2;
  const offsets = [];
  let cursor = tableBytes;
  for (const row of rows) {
    offsets.push(cursor);
    cursor += row.length;
  }
  return Uint8Array.from([
    ...offsets.flatMap((offset) => [offset & 255, offset >> 8]),
    ...rows.flat(),
  ]);
}

test("required opcode table retains native handler evidence", () => {
  const required = [
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x0d, 0x0e, 0x0f, 0x12, 0x13, 0x19, 0x1a, 0x21, 0x22,
    0x14, 0x15, 0x16, 0x18, 0x1e, 0x23, 0x25, 0x26, 0x27, 0x28,
    0x40, 0x41, 0x43, 0x44, 0x46, 0x47, 0x48, 0x4b, 0x4c, 0x54, 0x55, 0x56, 0x57, 0x5e, 0x61, 0x62,
    0x33, 0x36, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x4e, 0x4f, 0x51, 0x52, 0x59, 0x5a, 0x5b, 0x5c,
    0x5d, 0x60, 0x63,
  ];
  assert.ok(required.every((opcode) => HANDLERS[opcode]));
});

test("choice suppression table covers all 52 reviewed handlers and consumes arguments", () => {
  assert.equal(Object.keys(SUPPRESSION).length, 52);
  const calls = [];
  for (const [opcodeText, [gate, shape]] of Object.entries(SUPPRESSION)) {
    if (gate === "sets-77e" || gate === "78e-or-choice-return") continue;
    const opcode = Number(opcodeText);
    const args = shape ? shape.split(",").flatMap((type) => type === "u8" ? [1] : [1, 0]) : [];
    const vm = new VM({
      banks: { 27: bank([[opcode, ...args, 0x03]]) },
      scene: { request: () => calls.push("scene"), overlay: () => calls.push("overlay") },
      audio: { startSong: () => calls.push("audio"), stopSong: () => calls.push("audio"), immInit() {}, volumeControl() {} },
    });
    if (gate === "78e") vm.ram.effectBypass = 1;
    else vm.ram.effectDisabled = 1;
    vm.ram.flags.fill(7);
    vm.ram.bits.fill(7);
    const flags = [...vm.ram.flags], bits = [...vm.ram.bits];
    vm.step();
    assert.equal(vm.offset, vm.rows[27][0] + 1 + args.length, `opcode ${opcodeText}`);
    assert.equal(vm.ram.updatePending, 1, `opcode ${opcodeText}`);
    assert.deepEqual([...vm.ram.flags], flags, `opcode ${opcodeText}`);
    assert.deepEqual([...vm.ram.bits], bits, `opcode ${opcodeText}`);
    assert.equal(vm.waiting, "none", `opcode ${opcodeText}`);
  }
  assert.deepEqual(calls, []);
});

test("08 and 09 install native-duration brightness transitions", () => {
  const vm = new VM({ banks: { 27: bank([[0x09, 0x28, 0, 1, 0x08, 0x28, 0, 1]]) } });
  vm.step();
  assert.deepEqual(vm.ram.brightness[1], {
    current: 0, target: 0x8000, delta: Math.trunc(0x8000 / 30),
    duration: 30, maximum: 0x10000,
  });
  assert.equal(vm.ram.brightness[5].target, 0x8000);
  for (let frame = 0; frame < 30; frame++) vm.vblank(0);
  assert.equal(vm.ram.brightness[1].current, 0x8000);
  vm.step();
  assert.equal(vm.ram.brightness[1].target, 0);
  assert.equal(vm.ram.brightness[1].duration, 30);
});

test("LE row IDs, jump, call and return use row tables", () => {
  const banks = {
    27: bank([
      [0x02, 0x7a, 0x69, 0x01, 0x79, 0x69],
      [0x03],
      [0x41, 2, 7, 0x03],
    ]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.vars[2], 7);
  assert.equal(vm.ram.stack.length, 0);
});

test("shared flags and branch directions match native meanings", () => {
  const banks = {
    27: bank([
      [0x0d, 4, 0x0f, 4, 0x7a, 0x69, 0x41, 1, 1],
      [0x03],
      [0x1a, 4, 0x0e, 4, 0x7b, 0x69],
      [0x41, 1, 9, 0x03],
    ]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.flags[4], 0);
  assert.equal(vm.ram.vars[1], 9);
});

test("flow-mask and variable comparisons jump when set/equal", () => {
  const banks = {
    27: bank([
      [0x21, 3, 0x25, 3, 0x7a, 0x69],
      [0x03],
      [0x41, 5, 6, 0x40, 5, 6, 0x7b, 0x69],
      [0x5e, 3, 0x7c, 0x69, 0x34, 0x12],
      [0x22, 3, 0x03],
    ]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.flowMask, 0);
  assert.equal(vm.ram.vars[5], 6);
});

test("23 only changes group and 56 ignores its key while jumping", () => {
  const banks = {
    27: bank([[0x23, 10, 99, 0x56, 0x79, 0x69, 0x78, 0x56], [0x03]]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.group, 2);
  assert.equal(vm.ram.vars[99], 0);
});

test("13 and 57 consume all variable-length choice entries", () => {
  const vm13 = new VM({ banks: { 27: bank([[0x13, 1, 0, 1, 0, 2, 0]]) } });
  vm13.step();
  assert.deepEqual(vm13.choiceState.entries, [{ row: 1 }, { row: 2 }]);
  const vm57 = new VM({
    banks: { 27: bank([[0x57, 1, 2, 1, 0, 10, 0, 2, 0, 11, 0]]) },
  });
  vm57.step();
  assert.deepEqual(vm57.choiceState.entries, [
    { row: 1, key: 10 },
    { row: 2, key: 11 },
  ]);
});

test("00 text scans CP932 pairs and control arguments", () => {
  const text = new TextWindow({ 1: "透" });
  const vm = new VM({
    banks: { 27: bank([[0x00, 0x82, 0xa0, 0x6e, 1, 0x72, 0x70, 0x00]]) },
    text,
  });
  vm.step();
  assert.equal(vm.waiting, "click");
  assert.equal(text.fragments[1], "透");
  assert.equal(text.fragments[2], "\n");
});

test("04 uses a little-endian request", () => {
  let request;
  const vm = new VM({
    banks: { 27: bank([[0x04, 0x34, 0x12, 0x03]]) },
    scene: {
      request: (value) => {
        request = value;
      },
    },
  });
  vm.step();
  assert.equal(request, 0x1234);
});

test("05 loads a little-endian scene in native mode 1", () => {
  const calls = [];
  const vm = new VM({
    banks: { 27: bank([[0x05, 0x83, 0x00]]) },
    scene: { request: (...args) => calls.push(args) },
  });
  vm.step();
  assert.equal(calls[0][0], 0x83);
  assert.equal(calls[0][2], 1);
});

function recorder() {
  const calls = [];
  return {
    calls,
    startSong: (song) => calls.push(["start", song]),
    stopSong: (song) => calls.push(["stop", song]),
    immInit: (player) => calls.push(["init", player]),
    volumeControl: (player, bits, volume) => calls.push(["volume", volume]),
  };
}
const audioTables = {
  requestSong: [5, 8, 13, -1],
  volume: [0x100, 0x100, 0x100, 0x100],
  length: [[-1, 0], [-1, 0], [3, 1], [-1, 0]],
};

test("30/31/32 run the native audio controller (0800A510, 0800A4CC)", () => {
  const audio = recorder();
  const vm = new VM({
    banks: {
      27: bank([
        [0x30, 1, 0, 0x31, 10, 0, 1, 0, 0x32, 20, 0, 2, 0, 0x30, 3, 0, 0x03],
      ]),
    },
    audio,
    audioTables,
  });
  vm.step(); // 30 1: start song 8 at full volume
  assert.deepEqual(audio.calls.splice(0), [["stop", 8], ["start", 8], ["init", 0], ["volume", 0x100]]);
  assert.equal(vm.ram.audioRequest, 1);
  vm.step(); // 31 10,1: fade out over 100 frames, request kept until it ends
  assert.deepEqual(audio.calls.splice(0), []);
  assert.equal(vm.sound.fadeLeft, 100);
  vm.step(); // 32 20,2: one frame, then song 13 fading in over 200 frames
  assert.equal(vm.waiting, "audio-start");
  vm.vblank(0); // 0800A510 starts request 2, then the frame wait's 0800A414 takes its first fade-in step
  assert.deepEqual(audio.calls.splice(0), [
    ["stop", 13], ["start", 13], ["init", 0], ["volume", 0x4000], ["volume", 64],
  ]);
  assert.equal(vm.sound.fadeLeft, 199);
  assert.equal(vm.ram.audioRequest, 2);
});

test("30 and 32 execute an immediately following 00 before audio work", () => {
  for (const opcode of [0x30, 0x32]) {
    const events = [], audio = recorder();
    audio.startSong = (song) => events.push(["audio", song]);
    const header = opcode === 0x30 ? [opcode, 1, 0] : [opcode, 0, 0, 1, 0];
    const vm = new VM({
      banks: { 27: bank([[...header, 0x00, 0x82, 0xa0, 0x72, 0x00, 0x03]]) },
      text: { feed: (raw) => { events.push(["text", ...raw]); return "click"; } },
      audio,
      audioTables,
    });
    vm.step();
    assert.deepEqual(events[0], ["text", 0x82, 0xa0, 0x72], `opcode ${opcode}`);
    assert.equal(vm.banks[vm.bank][vm.offset], 0x03, `opcode ${opcode}`);
    if (opcode === 0x30) {
      assert.deepEqual(events[1], ["audio", 8]);
      assert.equal(vm.waiting, "click");
    } else {
      assert.equal(events.length, 1);
      assert.equal(vm.waiting, "audio-start");
      vm.vblank(0);
      assert.deepEqual(events[1], ["audio", 8]);
      assert.equal(vm.waiting, "click");
    }
  }
});

test("34 waits while a request with a play length is playing", () => {
  const audio = recorder();
  const vm = new VM({
    banks: { 27: bank([[0x30, 2, 0, 0x34, 2, 0, 0x03]]) },
    audio,
    audioTables,
  });
  vm.step();
  vm.step();
  assert.equal(vm.waiting, "audio");
  let frames = 0;
  while (vm.waiting === "audio") { vm.vblank(0); frames++; }
  // One frame before the loop; the interrupt counts the 3-frame length down and the next
  // 0800A414 stops the request (frame 4); then the two closing frames.
  assert.equal(vm.sound.request, -1);
  assert.equal(frames, 6);
});

test("45 skips the following 0A only outside effect-bypass state", () => {
  const row = [0x45, 1, 0, 2, 0, 0x0a, 7, 0x04, 3, 0, 0x03];
  const normal = new VM({ banks: { 27: bank([row]) } });
  normal.step();
  assert.equal(normal.banks[normal.bank][normal.offset], 0x04);
  const bypass = new VM({ banks: { 27: bank([row]) } });
  bypass.ram.effectBypass = 1;
  bypass.step();
  assert.equal(bypass.banks[bypass.bank][bypass.offset], 0x0a);
});

test("2D loads its native effect id without introducing a wait", () => {
  const calls = [];
  const vm = new VM({
    banks: { 27: bank([[0x2d, 0x00, 0x00, 0x20, 0x3e]]) },
    scene: { overlay: (request) => calls.push(request) },
  });
  vm.ram.overlayMasks.set([0x2000, 13, 7, 0]);
  vm.step();
  assert.deepEqual(calls, [0x2000]);
  assert.equal(vm.waiting, "none");
  assert.equal(vm.ram.overlayActive, 1);
  assert.deepEqual([...vm.ram.overlayMasks], [0xffff, 13, 7, 0]);
  vm.step();
  assert.equal(vm.halted, false);
});

test("2D combines its high byte with the little-endian effect word", () => {
  const calls = [];
  const vm = new VM({
    banks: { 27: bank([[0x2d, 0x12, 0x56, 0x34]]) },
    scene: { overlay: (request) => calls.push(request) },
  });
  vm.step();
  assert.deepEqual(calls, [0x4656]);
});

test("2D bypass conditions set only the shared update flag", () => {
  for (const field of ["effectDisabled", "effectBypass"]) {
    const calls = [];
    const vm = new VM({
      banks: { 27: bank([[0x2d, 0, 0x20, 0]]) },
      scene: { overlay: (request) => calls.push(request) },
    });
    vm.ram[field] = 1;
    vm.ram.overlayMasks[0] = 0x2000;
    vm.step();
    assert.deepEqual(calls, []);
    assert.equal(vm.ram.updatePending, 1);
    assert.equal(vm.ram.overlayActive, 0);
    assert.equal(vm.ram.overlayMasks[0], 0x2000);
  }
});

test("2D compares the native mask entries as signed halfwords", () => {
  const vm = new VM({
    banks: { 27: bank([[0x2d, 0, 0, 0x80]]) },
  });
  vm.ram.overlayMasks[0] = 0x8000;
  vm.step();
  assert.equal(vm.ram.overlayMasks[0], 0x8000);
});

test("2F reads a little-endian request and stops the current one (0800A4CC with speed 0)", () => {
  const audio = recorder();
  const vm = new VM({
    banks: { 27: bank([[0x30, 1, 0, 0x2f, 1, 0, 0x2f, 0x4c, 0x04]]) },
    audio,
    audioTables,
  });
  vm.step();
  audio.calls.length = 0;
  vm.step();
  assert.deepEqual(audio.calls, [["stop", 8]]);
  assert.equal(vm.ram.audioRequest, 0xffff);
  assert.equal(vm.ram.audioScene, 0xffff);
  assert.equal(vm.ram.updatePending, 1);
  vm.step(); // 1100 is an effect stop; effect programs are not ported yet
  assert.equal(vm.waiting, "none");
  vm.vblank(0);
  assert.equal(vm.ram.updatePending, 0);
});

test("2F bypass conditions preserve audio state and set update pending", () => {
  for (const field of ["effectDisabled", "effectBypass"]) {
    const audio = recorder();
    const vm = new VM({
      banks: { 27: bank([[0x30, 1, 0, 0x2f, 1, 0]]) },
      audio,
      audioTables,
    });
    vm.step();
    audio.calls.length = 0;
    vm.ram[field] = 1;
    vm.step();
    assert.deepEqual(audio.calls, []);
    assert.equal(vm.sound.request, 1);
    assert.equal(vm.ram.updatePending, 1);
  }
});

test("opening effect opcodes preserve alignment through the first choice", () => {
  const row = [
    0x29, 2, 0xf6, 0x00, 0x2e, 1, 10, 0x5f, 3, 0, 0x58, 4, 0, 0x15, 0x2c, 0x35,
    1, 5, 0, 0x1c, 7, 0x37, 8, 0, 0x3e, 0x57, 1, 0, 1, 0, 2, 0, 2, 0, 3, 0, 0x16,
  ];
  const vm = new VM({ banks: { 27: bank([row]) } });
  while (vm.step());
  assert.equal(vm.waiting, "choice");
  assert.deepEqual(vm.choiceState.entries, [
    { row: 1, key: 2 },
    { row: 2, key: 3 },
  ]);
});

test("17 skips an already-rendered label through its 15 terminator", () => {
  const vm = new VM({
    banks: { 27: bank([[0x17, 0x00, 0x82, 0x60, 0x00, 0x15, 0x41, 3, 9]]) },
  });
  vm.step();
  assert.equal(vm.banks[vm.bank][vm.offset], 0x41);
  vm.step();
  assert.equal(vm.ram.vars[3], 9);
});

test("1D consumes its command and delegates the native system table", () => {
  const calls = [];
  const vm = new VM({
    banks: { 27: bank([[0x1d, 4, 0x41, 2, 7]]) },
    system: { command: (command) => { calls.push(command); return { inputReady: true }; } },
  });
  vm.step();
  assert.deepEqual(calls, [4]);
  assert.equal(vm.ram.inputReady, 1);
  vm.step();
  assert.equal(vm.ram.vars[2], 7);
});

test("boot-path opcodes 3C, 3D, 4E and 63 preserve native alignment", () => {
  const calls = [];
  const vm = new VM({
    banks: { 31: bank([[0x3c, 4, 9, 0x3d, 0x4e, 0x63, 0x41, 2, 7]]) },
    entryRow: 31000,
    trace: ({ opcode, args }) => calls.push([opcode, args]),
  });
  while (vm.step());
  assert.deepEqual(calls.slice(0, 4), [
    [0x3c, [4, 9]], [0x3d, []], [0x4e, []], [0x63, []],
  ]);
  assert.equal(vm.ram.vars[2], 7);
});

test("12 and 43 emit native system cues; 44 hands the screen to the host's ending()", () => {
  const calls = [];
  const vm = new VM({
    banks: { 27: bank([[0x12, 0x43, 0x34, 0x12, 0x44, 0x41, 3, 9]]) },
    system: { cue: (...args) => calls.push(args.slice(0, 2)), ending: () => ({ waiting: "boot" }) },
  });
  vm.step();
  vm.step();
  vm.step();
  assert.deepEqual(calls, [[0x12, 0], [0x43, 0x1234], [0x44, 0]]);
  assert.equal(vm.waiting, "boot");
  vm.waiting = "none";
  vm.step();
  assert.equal(vm.ram.vars[3], 9);
});

test("54/55 use scenario byte flags while 5D/5E use the saved 16-bit flow mask", () => {
  const run = (opcode, { bit = 0, mask = 0 } = {}) => {
    const vm = new VM({
      banks: { 27: bank([
        [opcode, 3, 0x79, 0x69, 4, 0, 0x03],
        [0x41, 7, 9],
      ]) },
    });
    vm.ram.flags[3] = bit;
    vm.ram.flowMask = mask;
    vm.step();
    return vm;
  };

  for (const [opcode, state] of [
    [0x54, { bit: 0 }], [0x55, { bit: 1 }],
    [0x5d, { mask: 0 }], [0x5e, { mask: 1 << 2 }],
  ]) {
    const vm = run(opcode, state);
    assert.equal(vm.offset, vm.rows[27][1], `opcode ${opcode.toString(16)} did not branch`);
    assert.equal(vm.ram.edges[4], 3);
  }
  assert.notEqual(run(0x54, { bit: 1 }).offset, run(0x54, { bit: 1 }).rows[27][1]);
  assert.notEqual(run(0x5e, { mask: 0 }).offset, run(0x5e, { mask: 0 }).rows[27][1]);
});

test("5A, 5C and 60 retain native widths and frame-flag write", () => {
  const vm = new VM({
    banks: { 27: bank([[0x5a, 7, 0x5c, 8, 9, 0x60, 0x34, 0x41, 2, 6, 0x03]]) },
  });
  while (vm.step());
  assert.equal(vm.ram.frameFlag, 0x34);
  assert.equal(vm.ram.vars[2], 6);
  assert.equal(vm.unimplemented.size, 0);
});

test("19, 46, 47, 48, 61 and 62 preserve native operand widths and system state", () => {
  const calls = [];
  const vm = new VM({
    banks: { 27: bank([[0x19, 0x34, 0x12, 0x46, 4, 0x47, 5, 0x48, 6,
      0x61, 0x78, 0x56, 0x62, 0x7a, 0x56]]) },
    system: { cue: (...args) => calls.push(args.slice(0, 2)) },
  });
  while (vm.step());
  assert.deepEqual(calls, [[0x19, 0x1234]]);
  assert.equal(vm.ram.system46, 4);
  assert.equal(vm.ram.system47, 5);
  assert.equal(vm.ram.system48, 6);
  assert.equal(vm.ram.clockTarget, 0x5678);
  assert.equal(vm.ram.updatePending, 1);
  vm.step();
  assert.equal(vm.waiting, "clock");
  vm.vblank(0);
  vm.vblank(0);
  assert.equal(vm.ram.clockTarget, 0x567a);
  assert.equal(vm.waiting, "none");
});

test("captured transition timing holds dispatch and carries audio gates", () => {
  const row = [0x04, 1, 0, 0x41, 2, 7];
  const vm = new VM({
    banks: { 27: bank([row]) },
    transitionTimings: { sites: { "1b:2": [
      { opcode: 4, frames: 3, audioFrame: "000", audioIrq: "100" },
    ] } },
  });
  vm.step();
  assert.equal(vm.waiting, "transition");
  assert.equal(vm.skipAudioFrame, true);
  vm.vblank();
  vm.vblank();
  assert.equal(vm.ram.vars[2], 0);
  vm.vblank();
  assert.equal(vm.ram.vars[2], 7);
  assert.equal(vm.waiting, "none");
});

test("bookmark return keeps two path frames plus the six-frame scene decode", () => {
  const trace = [];
  const vm = new VM({
    banks: { 31: bank([[0x40, 0, 1, 0, 0, 0x04, 0x34, 0x12, 0x09, 0, 0, 0]]) },
    entryRow: 31000,
    trace: (entry) => trace.push(entry),
    transitionTimings: { sites: {
      "1f:2": [{ opcode: 0x40, frames: 2, audioFrame: "11", audioIrq: "11" }],
      "1f:7": [{ opcode: 0x04, frames: 6, audioFrame: "000000", audioIrq: "100000" }],
    } },
  });
  vm.step();
  assert.equal(vm.waiting, "transition");
  for (let frame = 1; frame < 8; frame++) {
    vm.vblank();
    assert.ok(!trace.some((entry) => entry.opcode === 0x09),
      `opcode 09 dispatched before native frame 8 (frame ${frame})`);
  }
  vm.vblank();
  assert.equal(vm.waiting, "none");
  assert.equal(trace.find((entry) => entry.opcode === 0x09)?.frame, 8);
});

test("59 waits for the captured native presentation interval", () => {
  const vm = new VM({
    banks: { 27: bank([[0x59, 0x41, 1, 9]]) },
    transitionTimings: { sites: { "1b:2": [
      { opcode: 0x59, frames: 2, audioFrame: "11", audioIrq: "11" },
    ] } },
  });
  vm.step();
  assert.equal(vm.waiting, "transition");
  vm.vblank();
  assert.equal(vm.ram.vars[1], 0);
  vm.vblank();
  assert.equal(vm.ram.vars[1], 9);
});

test("5B consumes its operand and skips the native 33-byte inline block", () => {
  const inline = Array(0x21).fill(0xaa);
  const vm = new VM({
    banks: { 27: bank([[0x5b, 2, ...inline, 0x41, 4, 8]]) },
  });
  vm.step();
  assert.equal(vm.banks[vm.bank][vm.offset], 0x41);
  vm.step();
  assert.equal(vm.ram.vars[4], 8);
});

test("1C 14 consumes a following 1C 00 pair like 0800913E", () => {
  const vm = new VM({
    banks: { 27: bank([[0x1c, 0x14, 0x1c, 0x00, 0x41, 2, 6]]) },
  });
  vm.step();
  assert.equal(vm.banks[vm.bank][vm.offset], 0x41);
  vm.step();
  assert.equal(vm.ram.vars[2], 6);
});

test("57 runs candidate bytecode in collection mode and 16 opens the choice", () => {
  const rows = [
    [0x57, 1, 11, 0x79, 0x69, 5, 0, 0x7a, 0x69, 7, 0,
      0x02, 0x79, 0x69, 0x02, 0x7a, 0x69, 0x16],
    [0x00, 0x82, 0x60, 0x00, 0x15],
    [0x00, 0x82, 0x61, 0x00, 0x15],
  ];
  const text = new TextWindow();
  const opcodes = [];
  const vm = new VM({
    banks: { 27: bank(rows) }, text,
    trace: ({ opcode }) => opcodes.push(opcode),
  });
  while (vm.step());
  assert.equal(vm.waiting, "choice");
  assert.deepEqual(opcodes, [0x57, 0x02, 0x00, 0x15, 0x02, 0x00, 0x15, 0x16]);
  assert.deepEqual([...text.choiceRaw[0][0]], [0x82, 0x60]);
  assert.deepEqual([...text.choiceRaw[1][0]], [0x82, 0x61]);
  assert.equal(vm.ram.effectDisabled, 1);
  vm.resume(1);
  assert.equal(vm.ram.effectDisabled, 0);
  assert.equal(vm.offset, vm.rows[27][2]);
});

test("08007880 codes: r breaks the line, p waits, o moves the wait to g, quotes keep r", () => {
  const sjis = (s) => [...s].map((c) => c.charCodeAt(0));
  const text = new TextWindow();
  // r p: a new line, then the wait.
  assert.equal(text.feed(new Uint8Array([0x82, 0xa0, ...sjis("rp")])), "click");
  text.resumed();
  assert.deepEqual(text.fragments.slice(1), ["\n"]);
  // A lone p waits without a new line; a second p before any glyph does not wait again.
  text.feed(new Uint8Array(sjis("g")));
  assert.equal(text.feed(new Uint8Array([0x82, 0xa2, ...sjis("p")])), "click");
  assert.equal(text.feed(new Uint8Array(sjis("p"))), "none");
  assert.equal(text.fragments.length, 1);
  // p g: waits, the page stays until the press, then is cleared at once.
  text.feed(new Uint8Array(sjis("g")));
  assert.equal(text.feed(new Uint8Array([0x82, 0xa4, ...sjis("pg")])), "click");
  assert.equal(text.fragments.length, 1);
  text.resumed();
  assert.equal(text.fragments.length, 0);
  // o r p: no new line and no wait; the page's g waits instead before clearing.
  assert.equal(text.feed(new Uint8Array([0x82, 0xa0, ...sjis("orp")])), "none");
  assert.equal(text.fragments.length, 1);
  assert.equal(text.feed(new Uint8Array([0x82, 0xa2, ...sjis("g")])), "click");
  text.resumed();
  assert.equal(text.fragments.length, 0);
  // Inside 「」 an r is skipped and P does not wait; after 」 they work again. @ always breaks.
  assert.equal(text.feed(new Uint8Array([0x81, 0x75, 0x82, 0xa0, ...sjis("rP"), 0x81, 0x76, ...sjis("rP")])), "click");
  assert.deepEqual(text.fragments.map((f) => (typeof f === "string" ? f : f[1])), [0x75, 0xa0, 0x76, "\n"]);
  text.feed(new Uint8Array(sjis("g")));
  text.feed(new Uint8Array([0x82, 0xa0, ...sjis("@")]));
  assert.equal(text.fragments[1], "\n");
});

test("a wait in the middle of a run stops the window there; the press reads on", () => {
  const sjis = (s) => [...s].map((c) => c.charCodeAt(0));
  const text = new TextWindow();
  const vm = new VM({ banks: { 27: bank([[0x00, 0x82, 0xa0, ...sjis("rp"), 0x82, 0xa2, ...sjis("p")], [0x00]]) }, text });
  vm.step();
  assert.equal(vm.waiting, "click");
  assert.equal(text.fragments.length, 2); // あ and the new line, not い yet
  vm.resume();
  assert.equal(vm.waiting, "click");
  assert.equal(text.fragments.length, 3);
  assert.equal(text.pageRaw.length, 1);
});

test("opcode 13 disables effects while it collects labels", () => {
  const vm = new VM({ banks: { 27: bank([[0x13, 1, 1, 0x79, 0x69, 0x02, 0x16], [0x00]]) }, text: new TextWindow() });
  vm.step();
  assert.equal(vm.ram.choiceActive, 1);
  assert.equal(vm.ram.effectDisabled, 1);
});

test("the page after a p g page records its start (bookmark page-start hook)", () => {
  const sjis = (s) => [...s].map((c) => c.charCodeAt(0));
  const text = new TextWindow();
  const starts = [];
  const vm = new VM({ banks: { 27: bank([[0x00, 0x82, 0xa0, ...sjis("pg"), 0x00], [0x00, 0x82, 0xa2, ...sjis("pg"), 0x00]]) }, text });
  vm.onPageStart = (b, offset) => starts.push(offset);
  while (vm.step());
  assert.equal(vm.waiting, "click");
  vm.resume();
  while (vm.step());
  assert.deepEqual(starts, [vm.rows[27][0], vm.rows[27][1]]);
});

// 2B (080065A8), 3F (0800516C skips seven bytes unless 続ける was chosen) and 64 (music stop).
test("2B sets a brightness maximum, 3F skips seven bytes, 64 stops the music", () => {
  const stops = [];
  const vm = new VM({ banks: { 27: bank([[0x2b, 0x80, 0x00, 1, 0x3f, 0, 1, 2, 3, 4, 5, 6, 7, 0x64, 0x03]]) } });
  vm.sound.stop = (speed) => stops.push(speed);
  vm.step();
  assert.equal(vm.ram.brightness[1].maximum, 0x8000);
  assert.equal(vm.ram.brightness[1].current, 0x4000);
  vm.step();
  assert.equal(vm.offset, vm.rows[27][0] + 4 + 2 + 7);
  vm.step();
  assert.deepEqual(stops, [0]);
});
