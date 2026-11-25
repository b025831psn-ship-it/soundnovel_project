"""Decode the assets used by the normal new-game path through both name commands."""

import json
import re
import struct

from PIL import Image


# SLPS_251.32 command-constructor dispatch entries used by the opening path.
# Operand sizes exclude the opcode itself; "sized" begins with a one-byte size.
SN4_COMMANDS = {
    0x02: (0x0010F620, "cp932 text terminated by 03"),
    0x04: (0x0010F640, "none"),
    0x09: (0x0010F660, "none"),
    0x0D: (0x0010F6E0, "none"),
    0x0E: (0x0010F6E0, "none"),
    0x12: (0x0010FC40, "none"),
    0x13: (0x0010FC40, "none"),
    0x40: (0x0010F7C0, "u8"),
    0x46: (0x0010F940, "u8"),
    0x4C: (0x0010F8C0, "u8, u8"),
    0x50: (0x0010FA00, "be32"),
    0x55: (0x0010F880, "be32"),
    0x65: (0x0010F960, "be32"),
    0x6A: (0x0010F6A0, "typed NUL-terminated label"),
    0x6B: (0x0010F6A0, "typed NUL-terminated label"),
    0x6C: (0x0010F6C0, "sized selection payload"),
    0x6F: (0x0010F780, "sized wipe payload"),
    0x70: (0x0010FAE0, "sized condition payload"),
    0x72: (0x0010F7E0, "sized ASCII resource name"),
    0x73: (0x0010F820, "sized ASCII resource name"),
    0x74: (0x0010F800, "sized ASCII resource name"),
    0x75: (0x0010F920, "03, r, g, b"),
}
from disc import Extent, SECTOR


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


def answer_header(block):
    pos = 0
    if block.startswith(b"\x7b\x0c\x13sh01_0010\x00\x06"):
        pos = 14
    while block[pos] in (0x72, 0x73, 0x74):
        pos += 2 + block[pos + 1]
    marker = re.match(rb"\x6a[\x07\x08][\x0c\x0d]_myb?\d+\x00", block[pos:])
    if not marker:
        raise ValueError("Missing answer marker")
    pos += marker.end()
    lines = []
    while block[pos] == 2:
        end = block.index(b"\x03\x04", pos)
        lines.append(block[pos+1:end].decode("cp932"))
        pos = end + 2
    return lines, pos


def song_page(block):
    header = re.match(rb"(?:\x73\x07my0023\x00\x74\x0amy0023_00\x00\x50(.{4}))?"
                      rb"\x73\x08my0023([a-e])\x00\x74\x0bmy0023\2_00\x00\x4c(.{2})\x5a(.{4})\x40\x00", block, re.S)
    if not header:
        raise ValueError("Unexpected song page introduction")
    pos = header.end()
    placements = []
    glyph = re.compile(rb"\x66(.{4})(?:\x06\x02([^\x03]+)\x03\x07)?\x02([^\x03]+)\x03\x04", re.S)
    while match := glyph.match(block, pos):
        x, y = struct.unpack(">hh", match[1])
        placement = {"x": x, "y": y, "text": match[3].decode("cp932")}
        if match[2]:
            placement["reading"] = match[2].decode("cp932")
        placements.append(placement)
        pos = match.end()
    footer = re.fullmatch(rb"\x40\x01\x50(.{4})\x32\x15\x1e\x66(.{4})\x0b(?:\x74\x0bmy0023d_10\x00)?\x5c(.{4})(?:\x74\x0bmy0023e_10\x00)?\x15", block[pos:], re.S)
    if not placements or not footer:
        raise ValueError("Unexpected song page layout or closing commands")
    return {"placements": placements, "introWait": int.from_bytes(header[1] or bytes(4), "big"),
            "fontArgs": list(header[3]), "command5a": int.from_bytes(header[4], "big"),
            "hold": int.from_bytes(footer[1], "big"), "endPosition": list(struct.unpack(">hh", footer[2])),
            "command5c": int.from_bytes(footer[3], "big")}


