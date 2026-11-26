// Port of the PS1 sound libraries (libsnd + libspu) linked into SLPS_017.94.
// Every routine keeps its original address in ADDR; the library state lives in a PsxMem
// at the original addresses, so the port can also be swapped in one routine at a time
// against the original code (tools/oracle/hybrid.mjs) and compared register for register.
import { Access } from "./mem.js";
import { SeqPlay } from "./seqplay.js";
import { Voice } from "./voice.js";
import { SpuVoice } from "./spuvoice.js";
import { Notes } from "./notes.js";

export const ADDR = {
  // sequencer
  SsSeqCalledTbyT: 0x80054738, seqCrescendo: 0x800549a8, seqDecrescendo: 0x80054cb8,
  seqPause: 0x80055058, seqPlayTick: 0x800550f8, seqTick: 0x80055128, seqEndOfTrack: 0x80055224,
  seqReadEvent: 0x80055468, seqReadDelta: 0x80055818, seqChain: 0x800558c8, seqReplay: 0x800559c8,
  seqStopVoices: 0x80058bd8, seqTempoRamp: 0x800593f8,
  // voices
  damperOff: 0x8005af78, voiceFlush: 0x8005af98, voiceKeyOff: 0x8005c808, seqVoicesOff: 0x8005d880,
  bendHandler: 0x80057ac8, noteHandler: 0x80057f78, programHandler: 0x80058058,
  voiceAlloc: 0x8005ab08, voiceSetAddrAdsr: 0x8005ad98, noteOn: 0x8005b778, noteOff: 0x8005bcec,
  pitchOfNote: 0x8005bf88, pitchFine: 0x8005c05c, noiseKeyOn: 0x8005c248, noiseOff: 0x8005c7c8,
  voiceKeyOnVol: 0x8005c8d8, voiceBend: 0x8005cda8, bendAll: 0x8005cfa4, toneSearch: 0x8005d938,
  setVabProg: 0x8005dfc8,
  // libspu
  SpuSetNoiseClock: 0x80060368,
  SpuSetNoiseVoice: 0x80060078, SpuSetReverbVoice: 0x80060fc8, SpuSetKey: 0x800611a8,
  SpuSetVoiceAttr: 0x80061968, SpuGetVoiceEnvelope: 0x800622b8, spuAddrReg: 0x8005f198,
  spuVoiceBits: 0x800600a8, spuNoteToPitch: 0x80061ff4,
};
export const NAME_AT = new Map(Object.entries(ADDR).map(([k, v]) => [v >>> 0, k]));

export class SoundLib {
  constructor(m) { this.m = m; }
  // Call through a function pointer stored by the library (SEQ handler table etc.).
  jalr(addr, ...args) {
    const name = NAME_AT.get(addr >>> 0);
    if (!name || !this[name]) throw new Error(`libsnd: no routine at 0x${(addr >>> 0).toString(16)}`);
    return this[name](...args);
  }
}
Object.assign(SoundLib.prototype, Access, SeqPlay, Voice, SpuVoice, Notes);
