"""Outpainting pilot: extend a few GBA background pictures beyond 240x160 with an image model.

The original pixels are never changed: the model only fills the margins, the result is brought back
to the GBA pixel grid and to the picture's own palette (so the engine's tone and fades still apply),
and the original 240x160 is pasted back on top.

  python tools/outpaint/pilot.py --data kamaitachi-gba-kor/port-data --out <private folder> \
      --model gpt-image-1 001 002 009 201 202

Reads the key from OPENAI_API_KEY (on Windows also the user's registry environment). Outputs are
derived from the game's art: keep them in the private sub-repository, never in this one.
"""
import argparse, base64, io, json, os, sys, time, urllib.error, urllib.request, uuid
from PIL import Image

PROMPT = ("Outpainting. The transparent area surrounds an existing photograph from a 2002 game. "
          "Continue the same scene naturally into the transparent area: same place, perspective, lighting, "
          "color grading, film grain and softness. At the borders keep the exact brightness and color of the "
          "photograph's edge (no darker or more saturated sky); clouds, haze and texture as soft and blurry as "
          "in the photograph. Do not change the existing photograph. Do not add people, "
          "text, logos or new prominent objects.")

def key():
    value = os.environ.get("OPENAI_API_KEY")
    if not value and sys.platform == "win32":
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as k:
            value = winreg.QueryValueEx(k, "OPENAI_API_KEY")[0]
    if not value: sys.exit("OPENAI_API_KEY is not set")
    return value

def decode(data, n):
    tiles = open(os.path.join(data, "bg", f"{n:03d}.bin"), "rb").read()
    raw = open(os.path.join(data, "palette", f"{n:03d}.bin"), "rb").read()
    colors = []
    for i in range(256):
        c = raw[2 * i] | raw[2 * i + 1] << 8
        colors.append(tuple((((c >> s) & 31) << 3) | (((c >> s) & 31) >> 2) for s in (0, 5, 10)))
    image = Image.new("RGB", (240, 160))
    px = image.load()
    for y in range(160):
        for x in range(240):
            px[x, y] = colors[tiles[((y >> 3) * 30 + (x >> 3)) * 64 + (y & 7) * 8 + (x & 7)]]
    return image, colors

