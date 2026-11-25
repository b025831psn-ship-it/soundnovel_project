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

The sweep command reports `fresh` and `unlock` results. Fresh play keeps
blank-card-only unlock branches on their fallthrough. Unlock uses an explicit
`both` policy for opcodes `54`, `55`, and `5d`, explores both cursor writes,
and reports that coverage separately. Opcodes `0e`, `0f`, `24`, `25`, `40`,
`54`, `55`, `5d`, and `5e` resolve their handler words as decimal labels, as do the
`57` scenario destinations (for example `27003`, `15000`, and `21000` in the
common resource-27 hub). Opcode `45` is the distinct current-resource offset
form. Variable handlers `78` and `bc` enumerate resource-load labels but do not
write the scenario cursor, so they remain executable `resource-table` commands
rather than false control-flow edges.
Opcode `4b` schedules the next resource, opcode `03` performs the retail call-
stack pop, and the real `44` title return resumes through the common `27:0`
hub without treating resource fall-off as an ending.

The report also runs two native-entry root families that are not reachable by
scenario bytecode alone: `title-menu:main` at `31:0` and
`title-menu:scenario-select:<N>` for each resource-39 record whose decoded
opcode `53` checkpoint ID is `N + 1`. This yields 260 native checkpoint entries;
records 54, 200, 203, and 263 have no such control-flow-aligned marker and are
reported separately as internal control rows rather than assumed menu entries.
The retail `53` handler
at `0x80022448` stores its u16 operand as the current checkpoint, which is the
native-code link between the saved menu index and these SCE records. The native
selector at `0x800292b0` reduces its saved label to a record index at
`0x80029370`–`0x800293a8`, applies its table/unlock policy at
`0x800293b4` and `0x800296b8`–`0x80029738`, and passes the selected index to
the resource loader at `0x80029404` or `0x8002975c`. Thus the root list is
generated from actual checkpoint producers, not from the resource's record
count. Resource 31
initializes/returns from the title flow, while each `39:N` is one native-indexed
scenario/bookmark menu entry with its own flag checks and destination. These roots are
reported separately from fresh play rather than silently inflating it.
The JSON result includes a `perResource` table so a menu-root run proves that
all 264 dispatch records were entered instead of merely reaching `39:0`.
Sub-1000 transfer words are resolved like retail: an existing resource-0 label
wins; otherwise the same word is a current-resource byte offset.

Ending coverage counts decoded source transfers into the shared `31:11`
title-return record. The opcode `44` there is one shared implementation, not
one story ending. `endingRoutes` reports only routes reached by a sweep;
`catalog.endingRoutes` enumerates all control-flow-aligned decoded transfers.
It uses the same ambiguous-label and resource-offset resolver as the sweep and
continues through branch fallthroughs and call return sites within each record.

Resources 22 and 32 remain native-entry islands, not silently dropped SCE
transfers. Re-decoding the previously reported sources on instruction boundaries
shows that `0:87` returns at `+18`; its later byte pattern resembling opcode `02`
is not reachable from that record entry. The apparent `4b` instances in `4:13`
and `11:13`, and the apparent resource-32 transfer in `19:107`, are Shift-JIS or
operand bytes found by the old isolated byte scan. The unified catalog contains
no external control-flow-aligned edge into resource 22 or 32. They therefore need
separate native entry evidence before either resource is added as a sweep root.
Raw byte-pattern hits are not counted because most occur inside text or
operands rather than at opcode boundaries.

## Touch shell

`src/touch-shell.js` is the input shell for the ported VM/VRAM runtime. It maps
the canvas to native 320×240 pixels and asks the retail renderer for
`touchRows()`; it never infers hit targets from HTML overlays. A tap outside a
retail row emits one `confirm` trigger, a tap on another row calls the retail
cursor movement routine, and a second tap on the current row confirms. The
one-frame `RetailInputLatch` prevents a quick pointer release from disappearing
before VSync. Optional cancel/menu controls live outside the canvas. Keyboard
input remains a desktop convenience; no virtual pad is drawn over VRAM.
