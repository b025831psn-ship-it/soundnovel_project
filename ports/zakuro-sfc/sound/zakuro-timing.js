// Zakuro no Aji driver timing for the APU and the VM link. Browser-safe.
// APU power-on and timing constants that reproduce the reference run (zakuro-sfc-kor 599e867,
// Snes9x 1bcc369, cycles are SMP bus-access times). The driver's first instruction runs at
// SPC cycle 1,223,778; the timer dividers sit 3 clocks ahead of that point; every DSP write
// (all `MOV !$00F3,A`, 5 clocks) takes effect at the end of its instruction.
export const APU_TIMING = { iplClocks: 1223778, timerLead: 3, dspAccessOffset: 5 };

// VM link timing for this driver (sound/master-link.js), fitted on the same run's 1,253,625
// CPU accesses against this core's instruction starts s and the CPU access time T:
// - a CPU read sees an SPC port write (MOV !$F4,Y / !$F4,A, 5 clocks) iff s + 5 < T
//   (last miss T - s = 4.99997, first hit 5.00012);
// - an SPC read sees a CPU write iff s + point >= T: CMP Y,!$F4 (5E) 1 (hit 0.887, miss
//   1.214), MOV Y,!$F4 (EC) 4 (hit 3.257, miss 4.132), MOV A,!$F4 (E5) 1 (hit 0.507,
//   miss 4.312; 1 keeps it with the other reads), CMP A,!$F4 (65) 1 (never decides).
// With the real IPL ROM (injected from private data, never committed) the run can start at
// power-on. The IPL polls with dp addressing, and a CPU read sees an SPC port write iff
// s + (clocks of the writing instruction) < T. Fitted the same way on all 1,000,707 CPU
// reads from power-on: CMP $F4,#$CC (78) 4, MOVW YA,$F6 (BA) 5, MOV Y/CMP Y/MOV A,dp
// (EB/7E/E4) 3; writes MOV dp,#imm (8F) 5, MOV dp,A / dp,Y (C4/CB) 4, abs (C5/CC) 5.
const point = new Int8Array(256);
point[0x5e] = 1; point[0xec] = 4; point[0xe5] = 1; point[0x65] = 1;
point[0x78] = 4; point[0xba] = 5; point[0xeb] = 3; point[0x7e] = 3; point[0xe4] = 3;
const writeLag = new Int8Array(256);
writeLag[0x8f] = 5; writeLag[0xc4] = 4; writeLag[0xcb] = 4; writeLag[0xc5] = 5; writeLag[0xcc] = 5;
export const LINK_TIMING = { readLag: 5, readPoint: point, writeHold: 6, writeLag };

// Power-on state for a run that executes the real IPL: timer dividers start 3 clocks in.
export const POWER_ON = { timerPhase: 3, dspAccessOffset: APU_TIMING.dspAccessOffset };
