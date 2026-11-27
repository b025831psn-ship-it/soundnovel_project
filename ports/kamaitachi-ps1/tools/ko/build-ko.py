#!/usr/bin/env python3
"""Korean text for the PS1 machine: the font and the script patch, made from the private
translation (kamaitachi-ps1-kor script/ja/script.ja.json, script/ko/script.ko.json).

  python3 tools/ko/build-ko.py EXE_DATA.bin SCRIPT_JA.json SCRIPT_KO.json FONT.ttf OUT_DIR

Writes OUT_DIR/ko-font.bin, OUT_DIR/ko-script.json and OUT_DIR/ko-report.json. The two data
files hold glyphs and the translated script: they are port data (not committed to this
repository), served next to the PAC files as ko/ko-font.bin and ko/ko-script.json.

Font: the game's own format (src/text/glyph.js): big-endian u16 offsets (x4), then per glyph
width, height and 4-bit pixels (0 empty, 1 the dark outline, 2..14 the stroke, 0xf a run).
Korean glyph i has the text code (0xa0 + (i >> 7)) << 8 | 0x80 + (i & 0x7f); those lead bytes
are not used by the original font. Characters the original font has keep their SJIS code.

Script: per resource a list of [record, offset, base64 text bytes]: the bytes that replace the
text payload of the command at that offset of the record (the ids of script.ja.json).
An ASCII space stays the byte 0x20; the Korean build of the text routine gives it a width
and breaks lines at it (src/text/text.js).
"""
import base64, collections, hashlib, json, os, re, struct, sys
from PIL import Image, ImageDraw, ImageFont

H = 19            # glyph height of the original font
HANGUL_W = 15     # as the original's kana (advance = width + 1)
SIZE = 13
SPACE = 6         # the width of the byte 0x20 in the Korean build (src/text/text.js KO_SPACE)
LEFT, RIGHT, TOP, LINE, LINES = 8, 0x120, 0x11, 0x16, 10
HASH = 0x8006b754
# The default names: the pointers the game copies string 1 (the hero, [n1]) and string 2 (the
# companion, [n2]) from (0x8003ab98). The original fields hold one and two glyphs; the Korean
# names go to unused kernel RAM and the pointers follow.
NAMES = [(0x8006b74c, 0x800792d4, 0x8000c010, '토오루'), (0x8006b750, 0x800792cc, 0x8000c000, '마리')]
HANG = '.,?!~)]}\u2026\u00b7\u2019\u201d'   # may hang past the right edge once, as the original's punctuation
TOKEN = re.compile(r'(\[[^\]]*\])')
SINGLE = set('@rRLpPgko')


def exe_reader(path):
    b = open(path, 'rb').read()
    assert b[:4] == b'KPXD', 'not an EXE data asset'
    parts, o = [], 8
    for _ in range(struct.unpack_from('<I', b, 4)[0]):
        addr, n = struct.unpack_from('<II', b, o); parts.append((addr, b[o + 8:o + 8 + n])); o += 8 + n
    def read(a, n):
        for addr, data in parts:
            if addr <= a and a + n <= addr + len(data): return data[a - addr:a - addr + n]
        raise SystemExit('EXE data: 0x%x is not in the asset' % a)
    return read


def original_codes(read):
    """character -> SJIS code for every glyph of the original font (the hash table)."""
    out = {}
    t = read(HASH, 0x4000)
    for i in range(0x1000):
        code = struct.unpack_from('<H', t, i * 4)[0]
        if code < 0x8140 or code == 0xffff: continue
        try: ch = struct.pack('>H', code).decode('cp932')
        except UnicodeDecodeError: continue
        if len(ch) == 1: out.setdefault(ch, code)
    return out


def ksx1001():
    s = []
    for lead in range(0xb0, 0xc9):
        for trail in range(0xa1, 0xff):
            try: s.append(bytes([lead, trail]).decode('euc_kr'))
            except UnicodeDecodeError: pass
    return s


