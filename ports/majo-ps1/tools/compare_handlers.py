"""Compare VM cursor, flags and service arguments at the MIPS handler boundary."""

import argparse
import json
import struct
import subprocess
from pathlib import Path

from unicorn import Uc, UC_ARCH_MIPS, UC_MODE_MIPS32, UC_HOOK_CODE
from unicorn import mips_const as reg
from extract_script import EXPECTED_EXE_SHA1, digest


BASE = 0x80100000
CURSOR = 0x80110000
STOP = 0x80120000
GP = 0x80130000


def samples():
    yield [1, 0x82, 0xa0, 64, 114, 0, 0, 64, 0]
    yield [1, 64, 110, 49, 64, 114, 0, 64, 0]
    yield [1, *b"@g", 0x82, 0xa0, *b"@q@g", 0x82, 0xa2, *b"@q", 0, 64, 0]
    yield [6]
    yield [7, *b"TEST", 0, 0, 0, 145, 0, 131, 3, 129]
    yield [8, 0, *b"TEST", 0]
    yield [8, 3, *b"TEST", 0, *b"SECOND", 0]
    for track in (0, 1, 5, 19, 20):
        yield [9, 0, track]
    for sound in (94, 95):
        yield [10, 0, sound, 4, 5]
    yield [11]
    for mode in (0, 1, 2, 3, 0x22, 0x42, 0x82, 0xc3):
        yield [12, mode, 7]
    for operation in range(5):
        for indirect in (0, 1):
            yield [13, 0, 1, operation, indirect, 0, 2]
    yield [16, 0, 13]
    for mask in range(4):
        yield [17, mask, 17, 0, 44]
    yield [18, 3, 64, 0x14, 0, 64, 2]
    yield [19, 0, 0]
    yield [19, 0, 2]
    yield [20, *b"TEST", 0]


