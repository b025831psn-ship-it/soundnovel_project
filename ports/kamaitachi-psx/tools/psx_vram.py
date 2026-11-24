#!/usr/bin/env python3
"""Convert packed PS1 VRAM rectangles to PNG without requiring a disc image."""

from __future__ import annotations

import argparse
import struct
import zlib
from pathlib import Path


def bgr555_rgba(value: int) -> tuple[int, int, int, int]:
    """Expand a PS1 BGR555/STP color to an extraction-friendly RGBA pixel."""
    value &= 0xFFFF
    if value == 0:
        return 0, 0, 0, 0
    red = (value & 0x1F) * 255 // 31
    green = ((value >> 5) & 0x1F) * 255 // 31
    blue = ((value >> 10) & 0x1F) * 255 // 31
    return red, green, blue, 128 if value & 0x8000 else 255


def _palette(clut: bytes, size: int) -> list[tuple[int, int, int, int]]:
    if len(clut) < size * 2:
        raise ValueError(f"CLUT needs at least {size * 2} bytes")
    return [bgr555_rgba(value) for (value,) in struct.iter_unpack("<H", clut[: size * 2])]


def decode_texture(packed: bytes, width: int, height: int, bpp: int, clut: bytes | None = None) -> bytes:
    """Decode a tightly packed 4/8/16bpp VRAM rectangle to row-major RGBA."""
    if width <= 0 or height <= 0:
        raise ValueError("texture dimensions must be positive")
    if bpp not in (4, 8, 16):
        raise ValueError("bpp must be 4, 8, or 16")
    pixels = width * height
    needed = pixels * bpp // 8
    if pixels * bpp % 8 or len(packed) < needed:
        raise ValueError(f"packed texture needs at least {needed} bytes")

    if bpp == 16:
        colors = (bgr555_rgba(value) for (value,) in struct.iter_unpack("<H", packed[:needed]))
    else:
        if clut is None:
            raise ValueError("indexed textures require a CLUT")
        palette = _palette(clut, 16 if bpp == 4 else 256)
        if bpp == 8:
            colors = (palette[index] for index in packed[:needed])
        else:
            indices = (index for byte in packed[:needed] for index in (byte & 0x0F, byte >> 4))
            colors = (palette[index] for index in indices)
    return bytes(channel for color in colors for channel in color)


def encode_png(width: int, height: int, rgba: bytes) -> bytes:
    if len(rgba) != width * height * 4:
        raise ValueError("RGBA payload does not match dimensions")

    def chunk(kind: bytes, payload: bytes) -> bytes:
        body = kind + payload
        return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    scanlines = b"".join(b"\0" + rgba[row * width * 4 : (row + 1) * width * 4] for row in range(height))
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(scanlines, 9))
            + chunk(b"IEND", b""))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("texture", type=Path, help="tightly packed VRAM rectangle")
    parser.add_argument("output", type=Path, help="destination PNG")
    parser.add_argument("--width", type=int, required=True, help="pixel width")
    parser.add_argument("--height", type=int, required=True, help="pixel height")
    parser.add_argument("--bpp", type=int, choices=(4, 8, 16), required=True)
    parser.add_argument("--clut", type=Path, help="raw little-endian BGR555 CLUT for 4/8bpp")
    args = parser.parse_args()
    rgba = decode_texture(
        args.texture.read_bytes(), args.width, args.height, args.bpp,
        args.clut.read_bytes() if args.clut else None,
    )
    args.output.write_bytes(encode_png(args.width, args.height, rgba))


if __name__ == "__main__":
    main()
