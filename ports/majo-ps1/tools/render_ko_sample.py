#!/usr/bin/env python3
"""Render a private generated Korean font through the browser glyph path."""

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("font", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--browser", type=Path)
    args = parser.parse_args()
    metadata = json.loads((args.font / "font.json").read_text(encoding="utf-8"))
    glyphs = list((args.font / "glyphs.kf1").read_bytes())
    src = Path(__file__).resolve().parents[1] / "src"
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=args.browser, headless=True)
        page = browser.new_page(viewport={"width": 320, "height": 240})
        page.route("https://majo.invalid/", lambda route: route.fulfill(
            content_type="text/html", body="<style>*{margin:0}</style><canvas width=320 height=240></canvas>"))
        for name in ("background.mjs", "text-display.mjs", "korean-text.mjs"):
            page.route("https://majo.invalid/" + name, lambda route: route.fulfill(
                content_type="text/javascript", body=(src / route.request.url.rsplit("/", 1)[1]).read_text(encoding="utf-8")))
        page.goto("https://majo.invalid/")
        result = page.evaluate("""async data => {
          const {paintFrame} = await import('/background.mjs');
          const {KoreanTextDisplay} = await import('/korean-text.mjs');
          const frame = {width: 320, height: 240, pixels: new Uint16Array(320 * 240)};
          const font = {glyphs: Uint8Array.from(data.glyphs), metrics: data.metrics};
          const display = new KoreanTextDisplay(frame, font);
          display.setText('한글 0123.,!?  세로 위치');
          const advances = [];
          for (let guard = 0; guard < 1000; guard++) {
            const before = display.offset;
            const event = display.tick(true);
            if (display.offset !== before && event.type === 'glyph') advances.push(display.x);
            if (event.type === 'end') break;
          }
          paintFrame(document.querySelector('canvas'), frame);
          return {advances, autoPages: display.autoPages};
        }""", {"glyphs": glyphs, "metrics": metadata["metrics"]})
        if result["advances"][:3] != [15, 30, 36] or result["autoPages"]:
            raise SystemExit("Korean glyph advance/space regression: " + json.dumps(result))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        page.locator("canvas").screenshot(path=args.output)
        browser.close()
    print(json.dumps(result))


if __name__ == "__main__":
    main()
