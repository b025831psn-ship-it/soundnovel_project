# The per-frame scene effects 0x800416a4 (weatherTick) with the routines src/screen/weather.js
# does not port by hand: the palette animation 0x8003f708, the layers 0x80041464 and the
# picture flips of 0x800417d4 / 0x8004188c. Output: src/screen/weather-translated.js
#   SLPS=/path/to/SLPS_017.94 python3 gen-weather.py > /tmp/body.js   (then replace the body)
import mips2js as M, sys
FUNCS = "800416a4 8002f0bc 8003f708 80041464 8003ad50".split()
out = []; allc = set(); names = {}
for f in FUNCS:
  a = int(f, 16)
  name = f"x{f}"
  js, c = M.translate(a, name, []); out.append(js); allc |= c; names[a] = name
print("\n\n".join(out))
print("\nexport const WEATHER_TRANSLATED = {" + ", ".join(f"0x{a:08x}: {n}" for a, n in names.items()) + " };")
sys.stderr.write("calls outside: " + " ".join(f"{c:08x}" for c in sorted(allc - set(names))) + "\n")
