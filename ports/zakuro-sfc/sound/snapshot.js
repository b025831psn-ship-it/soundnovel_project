// Starts the APU at the driver's first instruction from a saved state instead of the ROM:
// `aram` is the 64 KiB ARAM at that instruction and `dsp` the 128 DSP registers of the
// same run (zakuro-sfc-kor port-data/sound/boot-aram.bin, boot-dsp.bin). The result is the
// same as APU.boot() with the ROM's upload records (the IPL leaves exactly this ARAM),
// so a player needs no ROM. Browser-safe.
export function bootFromSnapshot(apu, { aram, dsp = null, entry = 0x0600, iplClocks, timerLead = 0, dspAccessOffset = 0 }) {
  if (aram.length !== 0x10000) throw new Error(`ARAM snapshot is ${aram.length} bytes, expected 65536`);
  if (dsp) apu.dsp.regs.set(dsp);
  apu.cpu.dspAccessOffset = dspAccessOffset;
  // $F0-$FF are I/O, not memory: the driver programs them itself. The IPL leaves its
  // port outputs there in the snapshot ($F4-$F7).
  const records = [
    { length: 0xf0, dest: 0x0000, payload: aram.subarray(0x0000, 0x00f0) },
    { length: 0xff00, dest: 0x0100, payload: aram.subarray(0x0100, 0x10000) },
    { length: 0, dest: entry, payload: null },
  ];
  apu.boot(records, { iplClocks, timerLead });
  for (let i = 0; i < 4; i++) apu.cpu.portOut[i] = aram[0xf4 + i];
  return entry;
}