def scenario_strings(data):
    labels = list(re.finditer(rb"\x85(?:\x0b\x0c(my0[123]_[0-9]{4})|\x0b\x0a(mo0[12]_[0-9]{4})|\x0c\x0d(myb02_[0-9]{4}))\x00\x22", data))
    story = {}
    for current, following in zip(labels, labels[1:]):
        name = (current[1] or current[2] or current[3]).decode("ascii")
        if name in {"my02_0015", "my02_0160", "my02_0170", "my02_0180", "my02_0190", "my02_0210", "my02_0215", "my02_0217", "my02_0240", "my02_0250", "my02_0260", "my02_0270", "my02_0280", "my02_0300", "my02_0350", "myb02_0330", "myb02_0335", "myb02_0340", "my02_0400", "my02_0410", "my02_0430", "my02_0450", "my02_0460", "my02_0463", "my02_0465", "my02_0470", "my02_0480", "my03_0010", "my03_0127", "my02_0340", "myb02_0320", "my02_0150", "my02_0120", "my02_0030", "my02_0035", "my02_0040", "my02_0075", "my02_0080", "my02_0083", "my02_0085", "my02_0090", "my02_0110", "myb02_0010", "myb02_0120", "myb02_0030", "myb02_0140", "myb02_0150"}:
            block = data[current.end():following.start()]
            intro = re.match(rb"\x73\x07my0003\x00\x74\x0amy0003_00\x00\x1e\x50(.{4})"
                             rb"\x72\x07my0005\x00\x50(.{4})\x73\x07my0005\x00"
                             rb"\x72\x07my0006\x00\x74\x0amy0005_00\x00\x50(.{4})",
                             block, re.DOTALL)
            if name == "my02_0030":
                intro = re.match(rb"\x7b\x0c\x13sh01_0010\x00\x06\x73\x07my0006\x00"
                                 rb"\x72\x08my0006b\x00\x74\x0amy0006_00\x00\x50(.{4})",
                                 block, re.DOTALL)
            if name in {"my02_0160", "my02_0120", "my02_0035", "my02_0075", "my02_0080", "my02_0083", "my02_0085", "my02_0090"}:
                intro = re.match(rb"\x7b\x0c\x13sh01_0010\x00\x06", block)
            if name in {"my02_0110", "myb02_0010", "myb02_0120", "myb02_0030"}:
                intro = re.match(rb"(?:\x7b\x0c\x13sh01_0010\x00\x06)?(?:\x73\x08myb0001\x00\x74\x0bmyb0001_10\x00)?\x6a\x07(?:\x0c_my18|\x0d_myb[016])\x00\x02[^\x03]+\x03\x04\x16", block)
                if name == "myb02_0120":
                    jump = b"\x6a\x0c\x0dmyb02_0126\x00"
                    if not block.endswith(jump):
                        raise ValueError("Unexpected culprit response destination")
                    block = block[:-len(jump)]
                if name == "myb02_0010":
                    choice = b"\x6c\x1d\x01\x02\x00\x00\x0dmyb02_0120\x00\x00\x0dmyb02_0030\x00"
                    if not block.endswith(choice):
                        raise ValueError("Unexpected follow-up choice destinations")
                    block = block[:-len(choice)]
            if name in {"myb02_0140", "myb02_0150"}:
                lines, pos = answer_header(block)
                suffix = b"\x6a\x0b\x0cmy02_0120\x00" if name == "myb02_0140" else b"\x5c\x00\x00\x00\x3c\x15"
                if len(lines) != 2 or block[pos] != 0x16 or not block.endswith(suffix):
                    raise ValueError("Unexpected culprit reply layout")
                block = block[pos+1:-len(suffix)]
            if name not in {"my02_0180", "my02_0190", "my02_0210", "my02_0215", "my02_0217", "my02_0240", "my02_0250", "my02_0260", "my02_0270", "my02_0280", "my02_0300", "my02_0350", "myb02_0330", "myb02_0335", "myb02_0340", "my02_0400", "my02_0410", "my02_0430", "my02_0450", "my02_0460", "my02_0463", "my02_0465", "my02_0470", "my02_0480", "my03_0010", "my03_0127", "my02_0340", "myb02_0320", "my02_0170", "my02_0040", "my02_0150", "myb02_0140", "myb02_0150"} and intro is None:
                raise ValueError("Unexpected summer scene introduction")
            if name == "myb02_0340":
                jump = b"\x6a\x0b\x0cmy02_0400\x00"
                if not block.endswith(jump):
                    raise ValueError("Unexpected prison island history destination")
                block = block[:-len(jump)]
            if name == "my03_0127":
                # The default route takes the != 1 arm of variable 0x011F.
                _, pos = answer_header(block)
                guard = b"\x16\x70\x0c\x01\x1f\x0c\x00\x01\x0c_my31\x00"
                alternate = b"\x70\x0c\x01\x1f\x07\x00\x01\x0c_my32\x00"
                if not block[pos:].startswith(guard) or not block.endswith(b"\x0b"):
                    raise ValueError("Unexpected notebook route")
                normal, other = block[pos+len(guard):].split(alternate)
                block = normal + block[-1:]
                if not normal.endswith(other[:-1]):
                    raise ValueError("Notebook routes no longer share their closing dialogue")
            ruby = []
            if name in {"my02_0150", "my02_0170", "my02_0215", "my02_0217", "my02_0280", "myb02_0340", "my02_0400", "my02_0410", "my02_0450", "my02_0463", "my02_0465", "my03_0127"}:
                def read_ruby(match):
                    readings = [text.decode("cp932") for text in re.findall(rb"\x02([^\x03]+)\x03", match[1])]
                    base = match[2].decode("cp932")
                    ruby.append({"word": base[:len(readings)], "readings": readings})
                    return b"\x02" + match[2] + b"\x03"
                block = re.sub(rb"\x06((?:\x02[^\x03]+\x03)+)\x07\x02([^\x03]+)\x03", read_ruby, block)
            if name in {"my02_0340", "myb02_0320"}:
                _, pos = answer_header(block)
                if block[pos] != 0x16:
                    raise ValueError("Missing captain response separator")
                block = block[pos+1:]
            events = []
            pos = intro.end() if intro else 0
            while pos < len(block):
                opcode = block[pos]
                pos += 1
                if opcode == 0x02:
                    end = block.index(b"\x03", pos)
                    events.append({"text": block[pos:end].decode("cp932")})
                    pos = end + 1
                elif opcode in (0x0d, 0x0e):
                    events.append({"name": opcode - 0x0d})
                elif opcode in (0x72, 0x73, 0x74):
                    size = block[pos]
                    field = block[pos + 1:pos + 1 + size]
                    if len(field) != size or not field.endswith(b"\0"):
                        raise ValueError("Invalid caption name")
                    key = {0x72: "prepareScene", 0x73: "scene", 0x74: "caption"}[opcode]
                    events.append({key: field[:-1].decode("ascii")})
                    pos += size + 1
                elif opcode == 0x5c and name == "my03_0010":
                    if block[pos:pos+4] != bytes(4):
                        raise ValueError("Unexpected song introduction operand")
                    events.append({"command": opcode, "operand": 0})
                    pos += 4
                elif opcode == 0x5c and name == "my02_0465":
                    if block[pos:] != b"\x00\x00\x00\x1e\x15":
                        raise ValueError("Unexpected end of the family history")
                    events.append({"trailingCommands": [opcode, 30, 0x15]})
                    pos = len(block)
                elif opcode == 0x75:
                    if block[pos:pos+1] != b"\x03" or pos + 4 > len(block):
                        raise ValueError("Unexpected 0x75 operand")
                    events.append({"rgb": list(block[pos+1:pos+4])})
                    pos += 4
                elif opcode == 0x6f:
                    size = block[pos]
                    operand = block[pos+1:pos+1+size]
                    if len(operand) != size:
                        raise ValueError("Truncated 0x6f scene operand")
                    if size < 5 or size != 5 + 4 * operand[4]:
                        raise ValueError("Invalid CommandWipe parameter count")
                    events.append({"wipe": int.from_bytes(operand[:4], "big"),
                                   "args": [n for (n,) in struct.iter_unpack(">I", operand[5:])]})
                    pos += size + 1
                elif opcode in (0x40, 0x46, 0x4c, 0x50, 0x55, 0x65):
                    key, size = {0x40: ("speed", 1), 0x46: ("spacing", 1), 0x4c: ("fontArgs", 2),
                                 0x50: ("wait", 4), 0x55: ("lineSpacing", 4), 0x65: ("mojiXY", 4)}[opcode]
                    if pos + size > len(block):
                        raise ValueError("Truncated summer dialogue operand")
                    operand = block[pos:pos+size]
                    events.append({key: list(operand) if opcode == 0x4c else int.from_bytes(operand, "big")})
                    pos += size
                elif opcode in (0x04, 0x09, 0x0b, 0x1e):
                    events.append({"command": opcode})
                else:
                    raise ValueError(f"Unexpected summer dialogue opcode {opcode:#x}")
            story[name] = {"introWaits": [int.from_bytes(v, "big") for v in intro.groups()] if intro else [], "events": events}
            if ruby:
                story[name]["ruby"] = ruby
        if name in {"my03_0040", "my03_0050", "my03_0060", "my03_0070", "my03_0080"}:
            story[name] = song_page(data[current.end():following.start()])
        if name == "my02_0330":
            prompt = re.match(rb"\x02([^\x03]+)\x03\x04\x09\x70", data[current.end():following.start()])
            if not prompt:
                raise ValueError("Missing captain question prompt")
            story[name] = {"text": prompt[1].decode("cp932")}
        if name == "my02_0100":
            block = data[current.end():following.start()]
            reaction = re.fullmatch(
                rb"\x40(.)\x02([^\x00-\x1f]+)\x03\x04\x09"
                rb"\x40(.)\x02([^\x00-\x1f]+)\x03\x04\x09"
                rb"\x6c\x1c\x01\x02\x00\x00\x0cmy02_0110\x00\x00\x0dmyb02_0010\x00",
                block, re.DOTALL)
            if reaction is None:
                raise ValueError("Unexpected dialogue before the summer choice")
            events = []
            for speed, text in ((reaction[1], reaction[2]), (reaction[3], reaction[4])):
                events.extend([{"speed": speed[0]}, {"text": text.decode("cp932")},
                               {"command": 4}, {"command": 9}])
            story[name] = {"events": events, "choice": "summerChoice"}
        if name == "my02_0010":
            block = data[current.end():following.start()]
            card = re.fullmatch(
                rb"\x73\x08my0002i\x00\x74\x0bmy0002i_00\x00\x50(.{4})"
                rb"\x4c(.{2})\x40(.)\x5a(.{4})\x66(.{4})\x02([^\x00-\x1f]+)\x03\x04"
                rb"\x66(.{4})\x02([^\x00-\x1f]+)\x03\x32\x74\x0bmy0002i_10\x00"
                rb"\x15\x50(.{4})\x5c(.{4})\x15\x0c", block, re.DOTALL)
            if card is None:
                raise ValueError("Unexpected date card in my02_0010")
            lines = []
            for position, text in ((card[5], card[6]), (card[7], card[8])):
                x, y = struct.unpack(">hh", position)
                lines.append({"x": x, "y": y, "text": text.decode("cp932")})
            story[name] = {"lines": lines, "waitBefore": int.from_bytes(card[1], "big"),
                           "waitAfter": int.from_bytes(card[9], "big"),
                           "fontArgs": list(card[2]), "speed": card[3][0]}
        if name == "mo02_0012":
            block = data[current.end():following.start()]
            runs = []
            pos = 0
            while block[pos:pos + 1] == b"\x66":
                run = re.match(rb"\x66(.{4})\x02([^\x00-\x1f]+)\x03", block[pos:], re.DOTALL)
                if run is None:
                    raise ValueError("Invalid positioned text in mo02_0012")
                x, y = struct.unpack(">HH", run[1])
                runs.append({"x": x, "y": y, "text": run[2].decode("cp932")})
                pos += run.end()
            if not runs or block[pos:] != bytes.fromhex("5c0000003c150c"):
                raise ValueError("Unexpected positioned text sequence")
            story[name] = runs
        if name in {"my01_0010", "my01_0012", "my01_0022", "my01_0040", "my01_0055", "my01_0070", "my01_0076", "my01_0077", "my01_0078", "my01_0079", "my01_0080", "my01_0081", "my01_0082", "my01_0085", "mo01_0011", "mo01_0012", "mo02_0010", "mo02_0015"}:
            block = data[current.end():following.start()]
            story[name] = [s.decode("cp932") for s in re.findall(rb"\x02([^\x00-\x1f]+)\x03", block)]
        if name == "my01_0085":
            greeting = re.search(
                rb"my0002g_40\x00\x50(.{4})\x02([^\x00-\x1f]+)\x03"
                rb"\x50(.{4})\x02([^\x00-\x1f]+)\x03\x50(.{4})\x0e"
                rb"\x46\x03\x02([^\x00-\x1f]+)\x03\x46\x0a\x09"
                rb"\x02([^\x00-\x1f]+)\x03\x0b\x73\x08my0002h\x00", block, re.DOTALL)
            if greeting is None:
                raise ValueError("Unexpected phone greeting commands in my01_0085")
            story["phoneGreeting"] = [
                {"wait": int.from_bytes(greeting[1], "big"), "text": greeting[2].decode("cp932")},
                {"wait": int.from_bytes(greeting[3], "big"), "text": greeting[4].decode("cp932")},
                {"wait": int.from_bytes(greeting[5], "big"), "name": 1},
                {"text": greeting[6].decode("cp932"), "pause": True},
                {"text": greeting[7].decode("cp932")},
            ]
        if name in {"my01_0047", "my01_0062"}:
            expected = 0x12 if name.endswith("0047") else 0x13
            if data[following.start() - 1] != expected:
                raise ValueError(f"Unexpected name command in {name}")
    if len(story) != 75:
        raise ValueError("Opening labels could not be resolved")
    return story


