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
sub-table from `0x800129dc` (108 slots). The private extractor can run
`psx-analysis/tools/scenario_lengths.py` to attach public-safe cursor-delta
evidence for all 364 handlers. Fixed-width and proven variable-width stubs log
their operands and continue; only an unresolved data-dependent width stops a
record. Opcode `00` text and `1d 03` name entry are implemented. The ten most
frequent blockers are identified separately as decoded commands until their
state/rendering effects have native trace parity; a guessed semantic name is
not treated as an implementation.

`run()` advances through consecutive records in the selected SCE resource and
stops when it emits a choice. Opcode `13` is decoded from handler `0x8001e3c0`
as a choice header plus `(count + 1)` byte-swapped branch labels. Fresh play
`run(25, 7, "enumerate")` therefore reaches the first two-option choice in
record 8. These labels belong to the retail global SCE address space; they are
not presented as record IDs until loader-base reverse mapping proves that
relationship. `run-all` uses isolated-record mode so every one of the 3,912
records is still scanned exactly once.
