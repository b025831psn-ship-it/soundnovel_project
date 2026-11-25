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
decimal labels resolved by `0x8001bfb8`: `resource = floor(label / 1000)` and
`record = label % 1000`. Thus the first choice labels 25010 and 25009 branch
to `25:10` and `25:9`. `enumerate` runs both targets independently and each
reaches the next choice at `25:13`; it no longer executes both option bodies
linearly. `run-all` uses isolated-record mode so every one of the 3,912 records
is still scanned exactly once.

Text opcodes `00` and `17` carry Shift-JIS plus inline renderer escapes rather
than plain Shift-JIS alone. Observed pairs include `n1`/`n2` name insertion,
`C4`/`C0` style or name-slot selection, `v0`/`v1` and `c0`/`c1` choice-body
markers, and `rP`/`pg` page or line controls; `L` is an inline layout control.
They remain structured text bytes until the renderer routines assign their
complete visual semantics. The former 75 `unterminated-text` reports had two
parser causes: opcodes `30`/`32` execute a nested command (not merely an
optional byte), and a resource-terminal zero is a boundary rather than a new
empty text command. Handler-aware nested lengths and terminal text handling
reduce that count to zero without inventing terminators.

## Control-flow sweep

The VM emits executable `jump`, `call`, `return`, `branch`, `flag-store`,
`choice`, and `ending` records. Opcodes `01`, `02`, and `15` model the retail
jump/call-stack/conditional-return path; the cursor-writing conditional family
is not encoded uniformly: `1e`, `45`, and `5e` use current-resource offsets,
`56` carries a decimal cross-resource label, and `57` carries current-resource
record rows. Each exposes its target and fallthrough without treating arbitrary
operand pairs as labels. Opcode `13` exposes the verified choice label table.
Wrapper commands `30`/`32` may place their nested opcode
in the following record, which is a valid zero-extra-byte boundary rather than
an unknown width.

```sh
npm run sweep -- /private/port-data
```

The default sweep has exactly one root: fresh play `25:7`. Optional resource
entries can be reported separately, but byte-pattern label seeding is not
performed. An earlier 95.04% figure was invalid because it scanned arbitrary
byte pairs as labels; it has been removed. Resource fall-off is likewise not
an ending. The sole currently identified ending/title transition is opcode
`44` at `31:11+9`, whose unique handler `0x8002188c` performs the full display
and state transition before the common `27:0` path. It emits an explicit
`{kind:"ending", id:"title-return"}` event. Coverage is reported only from
the actual sweep output and is not promoted to a completion claim.
