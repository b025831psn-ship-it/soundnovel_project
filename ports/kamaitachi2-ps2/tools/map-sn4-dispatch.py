"""Map SN4 opcodes to the command vtables installed by their EE constructors."""
import struct
from pathlib import Path

from capstone import Cs, CS_ARCH_MIPS, CS_MODE_LITTLE_ENDIAN, CS_MODE_MIPS32
from elftools.elf.elffile import ELFFile

elf_path = Path(__file__).parents[3] / "outputs/claude-ps2-extract/SLPS_251.32"
raw = elf_path.read_bytes()
elf = ELFFile(elf_path.open("rb"))
loads = [(int(p["p_vaddr"]), int(p["p_offset"]), int(p["p_filesz"]))
         for p in elf.iter_segments() if p["p_type"] == "PT_LOAD"]
vtables = {int(s.header.sh_addr): s.name.split("Command", 1)[-1].lstrip("0123456789")
           for s in elf.iter_sections() if "_vt$" in s.name and "Command" in s.name}
md = Cs(CS_ARCH_MIPS, CS_MODE_MIPS32 | CS_MODE_LITTLE_ENDIAN)

def at(va, size):
    for start, offset, length in loads:
        if start <= va and va + size <= start + length:
            return raw[offset + va - start:offset + va - start + size]
    raise ValueError(hex(va))

def calls(va):
    words = struct.unpack("<64I", at(va, 0x100))
    return [((va + i * 4 + 4) & 0xf0000000) | ((word & 0x03ffffff) << 2)
            for i, word in enumerate(words) if word >> 26 == 3]

def installed_vtable(va):
    words = struct.unpack("<32I", at(va, 0x80))
    for hi_at, word in enumerate(words):
        if word >> 26 != 0x0f:  # lui
            continue
        reg, hi = (word >> 16) & 31, word & 0xffff
        for later in words[hi_at + 1:hi_at + 7]:
            op, rs, rt, lo = later >> 26, (later >> 21) & 31, (later >> 16) & 31, later & 0xffff
            if rs == reg and rt == reg and op in (0x09, 0x0d):
                value = (hi << 16) + (lo - 0x10000 if op == 0x09 and lo & 0x8000 else lo)
                if value in vtables or value - 8 in vtables:
                    return vtables.get(value, vtables.get(value - 8))

for opcode in range(2, 0x85):
    handler, = struct.unpack("<I", at(0x21A240 + 4 * (opcode - 2), 4))
    found = None
    direct = calls(handler)
    targets = [handler, *direct]
    for target in direct:
        targets.extend(calls(target))
    for target in targets:
        found = installed_vtable(target)
        if found:
            break
    print(f"0x{opcode:02x}\t0x{handler:08x}\t{found or '?'}")
