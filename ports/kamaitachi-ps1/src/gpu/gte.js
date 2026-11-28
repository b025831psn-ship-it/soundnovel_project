// The geometry coprocessor (GTE), as far as libgs's GsSortSprite uses it for scaled and rotated
// sprites: the rotation and translation registers, the screen offset and distance, and the
// perspective transforms RTPS / RTPT (libgte RotTransPers4 0x8004e288). Arithmetic as the GTE
// does it (psx-spx "GTE"): 12-bit fixed-point matrix, the UNR reciprocal for H / SZ3, the
// saturation of IR, SZ, SX/SY, IR0 and the flag register (control register 31).
//   control: 0-4 rotation matrix, 5-7 translation, 24/25 OFX/OFY (16.16), 26 H, 27 DQA, 28 DQB
const UNR = Array.from({ length: 0x101 }, (_, i) => Math.max(0, Math.trunc((Math.trunc(0x40000 / (i + 0x100)) + 1) / 2) - 0x101));
const s16 = (v) => (v << 16) >> 16;

export class Gte {
  constructor() {
    this.c = new Int32Array(32); // control registers
    this.sz = [0, 0, 0, 0]; this.sxy = [0, 0, 0]; this.ir0 = 0; this.flag = 0;
    this.initGeom();
  }
  initGeom() { // 0x8004df30: InitGeom's defaults
    const c = this.c; c[29] = 0x155; c[30] = 0x100; c[26] = 1000; c[27] = -0x1062; c[28] = 0x1400000; c[24] = 0; c[25] = 0;
  }
  setOffset(x, y) { this.c[24] = x << 16; this.c[25] = y << 16; } // 0x8004e268 SetGeomOffset
  setRot(words) { for (let i = 0; i < 5; i++) this.c[i] = words[i]; } // 0x8004e1b8 SetRotMatrix
  setTrans(t) { for (let i = 0; i < 3; i++) this.c[5 + i] = t[i]; } // 0x8004e218 SetTransMatrix
  readH() { return s16(this.c[26]); } // 0x8004e238 ReadGeomScreen (cfc2 26 reads H sign-extended)

  rtp(vx, vy, vz, last) { // one vertex of RTPS / RTPT (sf = 1, lm = 0)
    const c = this.c, r = (i, hi) => (hi ? c[i] >> 16 : s16(c[i]));
    const R = [[r(0, 0), r(0, 1), r(1, 0)], [r(1, 1), r(2, 0), r(2, 1)], [r(3, 0), r(3, 1), r(4, 0)]];
    const mac = [0, 1, 2].map((k) => Math.floor((c[5 + k] * 0x1000 + R[k][0] * vx + R[k][1] * vy + R[k][2] * vz) / 0x1000));
    const ir = mac.map((v, k) => {
      if (v > 0x7fff) { this.flag |= 1 << (24 - k); return 0x7fff; }
      if (v < -0x8000) { this.flag |= 1 << (24 - k); return -0x8000; }
      return v;
    });
    let z = mac[2];
    if (z < 0) { z = 0; this.flag |= 1 << 18; } else if (z > 0xffff) { z = 0xffff; this.flag |= 1 << 18; }
    this.sz.shift(); this.sz.push(z);
    const h = c[26] & 0xffff;
    let div;
    if (h < z * 2) {
      const n = Math.clz32(z) - 16, d0 = (z << n) >>> 0, num = h * 2 ** n;
      const u = UNR[(d0 - 0x7fc0) >> 7] + 0x101;
      let d = Math.trunc((0x2000080 - d0 * u) / 256);
      d = Math.trunc((0x80 + d * u) / 256);
      div = Math.min(0x1ffff, Math.trunc((num * d + 0x8000) / 0x10000));
    } else { div = 0x1ffff; this.flag |= 1 << 17; }
    const sat = (v, bit) => { if (v < -0x400) { this.flag |= 1 << bit; return -0x400; } if (v > 0x3ff) { this.flag |= 1 << bit; return 0x3ff; } return v; };
    const sx = sat(Math.floor((c[24] + ir[0] * div) / 0x10000), 14), sy = sat(Math.floor((c[25] + ir[1] * div) / 0x10000), 13);
    this.sxy.shift(); this.sxy.push(((sy & 0xffff) << 16 | (sx & 0xffff)) >>> 0);
    if (last) {
      let q = Math.floor((div * s16(c[27]) + c[28]) / 0x1000);
      if (q < 0) { q = 0; this.flag |= 1 << 12; } else if (q > 0x1000) { q = 0x1000; this.flag |= 1 << 12; }
      this.ir0 = q;
    }
  }
  flags() { return (this.flag & 0x7f87e000 ? this.flag | 0x80000000 : this.flag) >>> 0; }

  // 0x8004e288 RotTransPers4(v0, v1, v2, v3, sxy0, sxy1, sxy2, sxy3, p, flag): RTPT on the first
  // three, RTPS on the fourth; returns SZ3 / 4.
  rotTransPers4(m, v, out) {
    const vec = (a) => [s16(m.read(a, 2)), s16(m.read(a + 2, 2)), s16(m.read(a + 4, 2))];
    this.flag = 0;
    for (let i = 0; i < 3; i++) this.rtp(...vec(v[i]), i === 2);
    for (let i = 0; i < 3; i++) m.write(out[i], this.sxy[i], 4);
    const f1 = this.flags();
    this.flag = 0; this.rtp(...vec(v[3]), true);
    m.write(out[3], this.sxy[2], 4);
    m.write(out[4], this.ir0, 4);
    m.write(out[5], (this.flags() | f1) >>> 0, 4);
    return this.sz[3] >> 2;
  }
}