def rasterize(font, ch, ss=4):
    """One glyph in the original's style: width, rows of values 0..14."""
    big = ImageFont.truetype(font, SIZE * ss)
    hangul = '가' <= ch <= '힣'
    adv = big.getlength(ch) / ss
    w = HANGUL_W if hangul else max(3, min(HANGUL_W, int(round(adv)) + 2))
    im = Image.new('L', (w * ss, H * ss), 0); d = ImageDraw.Draw(im)
    bb = d.textbbox((0, 0), ch, font=big)
    x = (w * ss - (bb[2] - bb[0])) // 2 - bb[0] if bb[2] > bb[0] else 0
    d.text((x, 0), ch, font=big, fill=255)
    px = list(im.resize((w, H), Image.BOX).tobytes())
    lv = [0 if v < 18 else min(14, 2 + v * 13 // 256) for v in px]
    out = lv[:]
    for y in range(H):
        for xx in range(w):
            if lv[y * w + xx]: continue
            if any(0 <= y + dy < H and 0 <= xx + dx < w and px[(y + dy) * w + xx + dx] >= 60 for dy in (-1, 0, 1) for dx in (-1, 0, 1)):
                out[y * w + xx] = 1
    return w, out


def pack_glyph(w, px):
    nib = []
    i = 0
    while i < len(px):
        v = px[i]; n = 1
        while i + n < len(px) and px[i + n] == v and n < 19: n += 1
        if n >= 4: nib += [0xf, v, n - 4]; i += n
        else: nib.append(v); i += 1
    if len(nib) & 1: nib.append(0)
    return bytes([w, H]) + bytes(nib[k] << 4 | nib[k + 1] for k in range(0, len(nib), 2))


def build_font(font, chars):
    table = (2 * len(chars) + 3) & ~3
    blob, offsets, widths = bytearray(), [], {}
    for ch in chars:
        w, px = rasterize(font, ch)
        widths[ch] = w
        offsets.append((table + len(blob)) // 4)
        g = pack_glyph(w, px); blob += g + bytes(-len(g) & 3)
    if offsets and offsets[-1] > 0xffff: raise SystemExit('font too large for the 16-bit offsets')
    head = b''.join(struct.pack('>H', o) for o in offsets)
    return head + bytes(table - len(head)) + bytes(blob), widths


def ko_code(i): return (0xa0 + (i >> 7)) << 8 | 0x80 + (i & 0x7f)


def main():
    exe, ja_path, ko_path, font, out = sys.argv[1:6]
    read = exe_reader(exe)
    orig = original_codes(read)
    ja = json.load(open(ja_path, encoding='utf-8')); items = ja['items']
    ko = json.load(open(ko_path, encoding='utf-8'))
    report = {'entries': len(ko), 'source': ja.get('source')}
    ids = [e['id'] for e in items]; kids = [e['id'] for e in ko]
    report['idsMatch'] = ids == kids
    report['duplicates'] = len(kids) - len(set(kids))
    report['missing'] = len(set(ids) - set(kids)); report['extra'] = len(set(kids) - set(ids))
    if ids != kids: raise SystemExit('ids differ from the Japanese script')

    # the characters of the translation
    used = collections.Counter()
    control, empty, japanese = [], [], []
    jp = re.compile(r'[ぁ-ゖァ-ヺ一-鿿]')
    for e, k in zip(items, ko):
        tj, tk = TOKEN.findall(e['ja']), TOKEN.findall(k['ko'])
        if tj != tk: control.append(e['id'])
        body = TOKEN.sub('', k['ko'])
        if not body.strip() and TOKEN.sub('', e['ja']).strip(): empty.append(e['id'])
        if jp.search(body): japanese.append(e['id'])
        used.update(body)
    report['controlMismatch'] = control; report['empty'] = empty
    report['japaneseLeft'] = dict(collections.Counter(i[:3] for i in japanese)); report['japaneseLeftTotal'] = len(japanese)

    hangul = ksx1001()
    extra = sorted(c for c in used if '가' <= c <= '힣' and c not in set(hangul))
    new = hangul + extra
    used.update(''.join(n[3] for n in NAMES))
    new += [chr(c) for c in range(0x21, 0x7f)]                       # narrow ASCII (0x20 is the space byte)
    new += sorted(c for c in used if ord(c) >= 0x80 and c not in orig and c not in set(new) and c != '　')
    probe = ImageFont.truetype(font, SIZE)
    missing = [c for c in new if not probe.getmask(c).getbbox()]
    report['notInFontFile'] = missing
    blob, widths = build_font(font, new)
    code = {c: ko_code(i) for i, c in enumerate(new)}
    report['glyphs'] = {'korean': len(new), 'hangul': len(hangul) + len(extra), 'hangulUsed': sum(1 for c in used if '가' <= c <= '힣'),
                        'originalReused': sum(1 for c in used if ord(c) >= 0x80 and c in orig), 'fontBytes': len(blob)}

    def encode(s):
        b = bytearray()
        for part in TOKEN.split(s):
            if not part: continue
            if part[0] == '[' and part[-1] == ']':
                t = part[1:-1]
                if t == 'sp': b.append(0x20)
                elif t in SINGLE: b.append(ord(t))
                else:
                    arg = t[1:]
                    b += bytes([ord(t[0]), ord(arg) if len(arg) == 1 else int(arg, 16)])
                continue
            for ch in part:
                if ch == ' ': b.append(0x20)
                elif ch == '　': b += b'\x81\x40'
                elif ord(ch) < 0x80 or ch not in orig: b += struct.pack('>H', code[ch])
                else: b += struct.pack('>H', orig[ch])
        return bytes(b)

    # layout: the lines of every page, as the text routine types them (src/text/text.js)
    owidth = {}
    def width(c):
        if 0xa000 <= c < 0xe000: return widths[new[((c >> 8) - 0xa0) << 7 | (c & 0x7f)]]
        return owidth.get(c, 15)
    try:
        font_ptr_data = None  # the original widths are read by the browser; here kana/kanji count as 15 or 16
    except Exception: pass
    for ch, c in orig.items(): owidth[c] = 16 if '一' <= ch <= '鿿' else 15
    for c in (0x8175, 0x8176, 0x8177, 0x8178): owidth[c] = 7
    owidth[0x8140] = 2

    hang = {0x8142, 0x8149, 0x8148, 0x8141, 0x8145, 0x8176, 0x8178, 0x816a, 0x8163, 0x815c, 0x8160} | {code[c] for c in HANG if c in code}
    res = collections.defaultdict(list)
    def layout(texts):
        """ids whose text runs below the last line of the page, and the widest line end."""
        over, widest, state = [], 0, {}
        for (rid, rec, eid), b in texts:
            st = state.setdefault((rid, rec), {'x': LEFT, 'y': TOP, 'q': 0, 'k': 0})
            x, y, q, kin = st['x'], st['y'], st['q'], st['k']
            i = 0
            while i < len(b):
                c = b[i]
                if c == 0x20:
                    i += 1
                    if x > LEFT:
                        n, last, j = 0, 0, i
                        while j < len(b) and b[j] >= 0x78: last = width(b[j] << 8 | b[j + 1]) + 1; n += last; j += 2
                        if n and x + SPACE + n - last >= RIGHT: x = LEFT; y += LINE
                        else: x += SPACE
                    continue
                if c in (0x72, 0x40):
                    if c == 0x40 or not q: x = LEFT; y += LINE
                    i += 1; continue
                if c == 0x4c:
                    if x >= 0x100: x = LEFT; y += LINE
                    i += 1; continue
                if c == 0x67: x, y = LEFT, TOP; i += 1; continue
                if c < 0x78: i += 2 if chr(c) in 'cChsvnw' else 1; continue
                g = c << 8 | b[i + 1]; i += 2
                if g in (0x8175, 0x8177): q += 1
                if g in (0x8176, 0x8178): q = max(0, q - 1)
                if g in hang:
                    if x >= RIGHT:
                        if kin: x = LEFT; y += LINE; kin = 0
                        else: kin = 1
                else:
                    if x >= RIGHT: x = LEFT; y += LINE
                    kin = 0
                x += width(g) + 1; widest = max(widest, x)
                if y > TOP + LINE * (LINES - 1) and (not over or over[-1] != eid): over.append(eid)
            st['x'], st['y'], st['q'], st['k'] = x, y, q, kin
        return over, widest
    kt, jt = [], []
    for e, k in zip(items, ko):
        rid, rec, off = (int(x) for x in e['id'].split('-'))
        b = encode(k['ko'])
        if b'\x00' in b: raise SystemExit('a zero byte in ' + e['id'])
        res[rid].append([rec, off, base64.b64encode(b).decode()])
        kt.append(((rid, rec, e['id']), b))
        try: jt.append(((rid, rec, e['id']), encode(e['ja'])))
        except KeyError: pass
    overflow, widest = layout(kt)
    jover = set(layout(jt)[0])
    report['pageOverflowAlsoInJapanese'] = sum(1 for i in overflow if i in jover)
    overflow = [i for i in overflow if i not in jover]
    report['pageOverflow'] = {'count': len(overflow), 'ids': overflow[:200]}
    report['widestLineEndX'] = widest
    sizes = {r: sum(len(base64.b64decode(t[2])) for t in v) for r, v in res.items()}
    report['textBytes'] = sum(sizes.values())

    patches = []
    for ptr, old, at, name in NAMES:
        if struct.unpack('<I', read(ptr, 4))[0] != old: raise SystemExit('the name pointer at 0x%x is not 0x%x' % (ptr, old))
        patches += [[at, base64.b64encode(encode(name) + b'\0').decode()], [ptr, base64.b64encode(struct.pack('<I', at)).decode()]]
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'ko-font.bin'), 'wb').write(blob)
    json.dump({'schema': 'kamaitachi.ps1.ko-script.v1', 'source': ja.get('source'), 'glyphs': len(new), 'space': SPACE, 'hang': [code[c] for c in HANG if c in code],
               'patches': patches,
               'resources': {str(r): v for r, v in sorted(res.items())}}, open(os.path.join(out, 'ko-script.json'), 'w'), separators=(',', ':'))
    json.dump(report, open(os.path.join(out, 'ko-report.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in report.items() if k not in ('pageOverflow',)}, ensure_ascii=False))
    print('page overflow', len(overflow), overflow[:20])


if __name__ == '__main__':
    main()
