// Adapts the 65c816 VM (sfc-vm/machine.js) to runRealtime: after each run it syncs the
// APU to the VM's master clock so audio keeps flowing between the game's port accesses.
export class VmSound {
  constructor(machine) { this.m = machine; this.link = machine.bus.masterLink; }
  get time() { return this.m.time; }
  get end() { return this.m.end; }
  get frame() { return this.m.frame; }
  runTo(sec) { this.m.runTo(sec); this.link?.sync(this.m.master); }
}

// Controller bits as the VM latches them: $4218 in the low byte, $4219 in the high byte.
export const PAD = {
  A: 0x0080, X: 0x0040, L: 0x0020, R: 0x0010,
  RIGHT: 0x0100, LEFT: 0x0200, DOWN: 0x0400, UP: 0x0800,
  START: 0x1000, SELECT: 0x2000, Y: 0x4000, B: 0x8000,
};
// Same layout in every port (issue #41): Z / Enter decide, X cancels.
export const DEFAULT_KEYS = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  KeyZ: 'A', Enter: 'A', NumpadEnter: 'A', KeyX: 'B', KeyC: 'X', KeyA: 'Y', KeyQ: 'L', KeyW: 'R',
  Space: 'START', ShiftRight: 'SELECT', ShiftLeft: 'SELECT',
};
