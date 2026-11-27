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

## Browser runtime and framebuffer

`createRuntime(portDataRoot, options)` returns the object consumed by the web
shell: `step()`, a live 320x240 RGBA `framebuffer`, `input.pulse()`,
`touchRows()`, `cursorIndex()`, and `moveCursor()`. Each step executes original
SCE bytes through `ScenarioVM`; opcodes `2f`, `30`, `31`, `32`, `35`, and `36`
are forwarded to the sound module's `scenarioOp`, followed by one `vsync()` and
`frame()` tick. Jump, call, choice, and branch targets use the same decimal-label
versus resource-offset resolver as the exhaustive flow sweep.

`RetailFramebuffer` implements native-size RGBA clear, alpha/tint blits,
rectangles, decoded retail glyph masks, fades, and horizontal wipes. TIM 4/8/
16/24-bpp and embedded or separately supplied CLUT decoding is implemented.
Seven observed SDW images use that separate-CLUT path. SDW `LZS` uses the observed retail
Okumura stream (4096-byte ring, cursor `0xfee`); the first flag is byte 3, with
no invented size header. Runtime callers inject the opcode-to-asset renderer,
the extracted retail font provider, and retail choice-row geometry. Missing
glyphs or an `ike` member without the verified `0x800356c8` build-time decoder
fail explicitly instead of substituting a guessed font or layout.

Raw RGBA captures can be compared without PNG conversion:

```sh
npm run compare-frames -- original.rgba port.rgba
```

It reports differing pixels and mean/maximum channel error. Opening, first
choice, and ending parity remain unclaimed until the retail renderer command
mapping, font extraction, and build-time `ike` conversion are connected and
fresh original RGBA captures are available; the previously deleted captures
are not replaced with reconstructed screenshots.

### Web shell entry point

`index.html` uses the touch-only shell from `ba1e884`; `main.js` is the real
bootstrap rather than its former test-card placeholder. It fetches the private
port data, creates the AudioWorklet sound object, passes that same object into
`createRuntime`, publishes `window.kamaitachiPs1 = { runtime, sound, stop }`,
and copies the live RGBA framebuffer into `canvas#screen` once per animation
frame. The default private paths are:

- `../../kamaitachi-ps1-kor/port-data/`
- `../../kamaitachi-ps1-kor/port-data/sound/`

For a local private-data server they can be overridden without changing the
public tree: `?data=/private/port-data/&sound=/private/port-data/sound/`.
Startup fails visibly if either source is absent; it never falls back to the
old synthetic grid or choice buttons.

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

Choice-label records end in opcode `15` and are entered without a VM call
frame. A runtime `return` with an empty stack therefore advances to the next
record instead of re-entering the same label. This fixes the former `25:10`
loop: fresh play proceeds through `25:12` and reaches the two-row choice at
`25:13`.

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
at `0x80022448` stores its u16 operand at `0x800792bc` as the current
checkpoint. The native checkpoint screen reads that value at `0x80019df8` and
`0x80019f58`. Its confirm path subtracts one at `0x8001a2c4` and passes the
result to `0x8001c6a0`. That routine loads SCE resource 39 when necessary
(`0x8001c6ec`–`0x8001c774`), indexes its u16 record-offset table with the
selected value (`0x8001c778`–`0x8001c790`), and installs the resulting scenario
cursor at `0x8001c798`–`0x8001c7a4`. This is the native-code link between an
opcode-`53` checkpoint value `N + 1` and entry `39:N`, so the root list is
generated from actual checkpoint producers rather than from the resource's
record count. The previously cited `0x800292b0` is unrelated: it is the sound-ID
play routine used by scenario sound opcodes. Resource 31
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

## Memory card (machine)

The browser machine (`?engine=machine`) has a virtual memory card in slot 1
(`src/memory-card.js`): the raw 128 KB image laid out as a real card holds it
(directory frames, 8 KB blocks), so the same image works in emulators as an
`.mcr` file. `machine.js` serves the game's card library calls (libmcrd:
exist / accept / read / write / create / delete / format / sync) on that image,
with the library's own result codes and its "new card" rule; slot 2 stays empty.
The game's own screens (card choice, the three books, save, bookmark restore)
run as translated original code. `machine-browser.js` keeps the image in
localStorage after every write and exposes `runtime.exportCard()` (a copy of the
image) and `runtime.importCard(bytes)` (swaps the card, as if another one were
inserted); `runtime.onCardChange` is called after the game writes. Without a
card (`new Machine({ ... })` with no `card`), the machine behaves as the oracle
does with both slots empty.

## Touch shell

`src/touch-shell.js` is the input shell for the ported VM/VRAM runtime. It maps
the canvas to native 320×240 pixels and asks the retail renderer for
`touchRows()`; it never infers hit targets from HTML overlays. A tap outside a
retail row emits one `confirm` trigger, a tap on another row calls the retail
cursor movement routine, and a second tap on the current row confirms. The
one-frame `RetailInputLatch` prevents a quick pointer release from disappearing
before VSync. Optional cancel/menu controls live outside the canvas. Keyboard
input remains a desktop convenience; no virtual pad is drawn over VRAM.
