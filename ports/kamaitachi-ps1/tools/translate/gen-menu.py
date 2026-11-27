import mips2js as M, sys
FUNCS = [
 ("80018cdc","menu"),("80019c30","flowChart"),("8001575c","f8001575c"),("80019544","f80019544"),
 ("80019738","f80019738","80019998+800199b8+800199dc+80019acc"),("80035568","f80035568"),
 ("80037344","f80037344","8003738c+80037398+800373a4+800373b0+800373bc+800373c8+800373d4+800373e0+800373ec+800373f8+80037404+80037410+8003741c+80037428+80037434+80037440+8003746c"),
 ("80044f7c","f80044f7c"),("8001c6a0","f8001c6a0"),("8001c8f8","f8001c8f8"),("800355cc","lzss"),
 ("800378c4","f800378c4"),("80044e90","f80044e90"),("8001c374","f8001c374"),("80037d48","f80037d48"),
 ("8003c8f8","addBox2"),("8001866c","options"),("800145b0","f800145b0"),("80025710","f80025710"),
 ("80014d68","f80014d68"),("8001511c","f8001511c"),("8001b51c","f8001b51c"),("800289ec","f800289ec"),
 ("8002cc48","f8002cc48"),("8002cc98","f8002cc98"),("8003d820","f8003d820"),("80044868","f80044868",None),
 ("80026088","f80026088"),
 ("80044e10","pacMemberBE"),("80044e50","f80044e50"),("80044ecc","fmul8"),("80037e50","f80037e50"),("80037e94","f80037e94"),
 ("8003bc3c","spriteFree"),("8003bdc0","spriteLayer"),("8003a90c","setPalette"),("80026204","repeatOn"),("80026220","repeatOff"),("80044904","memcpy"),
 ("8001824c","save"),("80017e14","f80017e14"),("80017854","f80017854"),("8001c7c0","f8001c7c0"),("80025a08","f80025a08"),
 ("80025c74","f80025c74"),("8002a89c","f8002a89c"),("8003aa8c","f8003aa8c"),("8002bf98","f8002bf98"),("80033648","f80033648"),
 ("80015d74","f80015d74"),("80033be8","f80033be8"),("8003cd78","f8003cd78"),("8002afb8","f8002afb8"),("8002bfe8","f8002bfe8"),
 ("8002c4c0","f8002c4c0"),("8002baa0","f8002baa0"),("800338ac","f800338ac"),("80038b8c","f80038b8c"),("80038ce8","f80038ce8",None),
 ("80038f58","f80038f58"),("80029a6c","f80029a6c"),("80029ad0","f80029ad0"),
 ("80015fa8","cardMessage",None),("8002a980","f8002a980"),("80025898","f80025898"),("8002c530","f8002c530"),("8002a9f8","noCardBox"),("8002a320","yesNo"),("8002bd1c","cardCheck"),("800298e4","cardLoad"),
]
# Tap rows (machine mode): offered before the frame wait of each selection loop; the caller's
# rows come back when the routine returns.
NOTAP = 'withdraw(ctx);'
HOOKS = {
 "80018cdc": {"80019308": 'offer(ctx, Array.from({ length: m.read(0x800792aa, 1) === 1 ? 4 : 3 }, (_, i) => box(i, 0xe8, 0x29 + 17 * i, 0x50, 17)), () => s4 & 0xff, ["up", "down"]);',
              "80019318": 'if (ctx.touch) ctx.touch.menu = prevTouch;'},
 "8001866c": {"80018c88": 'offer(ctx, Array.from({ length: m.read(0x8007913c + 0x17, 1) + 1 }, (_, i) => box(i, 0x4c, 0x3f + 20 * i, 0xb4, 20)), () => s4 & 0xff, ["up", "down"]);'},
 "800145b0": {"80014d14": 'offer(ctx, Array.from({ length: 5 }, (_, i) => box(i, 0x4c, 0x3c + 20 * i, 0xb4, 20)), () => s4 & 0xff, ["up", "down"]);'},
 "80025710": {"8002573c": NOTAP},
 "80014d68": {"800150c0": 'offer(ctx, [box(100000, 0x90, 0xd0, 0x18, 0x12), box(100001, 0x90, 0x40, 0x18, 0x10), box(100002, 0x7c, 0x2c, 0x42, 0x13)], () => 0, ["up", "down"], { 100000: "down", 100001: "up", 100002: "cross" });'},
 "8001511c": {"800153e8": NOTAP},
 "80019c30": {"8001b310": 'offer(ctx, [...Array.from({ length: 36 }, (_, k) => box(k, 9 + 36 * (k % 6), 43 + 28 * Math.floor(k / 6), 36, 28)), box(100001, 9, 28, 216, 15), box(100002, 9, 211, 216, 20), box(100003, 0, 43, 9, 168), box(100004, 225, 43, 20, 168)], () => (m.read((sp + 0x38) >>> 0, 2) % 6) * 6 + (m.read((sp + 0x30) >>> 0, 2) % 6), ["up", "down"], { 100001: "up", 100002: "down", 100003: "left", 100004: "right" }, { cols: 6, across: ["left", "right"] });'},
 "8002a320": {"8002a754": 'offer(ctx, (fp & 0xff) ? [box(0, 0x3c, 0x7e, 0xc8, 0x1a), box(1, 0x3c, 0x98, 0xc8, 0x1a)] : [box(0, 0x3c, 0x8a, 0xc8, 0x38)], () => s1 & 0xff, ["up", "down"]);'},
 "80017e14": {"80017ff8": 'offer(ctx, [box(0, 0x23, 0x59, 0x75, 0x12), box(1, 0xaa, 0x59, 0x75, 0x12)], () => s0 & 0xff, ["left", "right"]);'},
 "8002a89c": {"8002a924": NOTAP},
}
out=[]; allc=set(); names={}
for f in FUNCS:
  a=int(f[0],16); extra=[]
  if len(f)>2 and f[2]: extra=[int(x,16) for x in f[2].split('+')]
  if f[0]=="80015fa8":
    extra=sorted({M.w32(0x80011378+4*i) for i in range(7)})
  if f[0]=="80038ce8":
    extra=sorted({M.w32(0x80011d9c+4*i) for i in range(10)})
  if f[0]=="80044868":
    extra=sorted({M.w32(0x80012b8c+4*i) for i in range(0x56)})
  h=HOOKS.get(f[0],{})
  js,c=M.translate(a,f[1],extra,hooks={int(k,16):v for k,v in h.items()},touch=bool(h)); out.append(js); allc|=c; names[a]=f[1]
print("\n\n".join(out))
print("\nexport const TRANSLATED = {"+", ".join(f"0x{a:08x}: {n}" for a,n in names.items())+" };")
sys.stderr.write("unresolved: "+" ".join(f"{c:08x}" for c in sorted(allc - set(names)))+"\n")
