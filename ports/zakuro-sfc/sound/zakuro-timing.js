// Browser-safe timing constants measured from the Zakuro reference run.
export const APU_TIMING = { iplClocks: 1223778, timerLead: 3, dspAccessOffset: 5 };

const point = new Int8Array(256);
point[0x5e] = 1; point[0xec] = 4; point[0xe5] = 1; point[0x65] = 1;
point[0x78] = 4; point[0xba] = 5; point[0xeb] = 3; point[0x7e] = 3; point[0xe4] = 3;
const writeLag = new Int8Array(256);
writeLag[0x8f] = 5; writeLag[0xc4] = 4; writeLag[0xcb] = 4; writeLag[0xc5] = 5; writeLag[0xcc] = 5;
export const LINK_TIMING = { readLag: 5, readPoint: point, writeHold: 6, writeLag };

export const POWER_ON = { timerPhase: 3, dspAccessOffset: APU_TIMING.dspAccessOffset };
