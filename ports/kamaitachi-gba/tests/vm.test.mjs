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
    0x00, 0x01, 0x02, 0x03, 0x04, 0x0d, 0x0e, 0x0f, 0x13, 0x1a, 0x21, 0x22,
    0x14, 0x15, 0x16, 0x1e, 0x23, 0x25, 0x40, 0x41, 0x4b, 0x4c, 0x56, 0x57, 0x5e,
    0x3c, 0x3d, 0x4e, 0x63,
  ];
  assert.ok(required.every((opcode) => HANDLERS[opcode]));
});

test("choice suppression table covers all 34 reviewed handlers and consumes arguments", () => {
  assert.equal(Object.keys(SUPPRESSION).length, 34);
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
    vm.ram.effectDisabled = 1;
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

test("bit and variable comparisons jump when set/equal", () => {
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
  assert.equal(vm.ram.bits[3], 0);
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
    banks: { 27: bank([[0x00, 0x82, 0xa0, 0x6e, 1, 0x72, 0x00]]) },
    text,
  });
  vm.step();
  assert.equal(vm.waiting, "click");
  assert.equal(text.fragments[1], "透");
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
