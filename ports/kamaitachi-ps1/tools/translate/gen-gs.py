# libgs GsSortSprite 0x8004c768 (scaled / rotated sprites) with the CPU-side libgte matrix
# helpers it calls (RotMatrix, ScaleMatrix, TransMatrix) and the OT link 0x8004c6c8. The GTE
# routines themselves are ported by hand (src/gpu/gte.js). Output: src/gpu/gs-translated.js
#   SLPS=/path/to/SLPS_017.94 python3 gen-gs.py > /tmp/body.js   (then replace the body)
import mips2js as M, sys
FUNCS = "8004c768 8004c6c8 8004e048 8004e078 8004e308".split()
out = []; allc = set(); names = {}
for f in FUNCS:
  a = int(f, 16); name = f"x{f}"
  js, c = M.translate(a, name, []); out.append(js); allc |= c; names[a] = name
print("\n\n".join(out))
print("\nexport const GS_TRANSLATED = {" + ", ".join(f"0x{a:08x}: {n}" for a, n in names.items()) + " };")
sys.stderr.write("calls outside: " + " ".join(f"{c:08x}" for c in sorted(allc - set(names))) + "\n")