def select_destinations(block):
    """Decode a two-target CommandSelect without assuming concrete label names."""
    command = re.search(rb"\x6c(.)(\x01\x02\x00\x00[\x0c\x0d])", block, re.DOTALL)
    if command is None:
        raise ValueError("Missing two-destination CommandSelect")
    size = command[1][0]
    payload = block[command.start() + 2:command.start() + 2 + size]
    if len(payload) != size or payload[:4] != b"\x01\x02\x00\x00":
        raise ValueError("Invalid CommandSelect header or size")
    pos = 4
    targets = []
    for index in range(2):
        if pos >= len(payload) or payload[pos] not in (0x0C, 0x0D):
            raise ValueError("Invalid CommandSelect target type")
        pos += 1
        end = payload.find(b"\0", pos)
        if end < 0:
            raise ValueError("Unterminated CommandSelect target")
        targets.append(payload[pos:end])
        pos = end + 1
        if index == 0:
            if pos >= len(payload) or payload[pos] != 0:
                raise ValueError("Missing CommandSelect target separator")
            pos += 1
    if pos != len(payload):
        raise ValueError("Trailing CommandSelect payload")
    return targets


def scenario_choice(data, source):
    """Resolve CommandSelect destinations in script order and read their first lines."""
    label = rb"\x85[\x0b\x0c][\x0c\x0d](myb?0[12]_[0-9]{4})\x00\x22"
    labels = list(re.finditer(label, data))
    blocks = {a[1]: data[a.end():b.start()] for a, b in zip(labels, labels[1:])}
    choices = []
    for target in select_destinations(blocks[source]):
        if target not in blocks:
            raise ValueError(f"Unknown CommandSelect target {target!r} in {source!r}")
        lines, _ = answer_header(blocks[target])
        choices.append({"target": target.decode("ascii"), "text": "\n".join(lines)})
    return choices


