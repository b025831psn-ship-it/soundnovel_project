// What the sound library needs from libetc/libapi/the BIOS, for the browser build:
// interrupt and VSync callbacks, critical sections and the SPU transfer event.
// The browser has no interrupts; the player drives ticks itself and reads the
// callbacks registered here. Under the oracle (tools/oracle/hybrid.mjs) these calls
// run the game's own code instead.
export class JsPlatform {
  constructor() { this.callbacks = new Map(); this.vsync = 0; this.events = 0; }
  resetCallback() { this.callbacks.clear(); this.vsync = 0; return 0; } // 0x80053318 ResetCallback
  intCallback(irq, fn) { const old = this.callbacks.get(irq) ?? 0; this.callbacks.set(irq, fn >>> 0); return old; } // 0x80053348 InterruptCallback
  dmaCallback(ch, fn) { return this.intCallback(0x100 + ch, fn); } // 0x80053378 DMACallback
  vsyncCallbacks(fn) { const old = this.vsync; this.vsync = fn >>> 0; return old; } // 0x800533a8 VSyncCallbacks
  enterCriticalSection() { return 1; } // 0x8004e688
  exitCriticalSection() { return 0; } // 0x8004e698
  openEvent() { return (0xf1000004 + this.events++) | 0; } // 0x8005e828 OpenEvent
  enableEvent() { return 1; } // 0x8005e838 EnableEvent
}
