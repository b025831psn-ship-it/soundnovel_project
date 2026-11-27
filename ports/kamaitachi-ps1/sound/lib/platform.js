// What the sound library needs from libetc/libapi/the BIOS, for the browser build:
// interrupt and VSync callbacks, critical sections and the SPU transfer event.
// The browser has no interrupts; the player drives ticks itself and reads the
// callbacks registered here. Under the oracle (tools/oracle/hybrid.mjs) these calls
// run the game's own code instead.
//
// libetc keeps part of its state in RAM just below libsnd's pitch table (0x800786a0), and
// the original pitch lookup (0x8005bf88/0x8005c05c) reads that RAM as table entries for
// notes below the table. So the words libetc stores at 0x80078540-0x8007869f are kept in
// RAM here too, at the same addresses, with the values the original stores.
const ETC_INT_TABLE = 0x80078564, ETC_VSYNC_TABLE = 0x80078574; // set by ResetCallback
const ETC_VSYNC_FN = 0x800785b0, ETC_DMA_FN = 0x800785d4; // VSyncCallback, DMACallback(ch)

export class JsPlatform {
  constructor(mem = null) { this.mem = mem; this.callbacks = new Map(); this.vsync = 0; this.events = 0; this.reset = false; }
  w(a, v) { this.mem?.write(a, v >>> 0, 4); }
  // 0x80053318 ResetCallback
  resetCallback() {
    if (!this.reset) { this.reset = true; this.callbacks.clear(); this.vsync = 0; this.w(ETC_INT_TABLE, 0x80053d94); this.w(ETC_VSYNC_TABLE, 0x80053b6c); }
    return 0;
  }
  // 0x80053348 InterruptCallback(irq, fn): returns the previous handler.
  intCallback(irq, fn) { const old = this.callbacks.get(irq) ?? (irq === 0 ? 0x80053b00 : 0); this.callbacks.set(irq, fn >>> 0); return old | 0; }
  // 0x80053378 DMACallback(ch, fn)
  dmaCallback(ch, fn) { const old = this.callbacks.get(0x100 + ch) ?? 0; this.callbacks.set(0x100 + ch, fn >>> 0); this.w(ETC_DMA_FN + ch * 4, fn); return old | 0; }
  // 0x800533a8 VSyncCallback(fn)
  vsyncCallbacks(fn) { const old = this.vsync; this.vsync = fn >>> 0; this.w(ETC_VSYNC_FN, fn); return old | 0; }
  enterCriticalSection() { return 1; } // 0x8004e688
  exitCriticalSection() { return 0; } // 0x8004e698
  openEvent() { return (0xf1000004 + this.events++) | 0; } // 0x8005e828 OpenEvent
  enableEvent() { return 1; } // 0x8005e838 EnableEvent
}
