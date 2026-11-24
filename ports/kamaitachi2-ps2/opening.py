"""Decode the assets used by the normal new-game path through both name commands."""

import json
import re
import struct

from PIL import Image


def elf_string(elf, va):
    phoff, = struct.unpack_from("<I", elf, 28)
    stride, count = struct.unpack_from("<HH", elf, 42)
    for i in range(count):
        kind, offset, start, _, size = struct.unpack_from("<5I", elf, phoff + i * stride)
        if kind == 1 and start <= va < start + size:
            at = offset + va - start
            return elf[at:elf.index(0, at, offset + size)].decode("cp932")
    raise ValueError(f"Unmapped EE address {va:#x}")


def font_atlas(data, out):
    count, table_end = struct.unpack_from("<II", data, 40)
    if data[:15] != b"SN4Font:V.1.4.0" or table_end != 48 + count * 12:
        raise ValueError("Unknown SN4 font index")
    cell, columns = 36, 64
    atlas = Image.new("RGBA", (columns * cell, ((count + columns - 1) // columns) * cell))
    metrics = {}
    # SN4's six observed coverage levels include the glyph's dark outline.
    values = {0: (0, 0, 0, 0), 1: (0, 0, 0, 255), 2: (48, 48, 48, 255),
              4: (128, 128, 128, 255), 5: (170, 170, 170, 255), 7: (255, 255, 255, 255)}
    for i in range(count):
        code, width, top, height, offset = struct.unpack_from("<IBBHI", data, 48 + i * 12)
        pixels = bytearray()
        while len(pixels) < width * height * 4:
            run = data[offset]
            offset += 1
            if not run >> 4 or run & 15 not in values:
                raise ValueError(f"Invalid SN4 glyph run for {code:#x}")
            pixels.extend(bytes(values[run & 15]) * (run >> 4))
        if len(pixels) != width * height * 4 or max(width, height) > cell:
            raise ValueError("SN4 glyph bitmap exceeds its dimensions")
        if i + 1 < count and offset != struct.unpack_from("<I", data, 68 + 12 * i)[0]:
            raise ValueError("SN4 glyph does not end at the next index offset")
        x, y = (i % columns) * cell, (i // columns) * cell
        atlas.paste(Image.frombytes("RGBA", (width, height), bytes(pixels)), (x, y))
        metrics[code.to_bytes(2, "big").decode("cp932")] = [x, y, width, height, top]
    atlas.save(out / "font.png")
    return metrics


def texture(data):
    header = re.match(rb"CTF V0.1:size=\s*(\d+) x\s*(\d+) :PSMT(4|8) ", data)
    if not header:
        raise ValueError("Unknown CTF texture header")
    width, height, bits = map(int, header.groups())
    colors = 1 << bits
    offset = 128 + colors * 4
    pixels = data[offset:]
    if len(pixels) * 8 != width * height * bits:
        raise ValueError("Incomplete CTF bitmap")
    if bits == 4:
        pixels = bytes(n for b in pixels for n in (b & 15, b >> 4))
    palette = bytearray()
    alpha = bytearray()
    for i in range(colors):
        # The PS2 CSM1 CLUT swaps index bits 3 and 4 for PSMT8.
        slot = (i & ~24) | ((i & 8) << 1) | ((i & 16) >> 1) if bits == 8 else i
        r, g, b, a = data[128 + 4 * slot:132 + 4 * slot]
        palette.extend((r, g, b))
        alpha.append(min(255, a * 2))
    image = Image.frombytes("P", (width, height), pixels)
    image.putpalette(palette)
    image.info["transparency"] = bytes(alpha)
    return image.convert("RGBA")


def scenario_strings(data):
    labels = list(re.finditer(rb"\x85\x0b\x0c(my01_[0-9]{4})\x00\x22", data))
    story = {}
    for current, following in zip(labels, labels[1:]):
        name = current[1].decode("ascii")
        if name in {"my01_0010", "my01_0012", "my01_0022", "my01_0040", "my01_0055", "my01_0070"}:
            block = data[current.end():following.start()]
            story[name] = [s.decode("cp932") for s in re.findall(rb"\x02([^\x00-\x1f]+)\x03", block)]
        if name in {"my01_0047", "my01_0062"}:
            expected = 0x12 if name.endswith("0047") else 0x13
            if data[following.start() - 1] != expected:
                raise ValueError(f"Unexpected name command in {name}")
    if len(story) != 6:
        raise ValueError("Opening labels could not be resolved")
    return story


def still_png(data, work, destination, encode):
    if data[:4] != b"ipum" or struct.unpack_from("<I", data, 12)[0] != 1:
        raise ValueError("Expected a single-frame IPU image")
    # FFmpeg's IPU demuxer emits the trailing sequence terminator as a second
    # packet. Keep the picture end marker and remove only the standalone terminator.
    if data.endswith(b"\0\0\x01\xb0\0\0\x01\xb1"):
        data = data[:4] + struct.pack("<I", len(data) - 4) + data[8:-4]
    source = work / "scene.ipu"
    source.write_bytes(data)
    encode(["-i", str(source), "-frames:v", "1"], destination)


def opening_assets(disc, out, encode):
    def asset(name):
        return disc.read(disc.files[name])

    for name in ("my0007", "my0645"):
        still_png(asset(f"GRA/MY/{name}.ipu"), out, out / f"{name}.png", encode)
    title_music = elf_string(disc.elf, 0x219c08)
    for name in (title_music, "k1a001.ogg"):
        (out / name).write_bytes(asset("SOUND/VORBIS/" + name))
    texture(asset("EFFECT/name_e01.ctf")).save(out / "name_e01.png")
    for name in ("sys_fc01", "sys_cd01", "sys_cd02", "sys_jo01", "sys_jo02", "sys_jo03", "sys_save", "sys_wa01"):
        texture(asset(f"SYS_MENU/{name}.ctf")).save(out / f"{name}.png")
    config = {
        "font": font_atlas(asset("SCENARIO/sn4.fnt"), out),
        "rows": asset("SCENARIO/namkan.txt").decode("cp932").strip("\n").split("\n\n"),
        "defaults": [elf_string(disc.elf, va) for va in (0x224628, 0x224630)],
        "prompts": [elf_string(disc.elf, va) for va in (0x1ff090, 0x1ff0a0, 0x1ff0d8)],
        "story": scenario_strings(asset("SCENARIO/scenario.sn4")),
        "titleMusic": title_music,
    }
    (out / "opening.json").write_text(json.dumps(config, ensure_ascii=False), encoding="utf-8")
