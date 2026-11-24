#!/usr/bin/env python3
"""Replay GP0 VRAM transfer packets from a JSONL trace into a raw VRAM image."""

from __future__ import annotations

import argparse
import json
import sys
from array import array
from pathlib import Path


VRAM_WIDTH = 1024
VRAM_HEIGHT = 512


def _xy(word: int) -> tuple[int, int]:
    return word & 0x3FF, (word >> 16) & 0x1FF


def _transfer_size(word: int) -> tuple[int, int]:
    """Decode the masked 10-bit by 9-bit size used by VRAM transfers."""
    width = (((word & 0xFFFF) - 1) & 0x3FF) + 1
    height = ((((word >> 16) & 0xFFFF) - 1) & 0x1FF) + 1
    return width, height


def _fill_size(word: int) -> tuple[int, int]:
    return word & 0x3FF, (word >> 16) & 0x1FF


def _rgb24_to_bgr555(word: int) -> int:
    return ((word >> 3) & 0x1F) | ((word >> 6) & 0x3E0) | ((word >> 9) & 0x7C00)


def packet_words(command: int) -> int | None:
    """Return a fixed packet length, or None for terminated poly-lines/transfers."""
    op = (command >> 24) & 0xFF
    if op in (0x00, 0x01) or 0xE1 <= op <= 0xE6:
        return 1
    if op == 0x02:
        return 3
    if 0x20 <= op <= 0x23:
        return 4
    if 0x24 <= op <= 0x27:
        return 7
    if 0x28 <= op <= 0x2B:
        return 5
    if 0x2C <= op <= 0x2F:
        return 9
    if 0x30 <= op <= 0x33:
        return 6
    if 0x34 <= op <= 0x37:
        return 9
    if 0x38 <= op <= 0x3B:
        return 8
    if 0x3C <= op <= 0x3F:
        return 12
    if 0x40 <= op <= 0x47:
        return 3
    if 0x48 <= op <= 0x4F or 0x58 <= op <= 0x5F:
        return None
    if 0x50 <= op <= 0x57:
        return 4
    if 0x60 <= op <= 0x63:
        return 3
    if 0x64 <= op <= 0x67:
        return 4
    if 0x68 <= op <= 0x6B:
        return 2
    if 0x6C <= op <= 0x6F:
        return 3
    if 0x70 <= op <= 0x73 or 0x78 <= op <= 0x7B:
        return 2
    if 0x74 <= op <= 0x77 or 0x7C <= op <= 0x7F:
        return 3
    if op == 0x80:
        return 4
    if op == 0xA0:
        return None
    if op == 0xC0:
        return 3
    return 1


class VramReplay:
    def __init__(self) -> None:
        self.vram = array("H", [0]) * (VRAM_WIDTH * VRAM_HEIGHT)
        self.packet: list[int] = []
        self.remaining_pixels = 0
        self.upload = None
        self.uploads: list[dict] = []

    def feed(self, word: int) -> None:
        word &= 0xFFFFFFFF
        if self.remaining_pixels:
            self._upload_word(word)
            return
        if self.packet:
            self.packet.append(word)
            self._continue_packet()
            return
        self.packet = [word]
        self._continue_packet()

    def _continue_packet(self) -> None:
        op = self.packet[0] >> 24
        if op == 0xA0 and len(self.packet) == 3:
            x, y = _xy(self.packet[1])
            width, height = _transfer_size(self.packet[2])
            if x + width > VRAM_WIDTH or y + height > VRAM_HEIGHT:
                raise ValueError("CPU-to-VRAM upload exceeds VRAM")
            self.upload = {"x": x, "y": y, "width": width, "height": height, "index": 0}
            self.remaining_pixels = width * height
            self.packet = []
            return
        length = packet_words(self.packet[0])
        if length is None:
            if 0x48 <= op <= 0x4F or 0x58 <= op <= 0x5F:
                if len(self.packet) > 2 and (self.packet[-1] & 0xF000F000) == 0x50005000:
                    self.packet = []
            return
        if len(self.packet) < length:
            return
        packet, self.packet = self.packet, []
        if op == 0x02:
            self._fill(packet)
        elif op == 0x80:
            self._copy(packet)

    def _upload_word(self, word: int) -> None:
        assert self.upload is not None
        for pixel in (word & 0xFFFF, word >> 16):
            if not self.remaining_pixels:
                break
            index = self.upload["index"]
            x = self.upload["x"] + index % self.upload["width"]
            y = self.upload["y"] + index // self.upload["width"]
            self.vram[y * VRAM_WIDTH + x] = pixel
            self.upload["index"] += 1
            self.remaining_pixels -= 1
        if not self.remaining_pixels:
            complete = {key: self.upload[key] for key in ("x", "y", "width", "height")}
            self.uploads.append(complete)
            self.upload = None

    def _fill(self, packet: list[int]) -> None:
        color = _rgb24_to_bgr555(packet[0])
        x, y = _xy(packet[1])
        width, height = _fill_size(packet[2])
        for row in range(y, min(y + height, VRAM_HEIGHT)):
            for column in range(x, min(x + width, VRAM_WIDTH)):
                self.vram[row * VRAM_WIDTH + column] = color

    def _copy(self, packet: list[int]) -> None:
        source_x, source_y = _xy(packet[1])
        target_x, target_y = _xy(packet[2])
        width, height = _transfer_size(packet[3])
        pixels = [
            self.vram[((source_y + row) % VRAM_HEIGHT) * VRAM_WIDTH + (source_x + column) % VRAM_WIDTH]
            for row in range(height) for column in range(width)
        ]
        for row in range(height):
            for column in range(width):
                self.vram[((target_y + row) % VRAM_HEIGHT) * VRAM_WIDTH + (target_x + column) % VRAM_WIDTH] = pixels[row * width + column]

    def bytes(self) -> bytes:
        output = array("H", self.vram)
        if sys.byteorder != "little":
            output.byteswap()
        return output.tobytes()


def trace_words(path: Path):
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        item = json.loads(line)
        value = item.get("value") if isinstance(item, dict) else item
        if isinstance(value, str):
            value = int(value, 0)
        if not isinstance(value, int):
            raise ValueError(f"line {line_number}: GP0 value is not an integer")
        yield value


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("trace", type=Path, help="JSONL of GP0 words or objects with a value field")
    parser.add_argument("output", type=Path, help="1024x512 little-endian BGR555 VRAM dump")
    parser.add_argument("--manifest", type=Path, help="optional JSON inventory of completed uploads")
    args = parser.parse_args()
    replay = VramReplay()
    for word in trace_words(args.trace):
        replay.feed(word)
    if replay.remaining_pixels or replay.packet:
        raise SystemExit("trace ends inside a GP0 packet")
    args.output.write_bytes(replay.bytes())
    if args.manifest:
        args.manifest.write_text(json.dumps({"uploads": replay.uploads}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