def first_choice_program(data):
    """Emit original SN4 commands needed from the first name input to choice branches."""
    label_pattern = re.compile(rb"\x85[\x0b\x0c][\x0c\x0d](myb?0[12]_[0-9]{4})\x00\x22")
    labels = list(label_pattern.finditer(data))
    blocks = {a[1].decode("ascii"): (a.end(), data[a.end():b.start()])
              for a, b in zip(labels, labels[1:])}

    def decode(name, stop_at_choice=False, first_text_only=False):
        base, block = blocks[name]
        pos = block.find(b"\x02") if first_text_only else 0
        if pos < 0:
            raise ValueError(f"Missing text in {name}")
        ops = []
        while pos < len(block):
            offset = base + pos
            op = block[pos]
            pos += 1
            if op == 0x02:
                end = block.index(b"\x03", pos)
                ops.append({"op": op, "offset": offset,
                            "args": [block[pos:end].decode("cp932")]})
                pos = end + 1
            elif op in (0x04, 0x09, 0x0B, 0x0D, 0x0E, 0x12, 0x13, 0x1E):
                ops.append({"op": op, "offset": offset, "args": []})
                if first_text_only and op in (0x09, 0x0B, 0x16):
                    break
            elif op in (0x40, 0x46):
                ops.append({"op": op, "offset": offset, "args": [block[pos]]})
                pos += 1
            elif op in (0x50, 0x55, 0x65):
                ops.append({"op": op, "offset": offset,
                            "args": [int.from_bytes(block[pos:pos + 4], "big")]})
                pos += 4
            elif op in (0x72, 0x73, 0x74):
                size = block[pos]
                raw = block[pos + 1:pos + 1 + size]
                if len(raw) != size or not raw.endswith(b"\0"):
                    raise ValueError(f"Invalid resource command in {name} at {offset:#x}")
                ops.append({"op": op, "offset": offset, "args": [raw[:-1].decode("ascii")]})
                pos += size + 1
            elif op == 0x6C:
                size = block[pos]
                payload = block[pos + 1:pos + 1 + size]
                targets = select_destinations(bytes((op, size)) + payload)
                ops.append({"op": op, "offset": offset,
                            "args": [[target.decode("ascii") for target in targets]]})
                pos += size + 1
                if stop_at_choice:
                    break
            elif op == 0x70:
                size = block[pos]
                payload = block[pos + 1:pos + 1 + size]
                if len(payload) != size:
                    raise ValueError(f"Truncated CommandIf in {name} at {offset:#x}")
                ops.append({"op": op, "offset": offset, "args": [payload.hex()]})
                pos += size + 1
            elif op == 0x16:
                # Command separators are part of the bytecode but have no visible effect.
                ops.append({"op": op, "offset": offset, "args": []})
                if first_text_only:
                    break
            else:
                raise ValueError(f"Unsupported first-choice extraction opcode {op:#x} in {name} at {offset:#x}")
        return {"label": name, "offset": base, "ops": ops}

    names = ["my01_0047", "my01_0055", "my01_0062", "my01_0070"]
    decoded = [decode(name, stop_at_choice=name == "my01_0070") for name in names]
    for current, following in zip(decoded, decoded[1:]):
        current["next"] = following["label"]
    decoded.extend(decode(name, first_text_only=True) for name in ("my01_0075", "my01_0073"))
    return {"entry": names[0], "labels": decoded}


