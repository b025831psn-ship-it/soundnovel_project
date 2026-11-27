// libspu SPU memory manager. The table holds {w0, size} pairs: w0 = address | flags,
// 0x80000000 free, 0x40000000 the end block (the rest of SPU RAM), 0x2fffffff merged away.
// Port of SLPS_017.94 0x8005f3b8 (SpuInitMalloc), 0x8005f418 (SpuMalloc), 0x8005fd48
// (SpuMallocWithStartAddr), 0x8005f9e8, 0x8005fff8 (SpuFree), 0x8005f6e8 (table cleanup).
import { SPU_ADDR_SHIFT, SPU_ALIGN_MASK } from "./spuvoice.js";
import { REV_RESERVED, REV_START, MALLOC_TABLE } from "./reverb.js";

export const MALLOC_COUNT = 0x80078d10, MALLOC_LAST = 0x80078d14;
const FREE = 0x80000000, END = 0x40000000, MASK = 0x0fffffff, GONE = 0x2fffffff;

export const Malloc = {
  mt(i) { return (this.lw(MALLOC_TABLE) + i * 8) | 0; },
  reservedBytes() { return this.lw(REV_RESERVED) === 0 ? 0 : ((0x10000 - this.lw(REV_START)) << this.lw(SPU_ADDR_SHIFT)) | 0; },
  alignUp(x) {
    const m = this.lw(SPU_ALIGN_MASK), sh = this.lw(SPU_ADDR_SHIFT);
    if (x & ~m) x = (x + m) | 0;
    return (x >> sh) << sh;
  },

  // 0x8005f3b8 SpuInitMalloc(count, table)
  SpuInitMalloc(n, table) {
    if (n <= 0) return 0;
    this.sw(table, 0x40001010);
    this.sw(MALLOC_TABLE, table); this.sw(MALLOC_LAST, 0); this.sw(MALLOC_COUNT, n);
    this.sw(table + 4, ((0x10000 << this.lw(SPU_ADDR_SHIFT)) - 0x1010) | 0);
    return n;
  },

  // 0x8005f6e8: merge neighbouring free blocks, drop empty ones, sort by address,
  // move the end block to the first hole, and fold trailing free blocks into it.
  spuMallocTidy() {
    const T = () => this.lw(MALLOC_TABLE);
    let last = this.lw(MALLOC_LAST);
    if (last >= 0) {
      const t5 = last; let t1 = 0, a3 = T();
      while (!(t5 < t1)) {
        if (this.lw(a3) & FREE) {
          let a2 = t1 + 1;
          while ((this.lw(T() + a2 * 8)) === GONE) a2++;
          const a1 = (T() + a2 * 8) | 0, w = this.lw(a1);
          if (w & FREE && ((w & MASK) >>> 0) === (((this.lw(a3) & MASK) + this.lw(a3 + 4)) | 0) >>> 0) {
            this.sw(a1, GONE);
            this.sw(a3 + 4, this.lw(a3 + 4) + this.lw(a1 + 4));
            continue;
          }
        }
        a3 = (a3 + 8) | 0; t1++;
      }
    }
    last = this.lw(MALLOC_LAST);
    if (last >= 0) for (let i = 0, e = T(); !(last < i); i++, e = (e + 8) | 0) if (this.lw(e + 4) === 0) this.sw(e, GONE);
    let v1 = this.lw(MALLOC_LAST);
    if (v1 >= 0) {
      const t5 = T();
      for (let t1 = 0, t2 = t5; ; ) {
        if (this.lw(t2) & END) break;
        let a2 = t1 + 1;
        if (!(v1 < a2)) {
          const t3 = this.lw(MALLOC_LAST);
          for (let a0 = (t5 + a2 * 8) | 0; ; ) {
            const a1 = this.lw(a0);
            if (a1 & END) break;
            const a3 = this.lw(t2);
            if (((a1 & MASK) >>> 0) < ((a3 & MASK) >>> 0)) {
              this.sw(t2, a1);
              const x = this.lw(a0 + 4), y = this.lw(t2 + 4);
              this.sw(t2 + 4, x); this.sw(a0, a3); this.sw(a0 + 4, y);
            }
            a2++; a0 = (a0 + 8) | 0;
            if (t3 < a2) break;
          }
        }
        v1 = this.lw(MALLOC_LAST); t1++; t2 = (t2 + 8) | 0;
        if (v1 < t1) break;
      }
    }
    let a1 = this.lw(MALLOC_LAST);
    if (a1 >= 0) {
      const tab = T();
      for (let t1 = 0, a0 = tab; ; ) {
        const w = this.lw(a0);
        if (w & END) break;
        if (w === GONE) {
          const e = (tab + a1 * 8) | 0;
          this.sw(a0, this.lw(e)); this.sw(MALLOC_LAST, t1); this.sw(a0 + 4, this.lw(e + 4));
          break;
        }
        a1 = this.lw(MALLOC_LAST); t1++; a0 = (a0 + 8) | 0;
        if (a1 < t1) break;
      }
    }
    let t1 = this.lw(MALLOC_LAST) - 1;
    if (t1 >= 0) {
      const tab = T();
      for (let a0 = (tab + t1 * 8) | 0; t1 >= 0; t1--, a0 = (a0 - 8) | 0) {
        const w = this.lw(a0);
        if (!(w & FREE)) break;
        const old = this.lw(MALLOC_LAST);
        this.sw(a0, (w & MASK) | END);
        this.sw(MALLOC_LAST, t1);
        this.sw(a0 + 4, this.lw(a0 + 4) + this.lw(tab + old * 8 + 4));
      }
    }
  },

  // 0x8005f418 SpuMalloc(size)
  SpuMalloc(size) {
    const s3 = this.reservedBytes();
    size = this.alignUp(size);
    let s2 = -1;
    if (this.lw(this.mt(0)) & END) s2 = 0;
    else {
      this.spuMallocTidy();
      const n = this.lw(MALLOC_COUNT);
      for (let i = 0; i < n; i++) {
        const e = this.mt(i), w = this.lw(e);
        if (w & END) { s2 = i; break; }
        if (w & FREE && !((this.lw(e + 4) >>> 0) < (size >>> 0))) { s2 = i; break; }
      }
    }
    if (s2 === -1) return -1;
    const e = this.mt(s2), w = this.lw(e);
    if (w & END) {
      if (!(s2 < this.lw(MALLOC_COUNT))) return -1;
      if ((((this.lw(e + 4) - s3) | 0) >>> 0) < (size >>> 0)) return -1;
      const n = this.mt(s2 + 1);
      this.sw(n, (((w & MASK) + size) | 0) | END);
      this.sw(n + 4, this.lw(e + 4) - size);
      this.sw(MALLOC_LAST, s2 + 1);
      this.sw(e + 4, size); this.sw(e, this.lw(e) & MASK);
      this.spuMallocTidy();
      return this.lw(this.mt(s2));
    }
    const t0 = this.lw(e + 4);
    if ((size >>> 0) < (t0 >>> 0)) {
      const a2 = this.lw(MALLOC_LAST);
      if (a2 < this.lw(MALLOC_COUNT)) {
        const x = this.mt(a2), oa = this.lw(x), ob = this.lw(x + 4);
        this.sw(x, ((w + size) | 0) | FREE); this.sw(x + 4, t0 - size);
        this.sw(MALLOC_LAST, a2 + 1);
        this.sw(x + 8, oa); this.sw(x + 12, ob);
      }
    }
    const e2 = this.mt(s2);
    this.sw(e2 + 4, size); this.sw(e2, this.lw(e2) & MASK);
    this.spuMallocTidy();
    return this.lw(this.mt(s2));
  },

  // 0x8005fd48 SpuMallocWithStartAddr(addr, size)
  SpuMallocWithStartAddr(addr, size) {
    const s2 = this.reservedBytes(), m = this.lw(SPU_ALIGN_MASK), sh = this.lw(SPU_ADDR_SHIFT);
    if (size & ~m) size = (size + m) | 0;
    if (addr & ~m) addr = (addr + m) | 0;
    size = (size >> sh) << sh; addr = (addr >> sh) << sh;
    if (addr < 0x1010) return -1;
    const end = (addr + size) | 0;
    if ((((0x10000 << sh) - s2) | 0) < end) return -1;
    const t = this.lw(MALLOC_TABLE);
    if (this.lw(t) & END) {
      const before = (addr - 0x1010) | 0, after = ((this.lw(t + 4) + 0x1010 - addr) | 0) - size | 0;
      if (before > 0) {
        if ((this.lw(MALLOC_COUNT) - 2) < this.lw(MALLOC_LAST)) return -1;
        this.sw(t, 0x80001010); this.sw(t + 0x10, end | END);
        this.sw(t + 4, before); this.sw(t + 8, addr); this.sw(t + 0xc, size); this.sw(t + 0x14, after);
        this.sw(MALLOC_LAST, 2);
      } else {
        if ((this.lw(MALLOC_COUNT) - 1) < this.lw(MALLOC_LAST)) return -1;
        this.sw(t + 8, end | END); this.sw(t, addr); this.sw(t + 4, size); this.sw(t + 0xc, after);
        this.sw(MALLOC_LAST, 1);
      }
      this.spuMallocTidy();
      return addr;
    }
    this.spuMallocTidy();
    for (let i = 0; ; i++) {
      const e = this.mt(i);
      let w = this.lw(e);
      if (w < 0) {
        const start = (w & MASK) >>> 0;
        if ((addr >>> 0) < start) {
          if (!(this.lw(e + 4) < size)) return this.allocAt(i, start, size);
          continue;
        }
        if (!((addr >>> 0) < ((start + this.lw(e + 4)) >>> 0)) && !(this.lw(e + 8) & END)) continue;
        const room = (this.lw(e + 4) - ((addr - (this.lw(e) & MASK)) | 0)) | 0;
        if (room < size) continue;
        return this.allocAt(i, addr, size);
      }
      if (!(w & END)) continue;
      if (((this.lw(e + 4) - s2) | 0) < size) return -1;
      return this.allocAt(i, w & MASK, size);
    }
  },
  allocAt(i, addr, size) { const r = this.spuMallocSplit(i, addr, size); this.spuMallocTidy(); return r; },

  // 0x8005f9e8: carve [addr, addr+size) out of block idx.
  spuMallocSplit(idx, addr, size) {
    const T = this.lw(MALLOC_TABLE), e = (T + idx * 8) | 0;
    const t3 = this.lw(e), t4 = this.lw(e + 4), t1 = (addr - (t3 & MASK)) | 0;
    const v1 = this.reservedBytes();
    const a3 = t3 & END ? (t4 - t1 - v1) | 0 : (t4 - t1) | 0;
    if (a3 < size) return -1;
    const count = this.lw(MALLOC_COUNT);
    const ent = (k) => (this.lw(MALLOC_TABLE) + k * 8) | 0;
    if (t3 & END) {
      if (t1 > 0) {
        const L = this.lw(MALLOC_LAST);
        if ((count - 2) < L) return -1;
        this.sw(MALLOC_LAST, L + 1);
        const a = ent(L), n = ent(L + 1);
        this.sw(a + 4, t1); this.sw(a, (this.lw(a) & MASK) | FREE);
        this.sw(n, addr); this.sw(n + 4, size);
      } else {
        const L = this.lw(MALLOC_LAST);
        if ((count - 1) < L) return -1;
        const a = ent(L);
        this.sw(a + 4, size); this.sw(a, this.lw(a) & MASK);
      }
      const L = this.lw(MALLOC_LAST) + 1;
      this.sw(MALLOC_LAST, L);
      const n = ent(L);
      this.sw(n, ((((t3 & MASK) + t1 + size) | 0) | END));
      this.sw(n + 4, (t4 - t1 - size) | 0);
      return this.allocDone(addr);
    }
    if (t1 > 0) {
      const lim = a3 === size ? count - 2 : count - 1;
      if (lim < this.lw(MALLOC_LAST)) return -1;
      this.sw(e + 4, t1);
      const L = this.lw(MALLOC_LAST), a = ent(L);
      const ow = this.lw(a), os = this.lw(a + 4);
      this.sw(a, addr); this.sw(a + 4, size);
      this.sw(MALLOC_LAST, L + 1);
      this.sw(a + 8, ow); this.sw(a + 12, os);
      if (a3 < size) return this.allocDone(addr);
      const b = ent(L + 1), bw = this.lw(b), bs = this.lw(b + 4);
      this.sw(b, (((t3 & MASK) + t1 + size) | 0) | FREE);
      this.sw(b + 4, a3 - size);
      this.sw(MALLOC_LAST, L + 2);
      this.sw(b + 8, bw); this.sw(b + 12, bs);
      return this.allocDone(addr);
    }
    if (size < a3 && (count - 1) < this.lw(MALLOC_LAST)) return -1;
    this.sw(e + 4, size); this.sw(e, this.lw(e) & MASK);
    if (!(size < a3)) return this.allocDone(addr);
    const L = this.lw(MALLOC_LAST), a = ent(L);
    const ow = this.lw(a);
    this.sw(a, (((t3 & MASK) + size) | 0) | FREE);
    const os = this.lw(a + 4);
    this.sw(a + 4, a3 - size);
    this.sw(MALLOC_LAST, L + 1);
    this.sw(a + 8, ow); this.sw(a + 12, os);
    return this.allocDone(addr);
  },
  allocDone(addr) { this.spuMallocTidy(); return addr; },

  // 0x8005fff8 SpuFree(addr)
  SpuFree(addr) {
    const n = this.lw(MALLOC_COUNT);
    for (let i = 0, e = this.lw(MALLOC_TABLE); i < n; i++, e = (e + 8) | 0) {
      const w = this.lw(e);
      if (w & END) break;
      if (w === addr) { this.sw(e, addr | FREE); break; }
    }
    this.spuMallocTidy();
  },
};
