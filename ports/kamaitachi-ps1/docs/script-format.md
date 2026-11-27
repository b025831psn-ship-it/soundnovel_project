# Kamaitachi PS1 script format (translation)

`tools/extract-script.mjs` reads the user's own `SCE.PAC` and writes the whole Japanese script
for translation. The real script is not public: it goes to the private repository
`kamaitachi-ps1-kor` (`script/ja/`). This document and the example below are the shared format.

```sh
node tools/extract-script.mjs SCE.PAC PORT_DATA/manifest.json OUT_DIR
```

`manifest.json` (port data, made from the user's EXE) supplies the opcode lengths.

## Files

- `script.ja.json`: every text command in every scenario record, in record order.
- `md/RRR.md`: the same, one file per SCE resource, for reading.
- `uncovered.json`: text-like byte runs (four or more SJIS glyphs) that no entry covers.
  It must be `[]`. Anything listed there was missed by the extractor.

## Entries

| field | meaning |
|---|---|
| `id` | `RRR-SSS-OOOO`: resource, record, and the byte offset of the text command in the record. Fixed: translations, glossary entries and review notes key on it. |
| `label` | the game's scenario label, resource × 1000 + record (what jumps and calls name) |
| `offset` | the byte offset, as a number |
| `ja` | the text, with the text codes as `[tokens]` (below) |
| `via` | set when the text is the command inside a wrapper, e.g. `0x30` (a sound with the next command) |
| `beforeChoice` | the last text before a choice command (0x16): the choice's lines |
| `skipBlock` | inside a 0x17 block (commands up to the next 0x15) |

`nonText` lists byte runs that the linear read decoded as text but that hold control bytes or
invalid SJIS (data tables). They are not translated.

## Text codes

Codes are single ASCII bytes inside the SJIS text (src/text/text.js). Keep each token as it is,
in a sensible place in the translation:

| token | meaning |
|---|---|
| `[@]` `[r]` | new line |
| `[L]` | new line if past x 256 |
| `[R]` | the next `[r]` returns to the left margin |
| `[p]` `[P]` | wait for a key (`P` not inside quotes) |
| `[g]` | wait, new page |
| `[k]` | wait at the next `g` unless quoted |
| `[o]` | skip the next `p`/`P` |
| `[sp]` | an ASCII space (no glyph; full-width spaces are text) |
| `[cN]` `[CN]` | colour N (`C` = second palette) |
| `[hN]` | attribute N |
| `[sN]` | text speed N |
| `[vN]` | remember the position as mark N |
| `[wNN]` | delay (argument as two hex digits when it is not printable) |
| `[nN]` | insert string N (`[n1]` hero's name, `[n2]` the companion's) |

## Example (hand-written, not from the game)

```json
{
 "schema": "kamaitachi.ps1.script.v1",
 "source": { "file": "SCE.PAC", "sha1": "…" },
 "records": 2,
 "entries": 2,
 "gaps": [],
 "nonText": [],
 "items": [
  { "id": "099-001-0004", "label": 99001, "offset": 4, "ja": "窓の外では雪が降り続いている。[r][p][@]" },
  { "id": "099-001-0052", "label": 99001, "offset": 52, "via": "0x30", "beforeChoice": true, "ja": "[C4][n1][C0]は、どうする？[@]" }
 ]
}
```

A translation file keeps the same ids: `{ "id": "099-001-0004", "ko": "창밖에는 눈이 계속 내리고 있다.[r][p][@]" }`.