def culprit_choice_wait(data):
    marker = b"\x85\x0c\x0dmyb02_0126\x00\x22"
    pos = data.index(marker) + len(marker)
    if data[pos] != 0x50 or data[pos+5] != 0x6c:
        raise ValueError("Expected a wait immediately before the culprit selection")
    return struct.unpack_from(">I", data, pos + 1)[0]


def invitation_origin(data):
    origins = set()
    for label in (b"my01_0078", b"my01_0079", b"my01_0080"):
        marker = b"\x85\x0b\x0c" + label + b"\0\x22"
        offset = data.index(marker) + len(marker)
        top_cmd, top, left_cmd, left = struct.unpack_from(">BIBI", data, offset)
        if (top_cmd, left_cmd) != (0x61, 0x5D):
            raise ValueError("Unexpected invitation margin commands")
        origins.add((left, top))
    if len(origins) != 1:
        raise ValueError("Invitation pages use different margins")
    left, top = origins.pop()
    return {"x": left, "y": top}


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


def button_sounds(disc, out, encode):
    sequence = disc.read(disc.files["SOUND/SEB/se000.seb"])
    sectors = disc.read(disc.files["SOUND/WAVE_WD/wave_wd.sec"])
    wave = disc.files["SOUND/WAVE_WD/wave_wd.dat"]
    first, following = struct.unpack_from("<II", sectors, 1000 * 4)
    bank = disc.read(Extent(wave.lba + first, (following - first) * SECTOR))
    if bank[:4] != b"WD\xe8\x03" or sequence[:8] != b"SeBlock ":
        raise ValueError("Unexpected system sound bank")
    samples, regions = struct.unpack_from("<II", bank, 8)
    table = struct.unpack_from(f"<{samples}I", bank, 32)
    data_start = table[0] + regions * 32
    sound_table = 16 + 4 * struct.unpack_from("<H", sequence, 10)[0]
    for effect, name in ((2, "confirm"), (3, "cancel"), (4, "move")):
        offset = sound_table + struct.unpack_from("<I", sequence, 16 + 4 * effect)[0]
        voices = sequence[offset]
        if voices != (2 if effect == 3 else 1) or struct.unpack_from("<I", sequence, offset + 1)[0] != 1000:
            raise ValueError("Unexpected system sound sequence")
        track = offset + 5 + 2 * voices
        if sequence[track:track + 2] != b"\0\x22" or sequence[track + 3:track + 5] != b"\0\x20":
            raise ValueError("Unexpected system sound instrument command")
        instrument = struct.unpack_from("<H", sequence, track + 5)[0]
        start = struct.unpack_from("<I", bank, table[instrument] + 4)[0]
        end = struct.unpack_from("<I", bank, table[instrument + 1] + 4)[0]
        raw = bank[data_start + start:data_start + end]
        if len(raw) != end - start or len(raw) % 16:
            raise ValueError("Invalid SPU sample extent")
        # VAG is a container for the bank's mono PS-ADPCM blocks.
        header = struct.pack(">4sIIII", b"VAGp", 0x20, 0, len(raw), 48000).ljust(48, b"\0")
        source = out / "effect.vag"
        source.write_bytes(header + raw)
        args = ["-i", str(source)]
        if voices == 2:
            second = track + struct.unpack_from("<H", sequence, offset + 5)[0]
            if (sequence[second:second + 2] != b"\0\x18" or sequence[second + 3] != 0x22
                    or sequence[second + 6] != 0x20 or sequence[second + 7:second + 9] != sequence[track + 5:track + 7]
                    or sequence[second + 9] != 0x12 or sequence[track + 7] != 0x12):
                raise ValueError("Unexpected second cancel voice")
            pitch = sequence[second + 10] - sequence[track + 8]
            rate = round(48000 * 2 ** (pitch / 12))
            gain = sequence[second + 4] / sequence[track + 2]
            args += ["-filter_complex", f"asplit[a][b];[b]asetrate={rate},aresample=48000[b2];"
                     f"[a][b2]amix=weights='1 {gain}'"]
        encode([*args, "-c:a", "pcm_s16le"], out / f"{name}.wav")


