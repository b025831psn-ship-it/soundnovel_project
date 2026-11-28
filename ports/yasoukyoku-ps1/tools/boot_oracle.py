"""Run an original disc headlessly with the PCSX-ReARMed libretro core.

Write one JSON line per frame to a new trace file. Input frame
numbers start at one and --press FRAME:BUTTON holds a button for one frame.
"""

import argparse
import ctypes as c
import hashlib
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory


class GameInfo(c.Structure):
    _fields_ = [("path", c.c_char_p), ("data", c.c_void_p),
                ("size", c.c_size_t), ("meta", c.c_char_p)]


class Variable(c.Structure):
    _fields_ = [("key", c.c_char_p), ("value", c.c_char_p)]


BUTTONS = "cross square select start up down left right circle triangle l1 r1 l2 r2 l3 r3".split()
PTR = c.c_void_p
UINT = c.c_uint
SIZE = c.c_size_t


def run(core_path, cue, frames, presses, scratch, trace):
    core = c.CDLL(str(core_path))
    directory = os.fsencode(scratch)
    options = {}
    pixel_format = 0
    frame_hash = None
    dimensions = None
    audio_hash = hashlib.sha256()
    frame = 0
    callbacks = []

    def setter(name, result, *args):
        def register(fn):
            callback = c.CFUNCTYPE(result, *args)(fn)
            callbacks.append(callback)
            func = getattr(core, "retro_set_" + name)
            func.argtypes = [type(callback)]
            func(callback)
            return fn
        return register

    @setter("environment", c.c_bool, UINT, PTR)
    def environment(cmd, data):
        nonlocal pixel_format
        if cmd in (9, 31):  # GET_SYSTEM_DIRECTORY / GET_SAVE_DIRECTORY
            c.cast(data, c.POINTER(c.c_char_p))[0] = directory
        elif cmd == 10:  # SET_PIXEL_FORMAT
            value = c.cast(data, c.POINTER(c.c_int))[0]
            if value not in (0, 1, 2):
                return False
            pixel_format = value
        elif cmd == 16:  # SET_VARIABLES (legacy option interface)
            for item in c.cast(data, c.POINTER(Variable)):
                if not item.key:
                    break
                options[item.key] = item.value.split(b"; ", 1)[-1].split(b"|")[0]
        elif cmd == 15:
            item = c.cast(data, c.POINTER(Variable)).contents
            item.value = options.get(item.key)
            return item.value is not None
        elif cmd == 17:  # GET_VARIABLE_UPDATE
            c.cast(data, c.POINTER(c.c_bool))[0] = False
        elif cmd == 3:  # GET_CAN_DUPE
            c.cast(data, c.POINTER(c.c_bool))[0] = True
        else:
            return False
        return True

    @setter("video_refresh", None, PTR, UINT, UINT, SIZE)
    def video(data, width, height, pitch):
        nonlocal frame_hash, dimensions
        if data:
            row_bytes = width * (4 if pixel_format == 1 else 2)
            raw = c.string_at(data, pitch * height)
            pixels = raw if row_bytes == pitch else b"".join(
                raw[i:i + row_bytes] for i in range(0, len(raw), pitch))
            frame_hash = hashlib.sha256(pixels).hexdigest()
            dimensions = [width, height, pixel_format]

    @setter("audio_sample_batch", SIZE, PTR, SIZE)
    def samples(data, count):
        audio_hash.update(c.string_at(data, count * 4))
        return count

    @setter("audio_sample", None, c.c_int16, c.c_int16)
    def sample(left, right):
        audio_hash.update(bytes((c.c_int16 * 2)(left, right)))

    @setter("input_poll", None)
    def poll():
        pass

    @setter("input_state", c.c_int16, UINT, UINT, UINT, UINT)
    def input_state(port, device, index, button):
        return int(port == 0 and device == 1 and index == 0
                   and button in presses.get(frame, ()))

    core.retro_load_game.argtypes = [c.POINTER(GameInfo)]
    core.retro_load_game.restype = c.c_bool
    core.retro_get_memory_data.argtypes = [UINT]
    core.retro_get_memory_data.restype = PTR
    core.retro_get_memory_size.argtypes = [UINT]
    core.retro_get_memory_size.restype = SIZE
    core.retro_init()
    try:
        game = GameInfo(os.fsencode(cue), None, 0, None)
        if not core.retro_load_game(c.byref(game)):
            raise RuntimeError("core could not load the CUE")
        try:
            core.retro_set_controller_port_device(0, 1)
            for frame in range(1, frames + 1):
                audio_hash = hashlib.sha256()
                core.retro_run()
                row = dict(frame=frame, video=frame_hash, geometry=dimensions,
                           audio=audio_hash.hexdigest())
                if frame == frames:
                    ram = core.retro_get_memory_data(2)
                    size = core.retro_get_memory_size(2)
                    if not ram or size != 2 * 1024 * 1024:
                        raise RuntimeError("core did not expose PS1 main RAM")
                    row["ram"] = hashlib.sha256(c.string_at(ram, size)).hexdigest()
                print(json.dumps(row), file=trace)
        finally:
            core.retro_unload_game()
    finally:
        core.retro_deinit()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("core", type=Path)
    parser.add_argument("cue", type=Path)
    parser.add_argument("trace", type=Path)
    parser.add_argument("--frames", type=int, default=600)
    parser.add_argument("--press", action="append", default=[], metavar="FRAME:BUTTON")
    args = parser.parse_args()
    if args.frames < 1:
        parser.error("--frames must be positive")
    presses = {}
    for value in args.press:
        number, _, button = value.partition(":")
        if not number.isdecimal() or not 1 <= int(number) <= args.frames or button not in BUTTONS:
            parser.error("invalid --press " + value)
        presses.setdefault(int(number), set()).add(BUTTONS.index(button))
    core, cue = args.core.resolve(strict=True), args.cue.resolve(strict=True)
    with args.trace.open("x", encoding="utf-8") as trace, TemporaryDirectory() as scratch:
        previous = Path.cwd()
        os.chdir(scratch)
        try:
            run(core, cue, args.frames, presses, scratch, trace)
        finally:
            os.chdir(previous)


if __name__ == "__main__":
    main()
