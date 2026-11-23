# web-player

첫 선택지와 두 갈래의 직후 장면을 재생하는 독립 사운드노벨 플레이어입니다. 빌드 도구 없이 정적 파일만으로 동작하고, 나중에 기존 허브의 오른쪽 패널에 넣을 수 있도록 플레이어가 건드리는 DOM은 모두 마운트한 요소 안에 있습니다.

## 실행

JSON을 `fetch`로 읽기 때문에 `index.html`을 파일로 직접 열면 동작하지 않습니다. 이 폴더에서 정적 서버를 띄워 주세요.

```sh
cd web-player
python -m http.server 8000
# 브라우저에서 http://localhost:8000/
```

기본으로 저장소에 포함된 예문 `data/sample.ko.json`을 재생합니다.

## 실제 대사 JSON으로 확인하기

실제 대사 데이터는 저장소에 올리지 않습니다. 둘 중 편한 방법을 쓰세요.

1. `data/local/` 폴더에 파일을 두고 URL로 지정합니다. 이 폴더는 `.gitignore`에 들어 있습니다.
   `http://localhost:8000/?data=data/local/first-choice.ko.json`
2. 화면 아래 **JSON 파일 열기**로 파일을 고릅니다. 고른 파일은 이 탭의 `sessionStorage`에만 보관되어 새로고침해도 유지되고, **기본 예문으로 돌아가기**로 해제합니다.

자동 확인도 같은 파일로 돌릴 수 있습니다(Playwright 필요).

```sh
node tests/e2e.mjs                                  # 예문
node tests/e2e.mjs data/local/first-choice.ko.json  # 실제 데이터
```

## 데이터 형식

Codex가 확인한 `first-choice.ko.json`과 같은 형식입니다. 저장소의 `data/sample.ko.json`은 같은 형식에 직접 쓴 예문을 넣은 것입니다.

```json
{
  "schemaVersion": 1,
  "gameId": "sample-first-choice",
  "title": "표시할 제목 (선택)",
  "entry": "intro-choice",
  "scenes": { "living-room": { "name": "거실" } },
  "nodes": {
    "intro-choice": {
      "kind": "choice",
      "scene": "hall",
      "text": "질문",
      "options": [
        { "key": "A", "label": "선택지 A", "to": "living" },
        { "key": "B", "label": "선택지 B", "to": "room" }
      ]
    },
    "living": { "kind": "passage", "scene": "living-room", "pages": ["문장 1", "문장 2"], "to": null }
  }
}
```

- `nodes`는 노드 ID를 키로 쓰는 객체이고, `entry`와 선택지의 `to`는 그 키를 가리킵니다. 노드 ID, 제목, 장면 이름은 모두 JSON에서 읽으며 플레이어 코드에는 고정된 값이 없습니다.
- `kind`가 `choice`면 `text`(질문)와 `options`를, `passage`면 `pages`를 읽습니다.
- 선택하면 `to` 노드의 `pages[0]`부터 보여주고, 입력마다 다음 페이지로 넘어갑니다. 마지막 페이지 다음에는 `to`로 이동하고, `to`가 `null`이면 구간을 끝내고 **첫 선택지로 돌아가기**를 보여줍니다.
- `title`과 `scenes`는 선택 항목입니다. `scenes`에 이름이 없으면 `scene` 값을 그대로 장면명으로 표시합니다.
- 문장(페이지, 질문, 선택지 라벨)은 문자열이거나 원문을 함께 담은 `{ "ko": "번역", "ja": "原文" }`입니다. 한 데이터 안에서 섞어 써도 됩니다. 원문이 하나라도 있으면 위쪽 막대에 **번역/병기/원문** 전환 버튼이 나타나고, 원문이 없는 문장은 어느 모드에서든 번역으로 표시합니다.
- 호환을 위해 `nodes` 배열(각 노드에 `id`), `choices`, `question`, 문장 배열이나 `{ "lines": [...] }` 형태의 페이지도 받습니다.

## 진행 저장

`localStorage`의 `soundnovel.webPlayer.<gameId>` 키 하나에 `gameId`, `schemaVersion`, 현재 노드, 페이지, 문장 위치를 저장합니다. 불러올 때 `gameId`·`schemaVersion`이 다르거나 노드·문장이 데이터에 없으면 처음부터 시작합니다. 지나온 노드와 고른 선택지(`trail`)도 함께 저장해 백로그를 다시 만듭니다. **첫 선택지로 돌아가기**는 이 키만 지웁니다. **저장** 버튼의 3칸은 `soundnovel.webPlayer.<gameId>.slots`에 따로 저장하며, 첫 선택지로 돌아가도 남습니다. 데이터가 바뀌어 위치가 맞지 않는 칸은 불러올 수 없게 표시합니다. 표시 언어는 모든 작품에 공통인 `soundnovel.webPlayer.settings`에 저장합니다.

## 조작

- 선택지: 첫 포커스는 첫 번째 선택지. 클릭·터치, 방향키로 이동, Enter로 선택.
- 본문: 화면 클릭·터치, Enter, Space, 아래·오른쪽 방향키로 한 페이지(문장)씩 진행. 위 방향키나 PageUp은 백로그를 엽니다.
- 백로그: 위쪽 막대의 **백로그** 버튼. 질문, 고른 선택지, 지금까지 읽은 문장을 순서대로 보여줍니다. Esc, **닫기**, 바깥 클릭으로 닫으면 읽던 곳으로 돌아가고 Enter로 바로 이어 읽을 수 있습니다.
- 저장: 위쪽 막대의 **저장** 버튼. 3칸마다 **여기에 저장** / **불러오기**. 칸에는 장면, 저장 시각, 그때의 문장이 보입니다.
- 버튼은 모두 4:3 원작 화면 바깥(위쪽 막대)에 있습니다.

## 허브에 넣기

```js
import { normalizeStory } from './story.js';
import { createPlayer } from './player.js';

const story = normalizeStory(await (await fetch(url)).json());
createPlayer(panelElement, story);   // player.css도 함께 불러옵니다
```

iframe 패널에 넣을 때는 `index.html?embed=1`(필요하면 `&data=<경로>`)을 엽니다. 제목과 파일 도구를 숨기고, 버튼 막대와 4:3 화면을 프레임 안에 맞춥니다. 폭이 420px 이하인 좁은 패널에서는 글자와 선택지를 줄여 화면 안에 들어가게 합니다. 서버에 등록할 경로는 `index.html`, `main.js`, `player.js`, `story.js`, `player.css`, `data/*.json`입니다.
