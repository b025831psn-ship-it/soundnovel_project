# 펜션 슈프르 관리자

The owner's page, apart from the hub and the players (issue #44). It is served under `/edit/admin/`
(serve.cjs), so from outside it asks for the same password as every `/edit/` write; the browser
keeps it for the device. Nothing in the hub or a player links to it.

One frame for every title (admin.js, admin.css): the top bar picks 작품 and 판본 and searches; the
left column lists the lines under their scenes; the centre runs the game itself as a debug run; the
right column edits the line (the original, the Korean as the screen shows it, the game's page drawn
with the game font, save). On a phone the game is on top, the editor below and the list a drawer.
The game tells the frame which lines are on its screen, so the editor follows the reading; 「이
장면으로」 opens the game at the page of a line, and a save opens that page again with the change.
The look is the hub's (style.css tokens: dark theatre, one red accent, Noto Serif KR) and every
part (button, field, list row, badge, locked chip) is defined once in admin.css; an adapter adds
no styles of its own. Titles and editions are listed in `TITLES` (admin.js); an edition without
an adapter shows as 준비 중. Connected now: 카마이타치의 밤 PS1.

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

`export default { id, async load() }` (id = the edition's id in `TITLES`). `load()` returns the game object the page uses:

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
| `scene(id)`, `sceneName(scene)` | the scene a line belongs to and its heading in the list |
| `save(id, entry)` | stores an edit (`null` removes it); returns "" or the failure in words |
| `runUrl`, `jumpUrl(id)` | optional: the game's debug run, and the same opened at the page of a line |
| `onScreen(message)` | optional: the ids on the game's screen from a `postMessage` of the game, else null |

To add a title: write its adapter, add its id to `ADAPTERS` in `admin.js`, give serve.cjs a
`PUT /edit/<game>/text-edits.json`, and make the game read its `text-edits.json` at start.

## Debug runs and the scene jump

"디버그로 실행" opens a game with `?debug=1`. A game reads its debug data only under `/edit/`
(with the header `X-Quiet-Auth: 1`, so nobody else gets a password prompt), so the parameter does
nothing for anyone but the owner. "이 장면으로" on a line opens the game at the page with that line.

PS1: the entry state of a page is the game's own bookmark state (what a save from the menu
writes), taken at every page of the replay of every ending, so the flags are those of the original
route. `debug-scenes.json` (tools/ko/debug-scenes.mjs) maps a line to its state; the game puts the
state into the debug card's book and presses through to the page. A line no replayed route stops at opens
at the nearest line before it in its record; a record no route passes has no entry state yet.

Still to come (issue #44): the other titles.

## 한 글자씩 찍히는 줄

원본이 한 글자씩 따로 찍는 조각(한 레코드 안에서 한 글자 조각이 둘 이상 이어지는 곳)과 그 줄을 끝내는 조각은 목록과 편집창에서 한 줄로 보인다. 저장할 때 조각마다 원래 ID로 다시 나뉜다(한 글자 조각은 앞 공백과 글자 하나, 나머지는 마지막 조각). 어댑터의 `itemOf(id)`가 조각 ID를 줄 ID로 바꾼다.
