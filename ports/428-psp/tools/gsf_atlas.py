#!/usr/bin/env python3
"""Build a glyph atlas (PNG, white + 16-level alpha) and metrics JSON from gsffont.gsf/.has.
usage: gsf_atlas.py gsffont.gsf gsffont.has outdir font:size [font:size ...]
Output: outdir/font_<font>_<size>.png and .json {code: [x, y, w, h, m0..m17]} where m* are the
0x24-byte glyph header read as u16 LE (metrics in the font's own units; not yet interpreted).
The output is game data: keep it with the local assets, never in this repository."""
import sys, os, json, struct
from PIL import Image

def main(gsf, has, out, specs):
    G = open(gsf, 'rb').read(); H = open(has, 'rb').read()
    recs = []
    for o in range(4096, len(H) - 5, 6):
        b0, b1 = H[o], H[o + 1]; code, gi = struct.unpack('>HH', H[o + 2:o + 6])
        recs.append(((b0 >> 3) & 15, ((b0 << 8) | b1) & 0x7ff, code, gi))
    os.makedirs(out, exist_ok=True)
    for spec in specs:
        font, size = map(int, spec.split(':'))
        sel = sorted((c, gi) for f, s, c, gi in recs if f == font and s == size)
        glyphs = []
        for code, gi in sel:
            off = (G[gi * 4] | G[gi * 4 + 1] << 8 | G[gi * 4 + 2] << 16) << 5
            h = G[off:off + 0x28]; w, hh = struct.unpack('>HH', h[0x24:0x28])
            p = off + 0x28; idx = 0; run = 0; val = 0; px = []
            def nib():
                nonlocal idx
                b = G[p + idx // 2]; v = (b >> 4) if idx % 2 == 0 else (b & 15); idx += 1; return v
            for _ in range(w * hh):
                if run == 0:
                    val = nib(); run = 1
                    if val == 15: val = nib(); run = nib() + 4
                px.append(val); run -= 1
            glyphs.append((code, w, hh, px, list(struct.unpack('<18H', h[:0x24]))))
        cols = 32; cw = max(g[1] for g in glyphs) + 1; ch = max(g[2] for g in glyphs) + 1
        rows = (len(glyphs) + cols - 1) // cols
        img = Image.new('LA', (cols * cw, rows * ch), (255, 0)); meta = {}
        for i, (code, w, hh, px, m) in enumerate(glyphs):
            x0, y0 = (i % cols) * cw, (i // cols) * ch
            for k, v in enumerate(px):
                if v: img.putpixel((x0 + k % w, y0 + k // w), (255, v * 17))
            meta[code] = [x0, y0, w, hh] + m
        name = f'font_{font}_{size}'
        img.save(os.path.join(out, name + '.png'))
        json.dump(meta, open(os.path.join(out, name + '.json'), 'w'))
        print(name, len(glyphs), img.size)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:])
