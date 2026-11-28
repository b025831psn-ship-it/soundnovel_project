# 펜션 슈프르 관리자

The owner's page, apart from the hub and the players (issue #44). It is served under `/edit/admin/`
(serve.cjs), so from outside it asks for the same password as every `/edit/` write; the browser
keeps it for the device. Nothing in the hub or a player links to it.

What it does now: dialogue editing for 카마이타치의 밤 (PS1). Find a line by id, Japanese or
Korean; edit the Korean as the screen shows it; see the game's page drawn with the game font;
save. The game lays the saved edits over the translation when it starts, so a reload shows them.

## Editing without codes

The edit box holds what the screen shows. Enter is a line break and a space is a space; they are
written back as the engine's own codes. Codes that must keep their place (wait for a press, page
turn, the names, colours ...) are grey locked chips. An edit that loses a chip is refused.

## Files of a game (private data, never in this repository)

- the adapter's own read-only data (PS1: `ko-script.json`, `ko-font.bin`, `ko-editor.json`),
- `text-edits.json`: the owner's edits, `{ "<id>": { "ko": text, "base": the translation when it
  was edited, "at": ISO time } }`. It is separate from the translation file, so a later review or
  rebuild of the translation does not overwrite an edit; when the translation of an edited line
  changes, the page says so,
- `text-edits.log.jsonl`: one line per save with what changed (the history).

## Adapter (`adapters/<game>.js`)

`export default { id, title, async load() }`. `load()` returns the game object the page uses:

| member | meaning |
| --- | --- |
| `items` | `[{ id, ja, ko }]` in scene order: the original, the translation |
| `edits` | the owner's edits as stored |
| `current(item)` | the text in force (edit or translation) |
| `parts(id, text)` | the text as `[{ text } \| { br } \| { chip }]`: what the edit box shows |
| `text(id, parts)` | the stored text of edited parts (breaks and spaces as the engine's codes) |
| `label(chip)` | the words on a locked chip |
| `readable(text)` | plain text for lists and search |
| `check(id, text)` | `{ errors, warnings }`: an error refuses the save, a warning is shown |
| `preview(id, text)` | canvases: the screen page(s) with this line, drawn by the game's rules |
| `save(id, entry \| null)` | stores or removes one edit; returns "" or the failure to show |

To add a title: write its adapter, add its id to `ADAPTERS` in `admin.js`, give serve.cjs a
`PUT /edit/<game>/text-edits.json`, and make the game read its `text-edits.json` at start.

Still to come (issue #44): scene jump ("디버그로 실행") from this page, and the other titles.
