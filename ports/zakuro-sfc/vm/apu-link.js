import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';
import { APU_TIMING, LINK_TIMING, POWER_ON } from '../sound/zakuro-timing.js';

// Creates the only APU connection used by the 65C816 VM. Firmware and chip
// tables are caller-owned private data; none are embedded in the public port.
export function createApuLink({ ipl = null, gauss = null, powerOnDsp = null, bootRecords = null } = {}) {
  if (!ipl && !bootRecords) throw new TypeError('ipl or bootRecords is required');
  if (ipl && ipl.length !== 64) throw new Error(`IPL image must be 64 bytes, got ${ipl.length}`);
  const apu = new APU({ gauss, ipl });
  if (powerOnDsp) apu.dsp.regs.set(powerOnDsp);

  let bootMode;
  if (ipl) {
    for (const timer of apu.cpu.timers) timer.phase = POWER_ON.timerPhase % timer.period;
    apu.cpu.dspAccessOffset = POWER_ON.dspAccessOffset;
    bootMode = 'ipl';
  } else {
    apu.cpu.dspAccessOffset = APU_TIMING.dspAccessOffset;
    apu.boot(bootRecords, APU_TIMING);
    bootMode = 'high-level';
  }
  return { apu, link: new MasterLink(apu, LINK_TIMING), bootMode };
}