def edit(api_key, model, canvas, quality):
    buffer = io.BytesIO(); canvas.save(buffer, "PNG")
    boundary = uuid.uuid4().hex
    fields = {"model": model, "prompt": PROMPT, "size": f"{canvas.width}x{canvas.height}", "n": "1"}
    if quality: fields["quality"] = quality
    body = b""
    for name, value in fields.items():
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
    body += (f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="image.png"\r\n'
             f"Content-Type: image/png\r\n\r\n").encode() + buffer.getvalue() + b"\r\n"
    # The same picture as the mask: its transparent margin is what the model may paint.
    body += (f'--{boundary}\r\nContent-Disposition: form-data; name="mask"; filename="mask.png"\r\n'
             f"Content-Type: image/png\r\n\r\n").encode() + buffer.getvalue() + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    request = urllib.request.Request("https://api.openai.com/v1/images/edits", data=body, headers={
        "Authorization": f"Bearer {api_key}", "Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(request, timeout=300) as response:
        result = json.load(response)
    item = result["data"][0]
    image = Image.open(io.BytesIO(base64.b64decode(item["b64_json"]))).convert("RGB")
    return image, {k: result.get(k) for k in ("model", "usage", "created")}

def quantize(image, colors):
    palette = Image.new("P", (1, 1))
    flat = [c for rgb in colors[:236] for c in rgb]
    palette.putpalette(flat + flat[:3] * (256 - len(flat) // 3))
    return image.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGB")

def match_edges(image, original, ox, oy, fade=45.0, smooth=31):
    """Bring the generated margin to the original's edge colors, fading back with distance (no seam)."""
    import numpy as np
    g = np.asarray(image.convert("RGB")).astype(float)
    o = np.asarray(original.convert("RGB")).astype(float)
    h, w = g.shape[:2]
    kernel = np.ones(smooth) / smooth
    def blur(d):
        return np.stack([np.convolve(np.pad(d[:, c], smooth // 2, mode="edge"), kernel, "valid") for c in range(3)], 1)
    top, bottom, left, right = oy, oy + 160, ox, ox + 240
    if top > 0:
        d = blur(o[0] - g[top - 1, left:right])
        for i, row in enumerate(range(top - 1, -1, -1)): g[row, left:right] += d * np.exp(-i / fade)
    if bottom < h:
        d = blur(o[159] - g[bottom, left:right])
        for i, row in enumerate(range(bottom, h)): g[row, left:right] += d * np.exp(-i / fade)
    if left > 0:
        d = blur(o[:, 0] - g[top:bottom, left - 1])
        for i, col in enumerate(range(left - 1, -1, -1)): g[top:bottom, col] += d * np.exp(-i / fade)
    if right < w:
        d = blur(o[:, 239] - g[top:bottom, right])
        for i, col in enumerate(range(right, w)): g[top:bottom, col] += d * np.exp(-i / fade)
    return Image.fromarray(np.clip(g, 0, 255).astype("uint8"))

# Each shape: canvas size sent to the model, where the original goes (scaled), and the GBA-pixel size
# of the result. wide: 16:9 (sides added; top/bottom generated too and cropped). portrait: the full
# width kept, height grown to 1.5x width so an upright phone can show a band of it.
SHAPES = {
    "wide": dict(canvas=(1536, 1024), scale=5.4, crop=(284, 160)),
    "portrait": dict(canvas=(1024, 1536), scale=1024 / 240, crop=(240, 360)),
}

def run(args):
    api_key = key()
    os.makedirs(args.out, exist_ok=True)
    log = open(os.path.join(args.out, "log.jsonl"), "a", encoding="utf-8")
    for name in args.pictures:
        n = int(name)
        original, colors = decode(args.data, n)
        original.save(os.path.join(args.out, f"{n:03d}-original.png"))
        for shape, spec in SHAPES.items():
            if args.only and shape != args.only: continue
            cw, ch = spec["canvas"]
            w, h = round(240 * spec["scale"]), round(160 * spec["scale"])
            canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
            canvas.paste(original.resize((w, h), Image.NEAREST).convert("RGBA"), ((cw - w) // 2, (ch - h) // 2))
            started = time.time()
            try:
                generated, meta = edit(api_key, args.model, canvas, args.quality)
            except urllib.error.HTTPError as error:
                print(n, shape, error.code, error.read().decode()[:400]); continue
            generated.save(os.path.join(args.out, f"{n:03d}-{shape}-raw.png"))
            # Back to GBA pixels: the model's canvas at 1/scale, then the crop around the original.
            gw, gh = round(cw / spec["scale"]), round(ch / spec["scale"])
            ox, oy = (gw - 240) // 2, (gh - 160) // 2
            small = match_edges(generated.resize((gw, gh), Image.LANCZOS), original, ox, oy)
            small.paste(original, (ox, oy))
            # Also the picture's own palette, for comparison (fades/tone then apply as on the cartridge).
            paletted = quantize(small, colors); paletted.paste(original, (ox, oy))
            tw, th = spec["crop"]
            left, top = (gw - tw) // 2, (gh - th) // 2
            paletted.crop((left, top, left + tw, top + th)).save(os.path.join(args.out, f"{n:03d}-{shape}-palette.png"))
            small.crop((left, top, left + tw, top + th)).save(os.path.join(args.out, f"{n:03d}-{shape}.png"))
            log.write(json.dumps({"picture": n, "shape": shape, "seconds": round(time.time() - started, 1), **meta}) + "\n")
            log.flush()
            print(n, shape, "ok", meta.get("model"), meta.get("usage"))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="kamaitachi-gba-kor/port-data")
    parser.add_argument("--out", required=True)
    parser.add_argument("--model", default="gpt-image-1")
    parser.add_argument("--quality", default="medium")
    parser.add_argument("--only", choices=list(SHAPES))
    parser.add_argument("pictures", nargs="+")
    run(parser.parse_args())
