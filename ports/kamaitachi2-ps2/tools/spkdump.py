"""Decode SLPS_251.32 SCENARIO/scene_pk.spk (ScenePack) into JSON.

usage: python3 spkdump.py scene_pk.spk out.json

Container: same ScenarioLink header as scenario.sn4; u32 count at 0xA0 and
(offset, size) pairs at 0xA4. Each ScenePack block:
  +0x20   256 u32 hash buckets -> group chains (u16 count, then
          u16 size, u32 subOffset, u32 firstIndex, name\\0)
  +0x420  u32 x4: subTable, resourceTable, commandArea, 0
  subTable+subOffset: u16 count, then (u16 hash, u16 size, name\\0, u32 commandOffset, u16 0)
  commandArea+commandOffset: command stream up to the next entry's offset.
Command stream: u16 op (< 0x27), then u16 parameter tags until the next op.
  0x27/0x33 cp932 string (0x27 is a u32 after op 0x19), 0x29 u32,
  0x2A u32 n + (n-3) bytes [kind u8][count u8][count x BE i32] (a string after op 0x23),
  0x31 3 x i32, other tags < 0x40 u16.
"""
import json, struct, sys

TAGS = {0x27: "file", 0x28: "layer", 0x29: "id", 0x2a: "data", 0x2b: "fadeFrames", 0x2c: "pan",
        0x2d: "pitch", 0x2e: "wait", 0x2f: "volume", 0x31: "vector", 0x33: "motion"}

def blocks(d):
    n = struct.unpack_from("<I", d, 0xA0)[0]
    return [struct.unpack_from("<II", d, 0xA4 + 8 * i) for i in range(n)]

def block_entries(blk):
    buckets = struct.unpack_from("<256I", blk, 0x20)
    sub_table, _resources, command_area = struct.unpack_from("<3I", blk, 0x420)
    out = []
    for p in buckets:
        if not p: continue
        count, q = struct.unpack_from("<H", blk, p)[0], p + 2
        for _ in range(count):
            size, sub, first = struct.unpack_from("<HII", blk, q)
            group = blk[q + 10:q + 2 + size].split(b"\0")[0].decode("ascii")
            q += 2 + size
            r = sub_table + sub
            subs, r = struct.unpack_from("<H", blk, r)[0], r + 2
            for _ in range(subs):
                _hash, ssize = struct.unpack_from("<HH", blk, r)
                name = blk[r + 4:r + 4 + ssize].split(b"\0")[0].decode("ascii")
                off, flag = struct.unpack_from("<IH", blk, r + 4 + len(name) + 1)
                if flag: raise ValueError(f"{name}: flag {flag}")
                out.append((name, group, off))
                r += 4 + ssize
    return command_area, out

def tokenize(b):
    cmds, p, cur = [], 0, None
    while p < len(b):
        if not any(b[p:]) and len(b) - p < 4: break  # block padding
        t = struct.unpack_from("<H", b, p)[0]; p += 2
        if t < 0x27:
            cur = {"op": t}; cmds.append(cur); continue
        if cur is None: raise ValueError("parameter before command")
        if t == 0x27 and cur["op"] == 0x19:
            v = struct.unpack_from("<I", b, p)[0]; p += 4
        elif t == 0x31:
            v = list(struct.unpack_from("<3i", b, p)); p += 12
        elif t in (0x27, 0x33) or (t == 0x2a and cur["op"] == 0x23):
            e = b.index(b"\0", p); v = b[p:e].decode("cp932"); p = e + 1
        elif t == 0x29:
            v = struct.unpack_from("<I", b, p)[0]; p += 4
        elif t == 0x2a:
            n = struct.unpack_from("<I", b, p)[0]; p += 4
            raw = b[p:p + n - 3]; p += n - 3
            if len(raw) != n - 3: raise ValueError("short 0x2A data")
            v = {"kind": raw[0], "raw": raw.hex()}
            if len(raw) >= 2 and (len(raw) - 2) % 4 == 0 and raw[1] == (len(raw) - 2) // 4:
                v["values"] = [x for (x,) in struct.iter_unpack(">i", raw[2:])]
        elif t < 0x40:
            v = struct.unpack_from("<H", b, p)[0]; p += 2
            if t in (0x2c, 0x2d): v = v - 0x10000 if v & 0x8000 else v
        else:
            raise ValueError(f"tag {t:#x} at {p - 2}")
        key = TAGS.get(t, hex(t))
        if key in cur: raise ValueError(f"repeated tag {key}")
        cur[key] = v
    return cmds

def music(cmds):
    """Codex player shape: first 0x14 start, else 0x17 volume, else 0x15 stop."""
    for want in (0x14, 0x17, 0x15):
        for c in cmds:
            if c["op"] == want:
                m = {"operation": want, "fadeFrames": c.get("fadeFrames", 0), "wait": c.get("wait", 0)}
                if want == 0x14: m["file"] = c["file"]
                if want != 0x15: m["volume"] = c.get("volume", 100)
                return m

def main(src, dst):
    d = open(src, "rb").read()
    pack = {}
    for bi, (o, s) in enumerate(blocks(d)):
        blk = d[o:o + s]
        command_area, entries = block_entries(blk)
        offs = sorted({e[2] for e in entries})
        area = blk[command_area:]
        for name, group, off in entries:
            k = offs.index(off)
            end = offs[k + 1] if k + 1 < len(offs) else len(area)
            cmds = tokenize(area[off:end])
            if name in pack: raise ValueError("duplicate " + name)
            entry = {"block": bi, "offset": o + command_area + off, "group": group, "commands": cmds}
            image = next((c["file"] for c in cmds if c["op"] == 0x07 and c.get("file", "").endswith(".ipu")), None)
            if image: entry["image"] = image.removesuffix(".ipu")
            if m := music(cmds): entry["music"] = m
            pack[name] = entry
    json.dump(dict(sorted(pack.items())), open(dst, "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"{len(pack)} ScenePack entries")

if __name__ == "__main__":
    main(*sys.argv[1:3])
