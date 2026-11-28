"""Read local resources from the verified Japanese PS2 disc."""
from extract import DISC_SHA, extent
import hashlib
import struct


def entries(disc, sector, size, prefix=""):
    directory = extent(disc, sector, size)
    cursor = 0
    while cursor < size:
        length = directory[cursor]
        if not length:
            cursor = (cursor // 2048 + 1) * 2048
            continue
        record = directory[cursor:cursor + length]
        cursor += length
        raw = record[33:33 + record[32]]
        if raw in (b"\0", b"\1"):
            continue
        name = prefix + raw.decode("ascii").split(";")[0]
        address = struct.unpack_from("<I", record, 2)[0]
        length = struct.unpack_from("<I", record, 10)[0]
        if record[25] & 2:
            yield from entries(disc, address, length, name + "/")
        else:
            yield name, address, length


def inventory(disc):
    if hashlib.file_digest(disc, "sha256").hexdigest() != DISC_SHA:
        raise ValueError("Unsupported disc")
    descriptor = extent(disc, 16, 2048)
    if descriptor[1:6] != b"CD001":
        raise ValueError("Missing ISO9660 descriptor")
    root = descriptor[156:]
    return list(entries(disc, struct.unpack_from("<I", root, 2)[0],
                        struct.unpack_from("<I", root, 10)[0]))
