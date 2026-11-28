"""Raster-level checks for opening.extend_korean_font."""

import argparse
import tempfile
from pathlib import Path

from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from opening import extend_korean_font


parser = argparse.ArgumentParser()
parser.add_argument("font", type=Path)
args = parser.parse_args()

with tempfile.TemporaryDirectory() as temporary:
    out = Path(temporary)
    Image.new("RGBA", (64 * 36, 36)).save(out / "font.png")
    metrics = {"�": [0, 0, 24, 24, 0], "　": [0, 0, 33, 0, 0]}
    extend_korean_font(out, metrics, ["한 8,.(○@"], args.font)
    assert metrics[" "][3] == 0 and 1 <= metrics[" "][2] < 16
    assert metrics[","][4] > metrics["8"][4] > metrics["한"][4]
    assert metrics["○"] != metrics["@"]
    atlas = Image.open(out / "font.png").convert("RGBA")
    for ch in "한8,.(○@":
        x, y, width, height, top = metrics[ch]
        crop = atlas.crop((x, y, x + width, y + height))
        assert crop.getbbox(), (ch, metrics[ch])
        assert 0 <= top and top + height <= 36, (ch, metrics[ch])

print("Korean SN4 font raster metrics OK")
