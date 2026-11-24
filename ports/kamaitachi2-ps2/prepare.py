"""Prepare local opening media from the Japanese SLPS_251.32 game disc."""

import argparse
from array import array
import os
from pathlib import Path
import shutil
import struct
import subprocess
from tempfile import TemporaryDirectory
import wave

from disc import Disc, SECTOR
from opening import opening_assets, still_png


def pss_audio(data):
    """Return the first audio PTS and the stereo SShd stream from PES private stream 1."""
    pos = 0
    audio = bytearray()
    first_pts = None
    while pos < len(data):
        pos = data.find(b"\0\0\1", pos)
        if pos < 0:
            break
        kind = data[pos + 3]
        if kind == 0xBA:  # MPEG-2 pack, including stuffing
            pos += 14 + (data[pos + 13] & 7)
            continue
        if kind == 0xB9:
            break
        if kind < 0xBB:
            raise ValueError("Unexpected elementary start code outside PES packet")
        length = int.from_bytes(data[pos + 4:pos + 6], "big")
        end = pos + 6 + length
        if not length or end > len(data):
            raise ValueError("Invalid PSS packet length")
        if kind == 0xBD:
            start = pos + 9 + data[pos + 8]
            if data[start:start + 4] != b"\xff\xa0\0\0":
                raise ValueError("Unknown PSS private audio stream")
            if first_pts is None:
                pts = data[pos + 9:pos + 14]
                if not data[pos + 7] & 0x80:
                    raise ValueError("Missing first audio PTS")
                first_pts = ((pts[0] & 14) << 29 | pts[1] << 22 | (pts[2] & 254) << 14
                             | pts[3] << 7 | pts[4] >> 1)
            audio.extend(data[start + 4:end])
        pos = end
    if audio[:4] != b"SShd" or audio[32:36] != b"SSbd":
        raise ValueError("Missing Sony PCM header")
    header_size, kind, rate, channels, interleave = struct.unpack_from("<5I", audio, 4)
    size, = struct.unpack_from("<I", audio, 36)
    if (header_size, kind, channels) != (24, 1, 2) or len(audio) != size + 40:
        raise ValueError("Unexpected opening audio format")
    if not interleave or interleave % 2 or size % (2 * interleave):
        raise ValueError("Incomplete stereo interleave")
    samples = memoryview(audio)[40:].cast("H")
    block = interleave // 2
    stereo = array("H", [0]) * len(samples)
    for i in range(0, len(samples), block * 2):
        stereo[i:i + 2 * block:2] = array("H", samples[i:i + block])
        stereo[i + 1:i + 2 * block:2] = array("H", samples[i + block:i + 2 * block])
    return first_pts / 90000, rate, stereo.tobytes()


def encode(arguments, output):
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *arguments, str(output)], check=True)


def video(source, output, audio=None, offset=0):
    args = ["-i", str(source)]
    if audio:
        args.extend(["-itsoffset", f"{offset:.6f}", "-i", str(audio), "-map", "0:v:0", "-map", "1:a:0",
                     "-c:a", "aac", "-b:a", "192k"])
    else:
        args.extend(["-map", "0:v:0", "-an"])
    encode([*args, "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p",
            "-threads", "4", "-movflags", "+faststart", "-aspect", "4:3"], output)


def movie(data, work, out):
    src, wav = work / "source.pss", work / "sound.wav"
    src.write_bytes(data)
    pts, rate, pcm = pss_audio(data)
    with wave.open(str(wav), "wb") as w:
        w.setparams((2, 2, rate, 0, "NONE", "not compressed"))
        w.writeframes(pcm)
    start = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0",
                                     "-show_entries", "stream=start_time", "-of", "csv=p=0", str(src)],
                                    text=True).strip().strip(",")
    video(src, out, wav, pts - float(start))


def title_textures(data, out):
    from PIL import Image
    count, = struct.unpack_from("<I", data)
    for i in range(count):
        header = 16 + i * 64
        name = data[header:header + 32].split(b"\0")[0].decode("ascii")
        if name != "title_00":
            continue
        off, = struct.unpack_from("<I", data, header + 32)
        width, height = struct.unpack_from("<II", data, header + 48)
        image = Image.frombytes("RGBA", (width, height), data[off:off + 4 * width * height])
        image.putalpha(image.getchannel("A").point(lambda a: min(255, a * 2)))
        image.save(out / (name + ".png"))


def summer_movies(disc, stage):
    for name in ("my0006", "my0008", "my0010"):
        source = stage / f"{name}.m2v"
        source.write_bytes(disc.read(disc.files[f"GRA/MY/{name}.m2v"]))
        video(source, source.with_suffix(".mp4"))
    for name in ("my0003", "my0005"):
        package = disc.read(disc.files[f"GRA/MY/{name}.mmv"])
        for index in range(2):
            offset = 64 * index
            path = package[offset:offset + 56].split(b"\0", 1)[0]
            length, sector = struct.unpack_from("<II", package, offset + 56)
            segment = package[sector * SECTOR:sector * SECTOR + length]
            if (not path.endswith(f"/{name}.{index + 1}.m2v".encode()) or
                    len(segment) != length or not segment.startswith(b"\0\0\1\xb3")):
                raise ValueError(f"Invalid {name} movie segment {index + 1}")
            source = stage / f"{name}-{index + 1}.m2v"
            source.write_bytes(segment)
            video(source, source.with_suffix(".mp4"))


def prepare(image, output):
    disc = Disc(image).open_index()
    disc.verify()
    assets = output / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    def asset(name):
        return disc.read(disc.files[name])

    with TemporaryDirectory(dir=output) as temp:
        stage = Path(temp)
        for name in ("chunlogo", "opening", "pre_dv"):
            print(f"SYSTEM/{name}.pss", flush=True)
            movie(asset(f"SYSTEM/{name}.pss"), stage, stage / (name + ".mp4"))
        still_png(asset("SYSTEM/copyrigh.ipu"), stage, stage / "copyrigh.png", encode)
        title_textures(asset("SYSTEM/title_g.dat"), stage)
        title = stage / "source.m2v"
        loop = asset("SYSTEM/title.m2v")
        title.write_bytes(loop)
        video(title, stage / "title.mp4")
        package = asset("SYSTEM/title.mmv")
        for i in range(2):
            length, sector = struct.unpack_from("<II", package, 64 * i + 56)
            segment = package[sector * SECTOR:sector * SECTOR + length]
            if len(segment) != length or not segment.startswith(b"\0\0\1\xb3"):
                raise ValueError("Invalid title movie segment")
            if i == 0:
                title.write_bytes(segment)
                video(title, stage / "title-1.mp4")
            elif segment != loop:
                raise ValueError("Unrecognized title loop in MMV")
        recollection = stage / "mo0001.m2v"
        recollection.write_bytes(asset("GRA/MO/mo0001.m2v"))
        video(recollection, stage / "mo0001.mp4")
        summer_movies(disc, stage)
        opening_assets(disc, stage, encode)
        for file in stage.iterdir():
            if file.suffix in {".mp4", ".png", ".ogg", ".json"} or file.name in {"move.wav", "confirm.wav", "cancel.wav"}:
                os.replace(file, assets / file.name)
    for filename in ("index.html", "player.css", "player.js", "render.js", "names.js"):
        shutil.copyfile(Path(__file__).with_name(filename), output / filename)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("iso", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not all(shutil.which(tool) for tool in ("ffmpeg", "ffprobe")):
        parser.error("Install FFmpeg with its IPU decoder and libx264 encoder")
    prepare(args.iso, args.output)
