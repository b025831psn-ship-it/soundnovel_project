"""Check control-flow operations against the user's SLPS-01863 dispatcher."""

import argparse
import json
import struct
import subprocess
from pathlib import Path

from unicorn import Uc, UC_ARCH_MIPS, UC_MODE_MIPS32
from unicorn.mips_const import UC_MIPS_REG_A0, UC_MIPS_REG_GP, UC_MIPS_REG_PC, UC_MIPS_REG_RA, UC_MIPS_REG_SP

from extract_script import EXPECTED_EXE_SHA1, digest


def cases():
    yield [0x40, 0, 0x40, 0x12, 0x40, 0x10], 0
    yield [0x40, 2, 0, 0, 0, 0x61], 0
    for flag in (0, 1, 2, 3, 128, 255):
        for op in (3, 4):
            yield [0x40, op, 0, 1, 1, 0, 0, 80, 3, 0, 0, 81, 255, 0, 0, 82], flag
            yield [0x40, op, 0, 1, 1, 0, 0, 80, 3, 0, 0, 81, 255, 255, 255, 255], flag
        yield [0x40, 5, 0, 1, 0, 2, 1, 2, 0, 0, 0, 80, 0, 0, 0, 81], flag
        for shift in (0, 2, 7, 8, 33):
            yield [0x40, 14, 3, shift, 0, 1], flag
        yield [0x40, 15, 0xab, 0xcd, 0, 1], flag


def reference(exe, inputs):
    machine = Uc(UC_ARCH_MIPS, UC_MODE_MIPS32)
    machine.mem_map(0, 0x200000)
    machine.mem_write(0x10000, exe[0x800:])
    script = 0x80100000
    cursor = 0x80110000
    stop = 0x80120000
    machine.mem_write(0x697b0, struct.pack("<I", script))
    machine.reg_write(UC_MIPS_REG_GP, 0x80130000)
    results = []
    for command, flag in inputs:
        machine.mem_write(script & 0x1fffff, bytes(command).ljust(128, b"\x00"))
        machine.mem_write(0x69804, bytes([0, flag, 0, 0]))
        machine.mem_write(0x859b8, struct.pack("<I", flag + 1))
        machine.mem_write(0x69762, b"\xff\xff")
        machine.mem_write(cursor & 0x1fffff, struct.pack("<I", script + 1))
        for reg, value in ((UC_MIPS_REG_A0, cursor), (UC_MIPS_REG_SP, 0x801ffff0),
                           (UC_MIPS_REG_RA, stop)):
            machine.reg_write(reg, value)
        machine.emu_start(0x8001c36c, stop, count=10000)
        if machine.reg_read(UC_MIPS_REG_PC) != stop:
            raise RuntimeError("original dispatcher did not return")
        pc, = struct.unpack("<I", machine.mem_read(cursor & 0x1fffff, 4))
        seed, = struct.unpack("<I", machine.mem_read(0x859b8, 4))
        calls, = struct.unpack("<H", machine.mem_read(0x69762, 2))
        choice = None
        if command[1] == 5:
            result, visible, count = struct.unpack("<3I", machine.mem_read(0x13080c, 12))
            targets = struct.unpack(f"<{count}I", machine.mem_read(0x6c938, count * 4))
            choice = dict(resultFlag=result, visible=visible, targets=list(targets))
        results.append([pc - script, list(machine.mem_read(0x69804, 4)), seed, calls, choice])
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("exe", type=Path)
    args = parser.parse_args()
    exe = args.exe.read_bytes()
    if digest(exe, "sha1") != EXPECTED_EXE_SHA1:
        parser.error("expected SLPS-01863")
    inputs = list(cases())
    expected = reference(exe, inputs)
    js = """
        import {readFileSync} from 'node:fs';
        import {ScenarioVM} from './src/scenario-vm.mjs';
        const results = JSON.parse(readFileSync(0, 'utf8')).map(([command, flag]) => {
          const bytes = new Uint8Array(128);
          bytes.set(command);
          const flags = Uint8Array.of(0, flag, 0, 0);
          const rng = {seed: flag + 1, calls: 65535};
          const vm = new ScenarioVM(bytes, flags, rng);
          vm.step();
          return [vm.pc, Array.from(flags), rng.seed, rng.calls, vm.choice];
        });
        console.log(JSON.stringify(results));
    """
    actual = json.loads(subprocess.check_output(
        ["node", "--input-type=module", "-e", js], input=json.dumps(inputs),
        text=True, cwd=Path(__file__).resolve().parents[1]))
    for case, left, right in zip(inputs, expected, actual, strict=True):
        if left != right:
            raise AssertionError((case, left, right))
    print(f"{len(inputs)} dispatcher cases matched PC, flags, RNG and choice state")


if __name__ == "__main__":
    main()
