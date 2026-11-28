# The screen-overlay step 0x8003186c (VSync callback; src/vsync.js overlayTick ports cases 12, 20,
# 21, 30 and 31 by hand). Output: src/screen/overlay-translated.js
#   SLPS=/path/to/SLPS_017.94 python3 gen-overlay.py > /tmp/body.js   (then replace the body)
import mips2js as M, sys
FUNCS = ["8003186c"]
TABLES = {"8003186c": (0x80011b40, 0x22)}
out = []; allc = set(); names = {}
for f in FUNCS:
  a = int(f, 16); t, n = TABLES[f]; extra = sorted({M.w32(t + 4 * i) for i in range(n)})
  name = f"x{f}"
  js, c = M.translate(a, name, extra); out.append(js); allc |= c; names[a] = name
print("\n\n".join(out))
print("\nexport const OVERLAY_TRANSLATED = {" + ", ".join(f"0x{a:08x}: {n}" for a, n in names.items()) + " };")
sys.stderr.write("calls outside: " + " ".join(f"{c:08x}" for c in sorted(allc - set(names))) + "\n")