def opening_assets(disc, out, encode):
    def asset(name):
        return disc.read(disc.files[name])

    for name in ("my0000", "my0002", "my0007", "my0011", "my0016b", "my0021", "my0645"):
        still_png(asset(f"GRA/MY/{name}.ipu"), out, out / f"{name}.png", encode)
    still_png(asset("GRA/MO/mo0000.ipu"), out, out / "mo0000.png", encode)
    still_png(asset("SYS_MENU/g_start.ipu"), out, out / "g_start.png", encode)
    title_music = elf_string(disc.elf, 0x219c08)
    for name in (title_music, "k1a001.ogg", "k2h017.ogg", "k2h003.ogg", "k1a004.ogg", "k2h002.ogg"):
        (out / name).write_bytes(asset("SOUND/VORBIS/" + name))
    button_sounds(disc, out, encode)
    for name in ("name_e01", "mark"):
        texture(asset(f"EFFECT/{name}.ctf")).save(out / f"{name}.png")
    for name in ("sys_fc01", "sys_cd01", "sys_cd02", "sys_jo01", "sys_jo02", "sys_jo03", "sys_save", "sys_wa01"):
        texture(asset(f"SYS_MENU/{name}.ctf")).save(out / f"{name}.png")
    scenario = asset("SCENARIO/scenario.sn4")
    scene_pack = asset("SCENARIO/scene_pk.spk")
    music_pattern = re.compile(rb"\x14\x00\x27\x00([^\0]+\.ogg)\x00\x2f\x00(.{2})"
                               rb"\x2e\x00(.{2})\x2b\x00(.{2})\x07\x00", re.S)
    scene_pack_opening = {}
    for name, offset in {"my0002b_00": 0x72217, "my0002c_00": 0x7227B,
                         "my0002d_00": 0x722DF,
                         "my0002e_00": 0x72343}.items():
        command = scene_pack[offset:offset + 100]
        music = music_pattern.search(command)
        image = re.search(rb"\x27\x00([^\0]+\.ipu)\x00\x28\x00\x00\x00\x01\x00", command)
        if not music or not image:
            raise ValueError(f"Unexpected ScenePack opening command {name}")
        scene_pack_opening[name] = {
            "image": image[1].decode("ascii").removesuffix(".ipu"),
            "music": {"operation": 0x14, "command": 0x07,
                      "file": music[1].decode("ascii"),
                      "volume": int.from_bytes(music[2], "little"),
                      "wait": int.from_bytes(music[3], "little"),
                      "fadeFrames": int.from_bytes(music[4], "little")},
        }
    config = {
        "font": font_atlas(asset("SCENARIO/sn4.fnt"), out),
        "rows": asset("SCENARIO/namkan.txt").decode("cp932").strip("\n").split("\n\n"),
        "defaults": [elf_string(disc.elf, va) for va in (0x224628, 0x224630)],
        "prompts": [elf_string(disc.elf, va) for va in (0x1ff090, 0x1ff0a0, 0x1ff0d8)],
        "story": scenario_strings(scenario),
        "prologueChoice": scenario_choice(scenario, b"my01_0070"),
        "summerChoice": scenario_choice(scenario, b"my02_0100"),
        "followupChoice": scenario_choice(scenario, b"myb02_0010"),
        "captainChoice": scenario_choice(scenario, b"my02_0330"),
        "culpritChoiceWait": culprit_choice_wait(scenario),
        "culpritChoice": scenario_choice(scenario, b"myb02_0126"),
        "invitationOrigin": invitation_origin(scenario),
        "titleMusic": title_music,
        "scenePack": scene_pack_opening,
    }
    (out / "sn4.json").write_text(
        json.dumps(first_choice_program(scenario), ensure_ascii=False), encoding="utf-8")
    (out / "opening.json").write_text(json.dumps(config, ensure_ascii=False), encoding="utf-8")
