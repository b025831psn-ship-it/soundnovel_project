"""Compare browser canvas readback with selected original RGB565 frames."""

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright
from extract_script import EXPECTED_EXE_SHA1, EXPECTED_SCRP_SHA1, digest, parse_resource_index


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", type=Path)
    parser.add_argument("trace", type=Path)
    parser.add_argument("samples", nargs="+", metavar="FRAME=RESOURCE")
    parser.add_argument("--browser", type=Path, help="installed Chromium or Edge executable")
    args = parser.parse_args()
    exe = (args.files / "SLPS_018.63").read_bytes()
    scrp = (args.files / "SCRP.D").read_bytes()
    if digest(exe, "sha1") != EXPECTED_EXE_SHA1 or digest(scrp, "sha1") != EXPECTED_SCRP_SHA1:
        parser.error("expected SLPS-01863")
    index = {r["name"]: r for r in parse_resource_index(exe)}
    with args.trace.open(encoding="utf-8") as stream:
        frames = {r["frame"]: r for r in map(json.loads, stream)}
    module = Path(__file__).resolve().parents[1] / "src/background.mjs"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=args.browser, headless=True)
        page = browser.new_page()
        page.route("**/*", lambda route: route.abort())
        page.route("https://majo.invalid/", lambda route: route.fulfill(
            content_type="text/html", body="<canvas></canvas>"))
        page.route("https://majo.invalid/background.mjs", lambda route: route.fulfill(
            content_type="text/javascript", body=module.read_text(encoding="utf-8")))
        page.goto("https://majo.invalid/")
        failed = []
        for spec in args.samples:
            number, name = spec.split("=", 1)
            r = index[name]
            data = scrp[r["offset"]:r["offset"] + r["size"]]
            result = page.evaluate("""async data => {
                const {paintFrame, renderBackground, unpackPicture} = await import('/background.mjs');
                const canvas = document.querySelector('canvas');
                paintFrame(canvas, renderBackground(unpackPicture(Uint8Array.from(data))));
                const {width, height} = canvas;
                const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
                const pixels = new Uint16Array(width * height);
                for (let i = 0; i < pixels.length; i++) {
                  pixels[i] = ((rgba[4*i] >> 3) << 11) | ((rgba[4*i+1] >> 2) << 5) | (rgba[4*i+2] >> 3);
                }
                const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', pixels));
                return [[width, height, 2], Array.from(hash, n => n.toString(16).padStart(2,'0')).join('')];
            }""", list(data))
            frame = frames[int(number)]
            if result != [frame["geometry"], frame["video"]]:
                failed.append(spec)
            print(spec, result[1])
        if failed:
            raise SystemExit("Frame mismatch: " + ", ".join(failed))


if __name__ == "__main__":
    main()
