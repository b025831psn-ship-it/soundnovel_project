"""Report whether scenario characters exist in either PS2 SN4 font."""
import struct
import sys

from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from disc import Disc

MISSING = "　鴉汝巫澳―痴芋詛訶賎◇丑"
sys.stdout.reconfigure(encoding="utf-8")

disc = Disc(sys.argv[1]).open_index()
for name in ("SCENARIO/sn4.fnt", "SCENARIO/love.fnt"):
    data = disc.read(disc.files[name])
    count, = struct.unpack_from("<I", data, 40)
    codes = {struct.unpack_from("<I", data, 48 + index * 12)[0] for index in range(count)}
    print(name, count)
    for char in MISSING:
        code = int.from_bytes(char.encode("cp932"), "big")
        print(f"{char}\t0x{code:04x}\t{'yes' if code in codes else 'no'}")
