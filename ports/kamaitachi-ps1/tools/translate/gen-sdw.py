# The silhouette blend 0x8003b398 drawSdw(page, src, dst, mode), with its palette path.
# Output: src/screen/sdw-translated.js
#   SLPS=/path/to/SLPS_017.94 python3 gen-sdw.py > /tmp/body.js   (then replace the body)
import mips2js as M, sys
js, c = M.translate(0x8003b398, "x8003b398", [])
print(js)
sys.stderr.write("calls outside: " + " ".join(f"{x:08x}" for x in sorted(c)) + "\n")
