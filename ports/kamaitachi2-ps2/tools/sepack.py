"""Copy the original SE data into web assets without changing it.

  python3 sepack.py SOUND__SEP__sep.pac SOUND__WAVE_WD__wave_wd.dat SOUND__WAVE_WD__wave_wd.sec out/ [ids.json]

- sep.pac is copied as is (the web engine reads it like the EE loader).
- wave_wd.dat is a sector archive; wave_wd.sec holds 4096 u32 start sectors (0xFFFFFFFF = none).
  Each bank is written as out/wave####.wd, cut to header + regions + sample data size
  (header u32 at +4), which is what the driver names wave/wave%4.4u.wd.
- ids.json (optional): only banks used by these SE ids and by ids below 1000 (system sounds).
"""
import json, os, struct, sys

sep_path, dat_path, sec_path, out = sys.argv[1:5]
ids = set(json.load(open(sys.argv[5]))) if len(sys.argv) > 5 else None
os.makedirs(out, exist_ok=True)
p = open(sep_path, 'rb').read()
open(os.path.join(out, 'sep.pac'), 'wb').write(p)
n = struct.unpack_from('<H', p, 0)[0]
t1 = struct.unpack_from(f'<{n}H', p, 2)
rids = struct.unpack_from(f'<{n}I', p, 2 + 4 * n + 2)
base = 2 + 8 * n + 2
banks = set()
for i, rid in enumerate(rids):
    if ids is None or rid in ids or rid < 1000:
        banks.add(struct.unpack_from('<H', p, base + 2 * t1[i] + 9)[0])
sec = struct.unpack(f'<{os.path.getsize(sec_path) // 4}I', open(sec_path, 'rb').read())
dat = open(dat_path, 'rb')
total = 0
for b in sorted(banks):
    s = sec[b]
    if s == 0xFFFFFFFF:
        raise SystemExit(f'bank {b} missing from wave_wd.sec')
    dat.seek(s * 2048)
    head = dat.read(32)
    assert head[:2] == b'WD' and struct.unpack_from('<H', head, 2)[0] == b, b
    size, ninst, nreg = struct.unpack_from('<III', head, 4)
    first = struct.unpack_from('<I', dat.read(4), 0)[0]
    dat.seek(s * 2048)
    data = dat.read(first + nreg * 32 + size)
    open(os.path.join(out, f'wave{b:04d}.wd'), 'wb').write(data)
    total += len(data)
print(f'{len(banks)} banks, {total} bytes, sep.pac {len(p)} bytes')
