"""Convert local PS2 PSS movies and split the indexed PCM sound bank."""
import argparse
from pathlib import Path
import struct
import subprocess
import tempfile
import wave


def movie_audio(data):
    pos = 0
    audio = bytearray()
    while pos < len(data):
        if data[pos:pos + 3] != b"\0\0\1":
            raise ValueError("Invalid MPEG-PS start code")
        tag = data[pos+3]
        if tag == 0xb9:
            break
        if tag == 0xba:
            pos += 14 + (data[pos+13] & 7)
            continue
        end = pos + 6 + int.from_bytes(data[pos+4:pos+6], "big")
        if end > len(data):
            raise ValueError("Truncated MPEG-PS packet")
        if tag == 0xbd:
            payload = pos + 9 + data[pos+8] + 4
            audio.extend(data[payload:end])
        pos = end
    if not audio:
        return None
    fmt, rate, channels, block = struct.unpack_from("<4I", audio, 8)
    size = struct.unpack_from("<I", audio, 36)[0]
    if (audio[:4] != b"SShd" or audio[32:36] != b"SSbd" or fmt != 1 or
            len(audio) != size+40 or channels != 2 or size % (channels*block)):
        raise ValueError("Unexpected movie PCM layout")
    import array
    pcm = array.array("h")
    samples = array.array("h")
    samples.frombytes(audio[40:])
    stride = block // 2
    for start in range(0, len(samples), stride*2):
        stereo = array.array("h", [0]) * (stride*2)
        stereo[::2] = samples[start:start+stride]
        stereo[1::2] = samples[start+stride:start+stride*2]
        pcm.extend(stereo)
    return rate, pcm


def convert_movie(source, target):
    audio = movie_audio(source.read_bytes())
    with tempfile.TemporaryDirectory(dir=target.parent) as temp:
        cmd = ["ffmpeg", "-v", "error", "-nostdin", "-i", str(source)]
        if audio:
            rate, pcm = audio
            audio_file = Path(temp, "track.wav")
            with wave.open(str(audio_file), "wb") as wav:
                wav.setparams((2, 2, rate, 0, "NONE", ""))
                wav.writeframes(pcm.tobytes())
            cmd += ["-i", str(audio_file), "-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac"]
        else:
            cmd += ["-map", "0:v:0"]
        output = Path(temp, "movie.mp4")
        subprocess.run(cmd + ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "18",
                              "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)],
                       check=True)
        output.replace(target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("resources", type=Path)
    args = parser.parse_args()
    sound = args.resources / "sound"
    sound.mkdir(exist_ok=True)
    data = (args.resources / "D0/WSE.WAV").read_bytes()
    pos = number = 0
    while pos < len(data):
        if data[pos:pos+4] != b"RIFF" or data[pos+8:pos+12] != b"WAVE":
            raise ValueError("Invalid WSE bank boundary")
        end = pos + 8 + struct.unpack_from("<I", data, pos+4)[0]
        if end > len(data):
            raise ValueError("Truncated WSE bank")
        (sound / f"{number:03d}.wav").write_bytes(data[pos:end])
        number += 1
        pos = end
    movies = args.resources / "movies"
    movies.mkdir(exist_ok=True)
    for source in sorted((args.resources / "D4").glob("*.PSS")):
        convert_movie(source, movies / (source.stem + ".mp4"))


if __name__ == "__main__":
    main()
