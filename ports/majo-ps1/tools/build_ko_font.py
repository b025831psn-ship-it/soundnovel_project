#!/usr/bin/env python3
"""Build private 16x13 Korean glyph data and audit every translated page."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


TOKEN = re.compile(r"\[(?:r|p|k|g|q|[0-9a-f]|w[0-9a-f]{2}|l[0-9a-f]{2},[0-9a-f]{2})\]", re.I)
NAME = re.compile(r"\[n\]([A-Za-z0-9_-]+)")
PAIRED = re.compile(r"\[n\]([A-Za-z0-9_-]+)(은\(는\)|이\(가\)|을\(를\)|과\(와\)|\(으\)로|\(이\)라고|\(이\)라는|\(이\)랑|\(이\)야|이었다\(였다\))")
PARTICLES = {
    "은(는)": ("은", "는"), "이(가)": ("이", "가"), "을(를)": ("을", "를"), "과(와)": ("과", "와"),
    "(이)라고": ("이라고", "라고"), "(이)라는": ("이라는", "라는"), "(이)랑": ("이랑", "랑"),
    "(이)야": ("이야", "야"), "이었다(였다)": ("이었다", "였다"),
}


def jong(value: str) -> int:
    code = ord(value.rstrip()[-1])
    return (code - 0xAC00) % 28 if 0xAC00 <= code <= 0xD7A3 else int(0x3131 <= code <= 0x314E)


def format_names(text: str, names: dict[str, str]) -> str:
    def pair(match):
        name, marker = names.get(match[1]), match[2]
        if not name:
            return match[0]
        tail = jong(name)
        if marker == "(으)로":
            return name + ("으로" if tail and tail != 8 else "로")
        return name + PARTICLES[marker][not bool(tail)]
    return NAME.sub(lambda match: names.get(match[1], match[0]), PAIRED.sub(pair, text))


def load_translation(repo: Path, commit: str) -> list[dict]:
    raw = subprocess.check_output(
        ["git", "-C", str(repo), "show", f"{commit}:script/ko/script.ko.json"], text=True, encoding="utf-8")
    return json.loads(raw)


def raster(font, character: str) -> bytes:
    image = Image.new("1", (16, 13))
    draw = ImageDraw.Draw(image)
    box = draw.textbbox((0, 0), character, font=font)
    width = box[2] - box[0]
    draw.text(((16 - width) // 2 - box[0], -box[1]), character, font=font, fill=1)
    result = bytearray()
    for y in range(13):
        mask = sum((0x8000 >> x) for x in range(16) if image.getpixel((x, y)))
        result.extend(mask.to_bytes(2, "big"))
    return bytes(result)


def audit_pages(rows: list[dict], metrics: dict[str, dict], names: dict[str, str]) -> tuple[list[str], list[str]]:
    auto_pages, unresolved = [], []
    for row in rows:
        text = format_names(row["ko"], names)
        x = line = pages = 0
        cursor = 0
        for control in TOKEN.finditer(text):
            for character in text[cursor:control.start()]:
                metric = metrics.get(character)
                if character.isspace():
                    advance = 6
                elif not metric:
                    unresolved.append(row["id"]); advance = 15
                else:
                    advance = metric["advance"]
                if x + advance > 270: x, line = 0, line + 1
                if line > 8: x, line, pages = 0, 0, pages + 1
                x += advance
            code = control.group()[1:-1].lower()
            if code == "r": x, line = 0, line + 1
            elif code == "p": x, line = 0, 0
            elif code.startswith("l"):
                column, line_value = code[1:].split(",")
                x, line = int(column, 16) * 15, int(line_value, 16)
            if line > 8: x, line, pages = 0, 0, pages + 1
            cursor = control.end()
        for character in text[cursor:]:
            advance = 6 if character.isspace() else metrics.get(character, {"advance": 15})["advance"]
            if x + advance > 270: x, line = 0, line + 1
            if line > 8: x, line, pages = 0, 0, pages + 1
            x += advance
        if pages: auto_pages.append(row["id"])
    return sorted(set(auto_pages)), sorted(set(unresolved))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--translation-repo", required=True, type=Path)
    parser.add_argument("--commit", default="b0f613d")
    parser.add_argument("--font", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    rows = load_translation(args.translation_repo, args.commit)
    variants = ({"0": "츠다", "1": "요리코"}, {"0": "민준", "1": "봄"})
    formatted = [(row["id"], format_names(row["ko"], names)) for names in variants for row in rows]
    marker = re.compile(r"은\(는\)|이\(가\)|을\(를\)|과\(와\)|\(으\)로|\(이\)라고|\(이\)라는|\(이\)랑|\(이\)야|이었다\(였다\)")
    leftovers = sorted({identifier for identifier, text in formatted if "[n]" in text or marker.search(text)})
    characters = sorted({character for _, text in formatted for character in TOKEN.sub("", text) if not character.isspace()})
    font = ImageFont.truetype(str(args.font), 13)
    glyphs = b"".join(raster(font, character) for character in characters)
    metrics = {character: {"index": index, "advance": 15} for index, character in enumerate(characters)}
    metrics[" "] = {"index": None, "advance": 6}
    auto_pages, unresolved = audit_pages(rows, metrics, variants[0])
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "glyphs.kf1").write_bytes(glyphs)
    (args.output / "font.json").write_text(json.dumps({"schema": "majo.ps1.ko-font.v1", "metrics": metrics}, ensure_ascii=False) + "\n", encoding="utf-8")
    report = {
        "translationCommit": subprocess.check_output(["git", "-C", str(args.translation_repo), "rev-parse", args.commit], text=True).strip(),
        "entries": len(rows), "glyphs": len(characters), "josaLeftovers": leftovers,
        "autoPaginatedIds": auto_pages, "unresolvedOverflowIds": unresolved,
    }
    (args.output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: len(value) if isinstance(value, list) else value for key, value in report.items()}, ensure_ascii=False))
    if leftovers or unresolved:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