def reference(exe, command):
    m = Uc(UC_ARCH_MIPS, UC_MODE_MIPS32)
    m.mem_map(0, 0x200000)
    m.mem_write(0x10000, exe[0x800:])
    def write(address, value):
        m.mem_write(address & 0x1fffff, struct.pack("<I", value))
    def load(address, length):
        return bytes(m.mem_read(address & 0x1fffff, length))
    def string(address):
        return load(address, 128).split(b"\0", 1)[0]
    write(CURSOR, BASE + 1)
    write(0x697b0, BASE)
    write(GP + 0x80c, 3)
    write(GP + 0x810, 2)
    write(0x6c938 + 4, 89)
    m.mem_write((GP + 0x745) & 0x1fffff, bytes([1]))
    m.mem_write(0x69804, bytes([1, 250, 3, 0]))
    m.mem_write(0x69782 + 9, bytes([0x82, 0xa4, 0]))
    m.mem_write(BASE & 0x1fffff, bytes([64, *command]))
    m.mem_write(0x140004, bytes([65]))
    for r, value in ((reg.UC_MIPS_REG_A0, CURSOR), (reg.UC_MIPS_REG_SP, 0x801f0000),
                     (reg.UC_MIPS_REG_GP, GP), (reg.UC_MIPS_REG_RA, STOP)):
        m.reg_write(r, value)

    # Leave operand readers, string formatting, RNG and VM state routines intact.
    # Boundaries below are resource, pad, video, audio and scheduler calls.
    services = {
        0x16efc, 0x16fc8, 0x1be28, 0x1d8a8, 0x21820, 0x1fea8, 0x19f20, 0x2ccd8,
        0x202b4, 0x1ffd0, 0x21c58, 0x2e9c8, 0x2e8b4, 0x2e3f0, 0x1f354, 0x1f48c,
        0x19e58, 0x165d0, 0x17050, 0x19d10, 0x1bfa8, 0x20f04, 0x208f0, 0x2094c,
        0x20a1c, 0x1d604, 0x2dc54, 0x1e240, 0x1c1e0, 0x18d78, 0x2b09c, 0x15b84, 0x15c94, 0x20a48,
    }
    event = None
    actions = []
    allocations = 0
    def intercept(cpu, address, size, data):
        nonlocal event, allocations
        pc = address & 0x1fffff
        a, b, c, d = [cpu.reg_read(r) for r in
                       (reg.UC_MIPS_REG_A0, reg.UC_MIPS_REG_A1, reg.UC_MIPS_REG_A2, reg.UC_MIPS_REG_A3)]
        result = 0
        if pc == 0x16efc:
            result = 0x80150000 + allocations * 0x800
            allocations += 1
        elif pc == 0x1be28:
            payload = string(a)
            event = dict(type="text", bytes=list(payload), options=payload.count(b"@g"))
        elif pc == 0x21820:
            event = dict(type="closeChoice")
        elif pc == 0x1ffd0:
            _, blend, mode = struct.unpack("<3I", load(cpu.reg_read(reg.UC_MIPS_REG_SP) + 16, 12))
            event = dict(type="picture", name=string(a).decode()[3:-2], layer=b,
                         x=c if c < 2**31 else c-2**32, y=d if d < 2**31 else d-2**32,
                         mode=mode, blend=bool(blend))
        elif pc == 0x21c58:
            event = dict(type="movie", name=string(a).decode(),
                         secondary=string(b).decode() if b else None, alternate=bool(c))
        elif pc == 0x2e9c8:
            result = 5
        elif pc in (0x2e8b4, 0x2e3f0):
            event = dict(type="music", id=None if pc == 0x2e8b4 else int(string(a)[3:], 16))
        elif pc in (0x1f354, 0x1f48c):
            event = dict(type="sound", id=a, bank=int(pc == 0x1f48c), mode=c, value=b)
        elif pc == 0x19d10:
            event = dict(type="resetSoundBank", bank=a)
        elif command[0] == 12:
            if pc == 0x1bfa8:
                actions.append(["textFade", a, b])
            elif pc == 0x1d8a8:
                actions.append(["wait", {0x8001bfb8: "textFade", 0x80020870: "fadeIn",
                                         0x80021024: "fade"}[a]])
            elif pc == 0x20f04:
                actions.append(["fade", a, b, c, d])
            elif pc == 0x208f0:
                actions.append(["fadeOut", a])
            elif pc == 0x2094c:
                actions.append(["fadeIn", a, b])
        elif pc == 0x2dc54:
            event = dict(type="ending", id=a)
        elif pc == 0x2b09c:
            result = 0x80140000
        elif pc == 0x18d78:
            actions.append([a, b, c])
        elif pc in (0x15b84, 0x15c94):
            event = dict(type="effect", value=a if pc == 0x15b84 else 0)
        elif pc == 0x20a48:
            event = dict(type="preparePicture", name=string(b).decode())
        cpu.reg_write(reg.UC_MIPS_REG_V0, result)
        cpu.reg_write(reg.UC_MIPS_REG_PC, cpu.reg_read(reg.UC_MIPS_REG_RA))

    for pc in services:
        m.hook_add(UC_HOOK_CODE, intercept, begin=0x80000000 + pc, end=0x80000000 + pc)
    m.emu_start(0x8001c36c, STOP, count=20000)
    if m.reg_read(reg.UC_MIPS_REG_PC) != STOP:
        raise RuntimeError(f"handler {command[0]:02x} did not return")
    pc, = struct.unpack("<I", load(CURSOR, 4))
    if command[0] in (12, 17):
        event = dict(type="transition" if command[0] == 12 else "vibration", actions=actions)
    return [pc - BASE, list(load(0x69804, 32)), load(0x699ab, 1)[0], event]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("exe", type=Path)
    args = parser.parse_args()
    exe = args.exe.read_bytes()
    if digest(exe, "sha1") != EXPECTED_EXE_SHA1:
        parser.error("expected SLPS-01863")
    inputs = list(samples())
    js = """
        import fs from 'node:fs';
        import {ScenarioVM} from './src/scenario-vm.mjs';
        const output = JSON.parse(fs.readFileSync(0, 'utf8')).map(command => {
          const script = new Uint8Array(128);
          script.set([64, ...command]);
          const flags = new Uint8Array(32);
          flags.set([1, 250, 3, 0]);
          const state = {selected: 1, music: 5, padType: 65, names: [[], [0x82, 0xa4]]};
          const vm = new ScenarioVM(script, flags, null, state);
          vm.choice = {resultFlag: 3, visible: 2, targets: [80, 89]};
          const event = vm.step();
          if (event?.bytes) event.bytes = Array.from(event.bytes);
          return [vm.pc, Array.from(flags), state.controllerType ?? 0, event ?? null];
        });
        console.log(JSON.stringify(output));
    """
    actual = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", js],
                        cwd=Path(__file__).resolve().parents[1], input=json.dumps(inputs), text=True))
    for command, got in zip(inputs, actual, strict=True):
        expected = reference(exe, command)
        if got != expected:
            raise AssertionError((command, got, expected))
    print(f"{len(inputs)} cases, {len(set(c[0] for c in inputs))} additional opcodes matched")


if __name__ == "__main__":
    main()
