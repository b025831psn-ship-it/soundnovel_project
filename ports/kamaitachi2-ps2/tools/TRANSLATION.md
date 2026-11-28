# 카마이타치의 밤 2 (PS2) 번역용 원문 형식 `sn4text/1`

번역 세션이 읽고 쓰는 파일 형식이다. 실제 대사는 비공개 저장소 `kamaitachi2-ps2-kor`의 `translation/`에만 둔다. 이 문서의 예문은 직접 지어낸 것이다.

## 만드는 법

```sh
python3 sn4dump.py SCENARIO__scenario.sn4 scenario.json
python3 sn4dump.py SCENARIO__love.sn4 love.json
python3 sn4text.py extract scenario.json translation/ja/scenario
python3 sn4text.py extract love.json translation/ja/love
python3 sn4text.py check translation/ja/scenario                              # 원문 자체 검사
python3 sn4text.py check translation/ja/scenario translation/ko/scenario      # 번역 검사
```

- `scenario.sn4`는 본편이다. 시작 라벨은 `my01_0000`이다.
- `love.sn4`는 「ラブテスター篇」이다. 시작 라벨은 `lo00_0000`이다. EXE에 `edit0:SCENARIO/love.sn4`로 등록되어 있다.
- `love.sn4`에는 디버그·편집용 라벨(「デバッグ用選択肢へ飛ぶ」 등)도 들어 있다. 이 라벨은 원문에 그대로 남기고, 번역 우선순위만 낮춘다.

## 단위와 ID

- 한 단위(unit)는 VM이 멈추는 지점 사이에 표시하는 글이다. 단위는 파일 순서대로 늘어서고, 라벨 경계를 넘지 않는다.
- 단위를 끝내는 명령(`stop`):

  | 명령 | `stop` 값 |
  | --- | --- |
  | `0x09` | `pause` |
  | `0x0B` | `pause-clear` |
  | `0x0C` | `page-break` |
  | `0x16` | `choice-end` |
  | `0x6C` | `select` (선택지 직전의 질문) |
  | `0x73` | `scene` |
  | `0x6A`/`0x6B` | `jump` |
  | `0x70`/`0x71` | `if` |
  | 라벨 끝 | `label-end` |

- `id`는 `라벨@첫 글자 명령의 파일 오프셋`이다(예: `xx01_0010@0x1a2b3`). 같은 디스크에서는 바뀌지 않는다. 번역문, 용어집, 검수 의견은 모두 이 ID에 연결한다.
- `scene`은 그 단위보다 앞에서 마지막으로 불러온 장면(ScenePack) 이름이다. 배경과 장면을 찾을 때 참고한다.

## 본문 `ja`의 표시

| 표시 | 원래 명령 | 번역할 때 |
| --- | --- | --- |
| `{HERO}` | `0x0D` 주인공 이름 | 그대로 둔다. 조사는 받침 유무가 정해지지 않으므로 `{HERO}`에 붙는 조사를 피하거나 「(이)」식 처리를 용어집에서 정한다 |
| `{PARTNER}` | `0x0E` 여자친구 이름 | 같음 |
| `{NAME3}` | `0x0F` 세 번째 이름(ラブテスター篇) | 같음 |
| 줄바꿈 `\n` | `0x04` | 개수를 유지한다. 위치는 한국어에 맞게 옮길 수 있다 |
| `{rb:底|そこ}` | `0x106` 루비(뒤 글자 위의 읽기) | 한국어에서는 보통 지우거나 `{rb:한자|읽기}`로 다시 단다. 검사에서 개수는 보지 않는다 |
| `{#0}`, `{#1}` … | 그 밖의 명령(글자 크기 `0x4C`, 속도 `0x40`, 간격 `0x46`, 대기 `0x50`, 좌표 `0x65`/`0x66` 등). 내용은 `codes[n]` | 모두 남긴다. 강조할 낱말 앞뒤 같은 위치에 둔다 |

선택지에 연결된 단위에는 `choices: [{group, index}]`가 붙는다. 이 단위의 글은 메뉴에 보이는 선택지 문구다(`sn4.js`의 `choiceText`와 같다). `index.json`의 `choices`는 선택지 묶음마다 보기 단위 ID를 순서대로 가진다. 번역할 때는 질문 단위(`stop: "select"`)와 보기들을 함께 본다.

## 파일 구성

```
translation/ja/scenario/index.json   # source, entry, format, units, chars, choices[], chunks[{file, units, chars}]
translation/ja/scenario/my01.json    # {"chunk": "my01", "units": [...]}
```

- 묶음(chunk)은 라벨 접두어(`my01`, `ak11` …)로 나눈다.
- `_my4` 같은 내부 라벨은 바로 앞 장면의 묶음에 들어간다.

예(지어낸 문장):

```json
{"chunk": "xx01", "units": [
 {"id": "xx01_0010@0x1a2b3", "label": "xx01_0010", "scene": "xx0001",
  "ja": "『{#0}見本{#1}』という本がある。", "codes": [{"op": 76, "args": [0, 40]}, {"op": 76, "args": [0, 33]}],
  "stop": "pause"},
 {"id": "xx01_0020@0x1a2f0", "label": "xx01_0020", "scene": "xx0001",
  "ja": "{PARTNER}に聞いてみる。\n", "stop": "choice-end", "choices": [{"group": "xx01_0015@0x1a2c8", "index": 0}]}
]}
```

## 번역 파일

`translation/ko/<시나리오>/`에 같은 이름의 파일을 둔다. `index.json`은 `ja` 쪽을 복사한다. 각 단위에는 `id`와 `ko`만 있으면 된다.

```json
{"chunk": "xx01", "units": [
 {"id": "xx01_0010@0x1a2b3", "ko": "『{#0}견본{#1}』이라는 책이 있다.", "model": "gpt-6-luna"},
 {"id": "xx01_0020@0x1a2f0", "ko": "{PARTNER}에게 물어본다.\n"}
]}
```

- `model`, `note`, `status`처럼 다른 필드를 더해도 된다. 검사기는 이런 필드를 보지 않는다.
- `check`는 다음을 검사한다.
  - ID 누락, 중복, 원문에 없는 ID
  - 빈 번역
  - `{HERO}`/`{PARTNER}`/`{NAME3}`/`{#n}` 개수 일치
  - 줄바꿈 개수 일치
- 문자 지원(글꼴)과 줄 길이 검사는 재삽입 단계에서 따로 한다.

## 현재 분량 (sn4dump.py 4b2e4a4 이후, 이 디스크 기준)

| 시나리오 | 단위 | 글자(표시 제외) | 묶음 | 선택지 묶음 |
| --- | ---: | ---: | ---: | ---: |
| scenario.sn4 | 26,916 | 525,451 | 220 | 425 |
| love.sn4 | 2,292 | 36,386 | 18 | 18 |

- 보기 문구가 없는 선택지가 1곳 있다. `tab05_5010`의 두 번째 보기 `tab05_5190`이다. 원본에도 글이 없다.
- 이 표에는 시나리오 밖의 글이 들어 있지 않다. 이름 입력판(`namkan.txt`), 메뉴·시스템 그림 속 글자, EXE 안의 문자열이 그렇다.
