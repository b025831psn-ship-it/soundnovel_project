# The special scenes 0x80044384 (scenario command 0x3d's k; the cases src/title.js special()
# does not port by hand) with every routine they reach that is not already ported or
# translated. Output: src/scenario/special-translated.js
#   SLPS=/path/to/SLPS_017.94 python3 gen-special.py > /tmp/body.js   (then replace the body)
import mips2js as M, sys
FUNCS = """80044384 80025600 80037a7c 800390ac 800426b0 80043b90 8004419c 8003a820 8003a89c 800432ec 80044dd0
8003a8d0 80044d88""".split()
TABLES = {"80044384": (0x800129dc, 0x6c)}
out = []; allc = set(); names = {}
for f in FUNCS:
  a = int(f, 16); extra = []
  if f in TABLES:
    t, n = TABLES[f]; extra = sorted({M.w32(t + 4 * i) for i in range(n)})
  name = "specialSwitch" if f == "80044384" else f"x{f}"
  js, c = M.translate(a, name, extra); out.append(js); allc |= c; names[a] = name
print("\n\n".join(out))
print("\nexport const SPECIAL_TRANSLATED = {" + ", ".join(f"0x{a:08x}: {n}" for a, n in names.items()) + " };")
sys.stderr.write("calls outside: " + " ".join(f"{c:08x}" for c in sorted(allc - set(names))) + "\n")
