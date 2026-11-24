# GBA display modes

`DisplayAdapter` takes the renderer's unchanged 240×160 canvas as its input. `native` is the default and copies that frame without transformation. `handheld-2.5x` renders 600×400 with WebGL; construction or shader failure falls back to `native`.
Loss of an active WebGL context also replaces the output with a native canvas and redraws the current source frame.

The CPU implementation in `reference.js` is deliberately test-only. Run the real shader comparison and benchmark with:

```sh
node --test ports/kamaitachi-gba/display/display.test.mjs
```

For each 2×2 source block, the four 2×2 corners of the 5×5 result copy A/B/C/D. The center column chooses between the two pixels on its row half, the center row between the two pixels on its column half, and the center pixel between all four. Selection minimizes `R + G + B`; ties retain A/B/C/D order. Alpha is copied from the selected pixel and does not participate in selection.
