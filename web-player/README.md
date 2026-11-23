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

```json
{
  "schemaVersion": 1,
  "gameId": "sample-first-choice",
  "title": "표시할 제목",
  "entry": "intro.choice",
  "scenes": { "living": { "name": "거실" } },
  "nodes": {
    "intro.choice": {
      "scene": "living",
      "question": "질문",
      "options": [
        { "key": "A", "label": "선택지 A", "to": "branch.a" },
        { "key": "B", "label": "선택지 B", "to": "branch.b" }
      ]
    },
    "branch.a": { "scene": "living", "pages": [["문장 1", "문장 2"]], "to": null }
  }
}
```

- 노드 ID, 제목, 장면 이름은 모두 JSON에서 읽습니다. 플레이어 코드에는 고정된 값이 없습니다.
- `nodes`는 ID를 키로 한 객체나 `id`를 가진 노드 배열 모두 받습니다.
- 선택지 노드는 `options`(또는 `choices`), 본문 노드는 `pages`를 가집니다. 페이지는 문장 배열, 문자열 하나, 또는 `lines`/`sentences`/`text` 필드를 가진 객체를 받습니다.
- `scene`은 `scenes`의 키이거나, `scenes`가 없으면 문자열 그대로 장면 이름으로 씁니다.
- 본문 노드는 페이지를 차례로 재생한 뒤 `to`로 이동하고, `to`가 `null`이면 구간을 끝내고 **첫 선택지로 돌아가기**를 보여줍니다.

## 진행 저장

`localStorage`의 `soundnovel.webPlayer.<gameId>` 키 하나에 `gameId`, `schemaVersion`, 현재 노드, 페이지, 문장 위치를 저장합니다. 불러올 때 `gameId`·`schemaVersion`이 다르거나 노드·문장이 데이터에 없으면 처음부터 시작합니다. **첫 선택지로 돌아가기**는 이 키만 지웁니다.

## 조작

- 선택지: 첫 포커스는 첫 번째 선택지. 클릭·터치, 방향키로 이동, Enter로 선택.
- 본문: 화면 클릭·터치, Enter, Space, 아래·오른쪽 방향키로 한 문장씩 진행.

## 허브에 넣기

```js
import { normalizeStory } from './story.js';
import { createPlayer } from './player.js';

const story = normalizeStory(await (await fetch(url)).json());
createPlayer(panelElement, story);   // player.css도 함께 불러옵니다
```
