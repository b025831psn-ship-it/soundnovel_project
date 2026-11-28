"""Compare browser canvas readback with selected original RGB565 frames."""

import argparse
import json
import struct
from pathlib import Path

from playwright.sync_api import sync_playwright
from extract_script import EXPECTED_EXE_SHA1, EXPECTED_SCRP_SHA1, digest, parse_resource_index


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", type=Path)
    parser.add_argument("trace", type=Path)
    parser.add_argument("samples", nargs="*", metavar="FRAME=RESOURCE")
    parser.add_argument("--text-window", metavar="FIRST,COUNT,SCRIPT,OFFSET,PICTURE",
                        help="replay one text opcode starting with its blank background frame")
    parser.add_argument("--browser", type=Path, help="installed Chromium or Edge executable")
    args = parser.parse_args()
    exe = (args.files / "SLPS_018.63").read_bytes()
    scrp = (args.files / "SCRP.D").read_bytes()
    if digest(exe, "sha1") != EXPECTED_EXE_SHA1 or digest(scrp, "sha1") != EXPECTED_SCRP_SHA1:
        parser.error("expected SLPS-01863")
    index = {r["name"]: r for r in parse_resource_index(exe)}
    with args.trace.open(encoding="utf-8") as stream:
        frames = {r["frame"]: r for r in map(json.loads, stream)}
    if not args.samples and not args.text_window:
        parser.error("select frame samples or a text window")
    src = Path(__file__).resolve().parents[1] / "src"
    def resource(name):
        r = index[name]
        return list(scrp[r["offset"]:r["offset"] + r["size"]])
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=args.browser, headless=True)
        page = browser.new_page()
        page.route("**/*", lambda route: route.abort())
        page.route("https://majo.invalid/", lambda route: route.fulfill(
            content_type="text/html", body="<canvas></canvas>"))
        for module in ("background.mjs", "text-display.mjs", "scenario-vm.mjs"):
            page.route("https://majo.invalid/" + module, lambda route: route.fulfill(
                content_type="text/javascript", body=(src / route.request.url.rsplit("/", 1)[1]).read_text(encoding="utf-8")))
        page.goto("https://majo.invalid/")
        failed = []
        page.evaluate("""async () => {
            const {paintFrame} = await import('/background.mjs');
            const canvas = document.querySelector('canvas');
            window.readFrame = async frame => {
                paintFrame(canvas, frame);
                const {width, height} = canvas;
                const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
                const pixels = new Uint16Array(width * height);
                for (let i = 0; i < pixels.length; i++) {
                  pixels[i] = ((rgba[4*i] >> 3) << 11) | ((rgba[4*i+1] >> 2) << 5) | (rgba[4*i+2] >> 3);
                }
                const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', pixels));
                return [[width, height, 2], Array.from(hash, n => n.toString(16).padStart(2,'0')).join('')];
            };
        }""")
        for spec in args.samples:
            number, name = spec.split("=", 1)
            result = page.evaluate("""async data => {
                const {renderBackground, unpackPicture} = await import('/background.mjs');
                return readFrame(renderBackground(unpackPicture(Uint8Array.from(data))));
            }""", resource(name))
            frame = frames[int(number)]
            if result != [frame["geometry"], frame["video"]]:
                failed.append(spec)
            print(spec, result[1])
        if args.text_window:
            first, count, script, offset, picture = args.text_window.split(",")
            first, count = int(first), int(count)
            if min(first, count) <= 0:
                parser.error("first and count must be positive")
            tables = [list(struct.iter_unpack("<HH", exe[start:start + 4*size]))
                      for start, size in ((0x48a20, 19), (0x48a6c, 32))]
            output = page.evaluate("""async p => {
                const {renderBackground, unpackPicture} = await import('/background.mjs');
                const {TextDisplay} = await import('/text-display.mjs');
                const {ScenarioVM} = await import('/scenario-vm.mjs');
                const frame = renderBackground(unpackPicture(Uint8Array.from(p.picture)));
                const vm = new ScenarioVM(unpackPicture(Uint8Array.from(p.script)), new Uint8Array(512));
                vm.pc = p.offset;
                const event = vm.step();
                if (event?.type !== 'text') throw new Error('Expected text command');
                const display = new TextDisplay(frame, p.fonts.map(f => Uint8Array.from(f)), p.tables);
                const hashes = [];
                for (let i = 0; i < p.count; i++) {
                  display.tick(event.bytes);
                  hashes.push(await readFrame(frame));
                }
                return hashes;
            }""", dict(count=count, offset=int(offset, 0), picture=resource(picture),
                       script=resource(script), fonts=[resource("K0.KF1"), resource("K1.KF1")], tables=tables))
            for number, result in enumerate(output, first):
                ref = frames[number]
                if result != [ref["geometry"], ref["video"]]:
                    failed.append(str(number))
            print(f"Text window {first}..{first + count - 1} compared {count} frames")
        if failed:
            raise SystemExit("Frame mismatch: " + ", ".join(failed))


if __name__ == "__main__":
    main()
