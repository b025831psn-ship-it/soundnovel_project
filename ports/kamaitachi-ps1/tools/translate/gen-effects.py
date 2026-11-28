# The scene effects switch 0x800418d0 (its modes not ported by hand in src/screen/weather.js)
# with every routine it reaches that is not already ported or translated: the effects' set-up
# and per-frame routines, the soft-float helpers they use. Output: src/screen/effects-translated.js
#   SLPS=/path/to/SLPS_017.94 python3 gen-effects.py > /tmp/body.js   (then replace the body)
import mips2js as M, sys
FUNCS = """8001c7fc 8001cd20 8001d3d4 8002665c 8002d190 8002d28c 8002d388 8002d8e4 8002d984 8002d9e4 8002dd08
8002e894 8002ebe4 8002f3c0 8002f4cc 8002f8e4 8002fcf4 8002ff40 80030188 800305f4 80030e94 800312b4 800316cc
80031e20 80031e8c 80031efc 80035498 800354f8 8003ac44 8003ae5c 8003af7c 8003bc68 8003bca8 8003be4c 8003cb1c
8003e154 8003e390 8003e53c 8003e7c8 8003ebb4 8003f3cc 8003f884 8003fe70 80040178 80040ab0 80040ebc 800411e8
800418d0 800448d8 80044be4 80044cd4 80044f2c 80044f4c 80045488 80045578
80053e98 80053f98 80054058 80054158 80054218 8005452c 80054618 800546c8""".split()
TABLES = {"800418d0": (0x800125ac, 0x100)}
out = []; allc = set(); names = {}
for f in FUNCS:
  a = int(f, 16); extra = []
  if f in TABLES:
    t, n = TABLES[f]; extra = sorted({M.w32(t + 4 * i) for i in range(n)})
  name = "effectSwitch" if f == "800418d0" else f"x{f}"
  js, c = M.translate(a, name, extra); out.append(js); allc |= c; names[a] = name
print("\n\n".join(out))
print("\nexport const EFFECTS_TRANSLATED = {" + ", ".join(f"0x{a:08x}: {n}" for a, n in names.items()) + " };")
sys.stderr.write("calls outside: " + " ".join(f"{c:08x}" for c in sorted(allc - set(names))) + "\n")
