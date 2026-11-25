"""Decode every SCR block of SLPS_251.32 SCENARIO/scenario.sn4 into SN4 VM JSON.

usage: python3 sn4dump.py scenario.sn4 out.json [table.md]
"""
import json, re, struct, sys, collections

NOARG = {0x04,0x09,0x0B,0x0C,0x0D,0x0E,0x10,0x11,0x12,0x13,0x15,0x16,0x17,0x1A,0x1B,0x1E,0x22,0x23,
         0x27,0x28,0x29,0x2D,0x2E,0x2F,0x31,0x32,0x34,0x35,0x3A,0x3B,0x3C,0x3D,0x3E}
U8 = {0x1F,0x40,0x41,0x45,0x46,0x47,0x48}
U8U8 = {0x4C,0x4D}
BE32 = {0x50,0x51,0x53,0x54,0x55,0x56,0x57,0x59,0x5A,0x5B,0x5C,0x5D,0x5E,0x60,0x61,0x62,0x64,0x65,0x66}
SIZED = {0x68,0x69,0x6A,0x6B,0x6C,0x6F,0x70,0x71,0x72,0x73,0x74,0x76,0x79,0x7A,0x7B,0x7C,0x7E,0x7F,0x81,0x83,0x84,0x85}
LABEL = re.compile(rb"\x85([\x02-\x40])(.)([\x20-\x7e]+?)\x00", re.S)

def cstr(b): return b.split(b"\0")[0].decode("ascii")

def flagged_names(payload):
    """Entries of <flag u8><type u8><ascii>\\0. Returns (names, flags, types)."""
    names, flags, types, pos = [], [], [], 0
    while pos < len(payload):
        end = payload.index(b"\0", pos + 2)
        flags.append(payload[pos]); types.append(payload[pos + 1])
        names.append(payload[pos + 2:end].decode("ascii")); pos = end + 1
    return names, flags, types

def sized_args(op, p):
    if op in (0x6A, 0x6B): return [p[1:-1].decode("ascii")]
    if op in (0x72, 0x73, 0x74): return [cstr(p)]
    if op == 0x6C:
        if p[0] != 1 or p[2] != 0: raise ValueError("select header " + p[:4].hex())
        targets, flags, types = flagged_names(p[3:])
        if len(targets) != p[1]: raise ValueError(f"select count {p[1]} != {len(targets)}")
        return [targets, flags]
    if op == 0x6F:
        if len(p) != 5 + 4 * p[4]: raise ValueError("wipe size")
        return [int.from_bytes(p[:4], "big"), *[n for (n,) in struct.iter_unpack(">I", p[5:])]]
    if op in (0x68, 0x69) and len(p) == 5:
        return [{"var": int.from_bytes(p[0:2], "big"), "op": p[2], ("value" if op == 0x68 else "source"): int.from_bytes(p[3:5], "big")}]
    if op in (0x70, 0x71) and len(p) > 6 and p[-1] == 0:
        return [{"var": int.from_bytes(p[0:2], "big"), "cmp": p[2],
                 ("value" if op == 0x70 else "other"): int.from_bytes(p[3:5], "big"),
                 "target": p[6:-1].decode("ascii"), "raw": p.hex()}]
    if op == 0x7B:
        e = p.index(b"\0", 1)
        return [{"kind": p[0], "name": p[1:e].decode("ascii"), "param": list(p[e + 1:])}]
    return [p.hex()]

