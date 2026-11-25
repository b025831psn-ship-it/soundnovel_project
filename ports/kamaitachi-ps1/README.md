# Kamaitachi PS1 native-bytecode port

This port executes raw SCE record bytes extracted from the verified PS1 disc.
It does not use the generic JSON novel player, decoded screenshots, a disc
image, or a BIOS at runtime. Private data is generated in the
`kamaitachi-ps1-kor` submodule and must remain ignored there.

## Private extraction

Run `private-tools/extract-port-data.py` in the private submodule with the four
PAC paths, PS-X EXE, disc inventory, and `ike-harness.mjs`. It extracts all raw
members from SCE/BGD/BIN/SDW, decodes compressed SCE members through retail
routine `0x800356c8`, writes every record separately, and records LBA, size,
SHA-256, and both executable dispatch tables in `port-data/manifest.json`.

The verified disc currently produces 42 SCE, 994 BGD, 13 BIN, and 968 SDW
resources, plus 3,912 decoded SCE records. No payload belongs in Git.

## Headless API

```js
import { run } from "./src/headless.js";
const result = await run("/private/port-data", 25, 7, "first");
```

```sh
npm test
node tools/run-headless.mjs /private/port-data 25 7 first
node tools/run-all.mjs /private/port-data first > failures.json
node tools/opcode-report.mjs /private/port-data > opcode-status.json
```

The primary table is read from retail `0x8006a3ec` (256 slots), and the `1d`
sub-table from `0x800129dc` (108 slots). Opcode `00` text and `1d 03` name entry
are implemented. Every other slot is present as a handler-address-citing stub
that stops; it is never silently skipped. `run-all` intentionally returns a
single machine-readable failure list for Claude's whole-game pass.