def decode_block(blk, base, bi, stats):
    labels = [m for m in LABEL.finditer(blk) if m[1][0] == len(m[3]) + 2]
    # 256 hash buckets at +0x30, then the code start at +0x430.
    buckets = struct.unpack_from("<256I", blk, 0x30)
    links = {}
    for o in buckets:
        p = o
        while o:
            a, kind, off = struct.unpack_from("<HHI", blk, p)
            links[blk[p + 8:p + 20].split(b"\0")[0].decode("latin1")] = (kind, off)
            if a == 0: break
            p += a
    code_start = struct.unpack_from("<I", blk, 0x430)[0]
    # Link offsets are relative to the end of the hash table. A 0x85 label
    # points at its 0x22 record marker; a local "_name" points at the command
    # after a 0x16 response separator, or at the next 0x85 header.
    starts = collections.defaultdict(list)
    for name, (kind, off) in links.items(): starts[code_start + off].append(name)
    code_end = len(blk)
    while code_end and blk[code_end - 1] == 0: code_end -= 1
    first = min(m.start() for m in labels)
    pos = first
    ops, boundaries = [], []
    while pos < code_end:
        op = blk[pos]; at = pos
        if op != 0x85:
            for name in starts.pop(pos, []): boundaries.append((len(ops), name, pos))
        if op == 0x02:
            end = blk.index(b"\x03", pos + 1)
            args = [blk[pos + 1:end].decode("cp932")]; pos = end + 1
        elif op == 0x06:
            readings, p = [], pos + 1
            while blk[p] == 0x02:
                e = blk.index(b"\x03", p + 1); readings.append(blk[p + 1:e].decode("cp932")); p = e + 1
            if blk[p] != 0x07: raise ValueError(f"ruby at {base+pos:#x}")
            # The base text is the next 02 command; other commands may sit between.
            t = blk.index(b"\x02", p + 1); e = blk.index(b"\x03", t + 1)
            ops.append({"op": 0x106, "offset": base + at, "args": [blk[t + 1:e].decode("cp932")[:len(readings)], readings]})
            stats[0x06] += 1; pos = p + 1; continue
        elif op in NOARG: args = []; pos += 1
        elif op in U8: args = [blk[pos + 1]]; pos += 2
        elif op in U8U8: args = list(blk[pos + 1:pos + 3]); pos += 3
        elif op in BE32: args = [int.from_bytes(blk[pos + 1:pos + 5], "big")]; pos += 5
        elif op == 0x75: args = list(blk[pos + 1:pos + 5]); pos += 5
        elif op == 0x82:
            size = int.from_bytes(blk[pos + 2:pos + 4], "big")
            p = blk[pos + 4:pos + 4 + size]; args = [blk[pos + 1], p.hex()]; pos += 4 + size
        elif op in SIZED:
            size = blk[pos + 1]
            # The single 0x71 at tab05_0370 has a size byte one short of its NUL.
            if op == 0x71 and blk[pos + 1 + size] != 0 and blk[pos + 2 + size] == 0: size += 1
            p = blk[pos + 2:pos + 2 + size]
            if len(p) != size: raise ValueError(f"truncated {op:#x} at {base+pos:#x}")
            pos += 2 + size
            if op == 0x85:
                header = p[1:-1].decode("ascii")
                names = starts.pop(at, []) + starts.pop(pos, [])
                if pos < code_end and blk[pos] == 0x22: pos += 1
                if header not in names: names.insert(0, header)
                for name in names: boundaries.append((len(ops), name, at))
                stats[0x85] += 1
                continue
            args = sized_args(op, p)
        else:
            BAD.append((bi, hex(base+at), blk[at-24:at].hex(), blk[at:at+12].hex())); pos += 1; continue
        stats[op] += 1
        if op == 0x66: op = 0x65  # same handler as Codex's VM, packed coordinate
        ops.append({"op": op, "offset": base + at, "args": args})
    missing = [(n, hex(base + o)) for o, ns in starts.items() for n in ns]
    out = []
    for i, (start, name, off) in enumerate(boundaries):
        stop = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(ops)
        out.append({"label": name, "offset": base + off, "block": bi, "ops": ops[start:stop]})
    for a, b in zip(out, out[1:]): a["next"] = b["label"]
    return out, missing, len(links)

BAD=[]
def main():
    data = open(sys.argv[1], "rb").read()
    n = struct.unpack_from("<I", data, 0xA0)[0]
    blocks = [struct.unpack_from("<II", data, 0xA4 + 8 * i) for i in range(n)]
    labels, stats, missing, linked = [], collections.Counter(), [], 0
    for bi, (b, s) in enumerate(blocks):
        got, miss, nl = decode_block(data[b:b + s], b, bi, stats)
        labels += got; missing += miss; linked += nl
    names = collections.Counter(l["label"] for l in labels)
    program = {"entry": "my01_0047", "source": "SCENARIO/scenario.sn4", "labels": labels}
    json.dump(program, open(sys.argv[2], "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"blocks {n} link entries {linked} VM labels {len(labels)} ops {sum(len(l['ops']) for l in labels)}")
    print("labels not on an op boundary:", missing[:20], len(missing))
    print("bad", len(BAD)); [print(x) for x in BAD[:30]]
    print("duplicate names:", [k for k, v in names.items() if v > 1][:20])
    if len(sys.argv) > 3:
        first = {}
        for l in labels:
            for o in l["ops"]: first.setdefault(o["op"], (l["label"], o["offset"]))
        rows = ["| opcode | 횟수 | 첫 위치 | 피연산자 |", "| --- | ---: | --- | --- |"]
        kind = lambda op: ("cp932 02..03" if op == 0x02 else "ruby" if op == 0x106 else "없음" if op in NOARG else
                           "u8" if op in U8 else "u8,u8" if op in U8U8 else "be32" if op in BE32 else "r,g,b+1" if op == 0x75 else
                           "u8, be16 크기, 이름들" if op == 0x82 else "u8 크기 + 페이로드")
        for op in sorted(stats):
            if op == 0x85: continue
            key = 0x65 if op == 0x66 else op
            lab, off = first.get(0x106 if op == 6 else key, ("", 0))
            rows.append(f"| `{op:#04x}` | {stats[op]} | `{lab}` @ `{off:#x}` | {kind(op)} |")
        open(sys.argv[3], "w").write("\n".join(rows) + "\n")

main()
