# SN4·ScenePack 전체 추출 형식

판본 SLPS_251.32(Special Box). 두 파일 모두 `ScenarioLink:Ver:3.25.2.157` 컨테이너다. `0xA0`에 u32 블록 수가 있고, `0xA4`부터 `(offset, size)` u32 쌍이 이어진다.

## scenario.sn4 → `sn4dump.py`

```sh
python3 sn4dump.py scenario.sn4 sn4.json [opcodes.md]
```

- SCR 블록 `+0x30`: u32 해시 버킷 256개. `+0x430`: 코드 시작.
- 버킷 체인 항목: `<u16 다음 항목까지 크기(0=끝)><u16 종류><u32 off><이름\0>`. 종류 `0x6F4E`는 `0x85` 헤더 라벨, `0xFFFF`는 `_로컬` 라벨이다. 위치는 `코드 시작 + off`.
- 라벨 헤더: `85 크기 종류 이름\0` 뒤의 `22`. 로컬 라벨은 `16`(선택지 응답 구분) 다음 명령을 가리킨다.
- 결과는 Codex VM(`sn4.js`) 형식인 `{entry, labels:[{label, offset, block, ops, next}]}`. 같은 위치의 이름은 별칭 라벨로 모두 만든다. 루비는 `0x106`, `0x66`은 `0x65`로 내보낸다(기존 VM과 같다).
- 피연산자 분류:
  - 없음: `04 09 0B–0E 10–13 15–17 1A 1B 1E 22 23 27–29 2D–2F 31 32 34 35 3A–3E`
  - u8: `1F 40 41 45–48`
  - u8,u8: `4C 4D`
  - BE32: `50 51 53–57 59–5E 60–62 64–66`
  - 4바이트: `75`
  - u8, BE16 크기, 페이로드: `82`
  - u8 크기와 페이로드: `68–6C 6F–74 76 79–7C 7E 7F 81 83–85`
- `70`/`71`: `{var(BE16), cmp, value|other(BE16), target}`. `68`/`69`: `{var, op, value|source}`. `7B`: `{kind, name, param}`.

## scene_pk.spk → `spkdump.py`

```sh
python3 spkdump.py scene_pk.spk scenepack.json
```

- ScenePack 블록 `+0x20`: u32 해시 버킷 256개. `+0x420`: u32 `subTable`, `resourceTable`, `commandArea`.
- 그룹 체인: `u16 개수`, 그다음 항목마다 `<u16 크기><u32 subOffset><u32 firstIndex><이름\0>`.
- `subTable + subOffset`: `u16 개수`, 그다음 항목마다 `<u16 해시><u16 크기><이름\0><u32 commandOffset><u16 0>`. 명령은 다음 항목의 오프셋 직전까지다.
- 명령 스트림은 u16 opcode(`< 0x27`)와 그 뒤 u16 매개변수 태그로 이루어진다. 매개변수 태그는 다음 opcode가 나올 때까지 이어진다.
  - `27 file` / `33 motion`: cp932 문자열(`0x19` 뒤의 `27`은 u32)
  - `29 id`: u32
  - `2A data`: u32 n, 그다음 n−3바이트 `[kind][count][count×BE i32]`(`0x23` 뒤에서는 문자열)
  - `31 vector`: i32×3
  - 나머지(`28 layer`, `2B fadeFrames`, `2C pan`, `2D pitch`, `2E wait`, `2F volume`): u16(pan·pitch는 부호 있음)
- 항목마다 `commands` 전체를 담는다. 기존 플레이어와 맞도록 `image`(첫 `07`의 `.ipu`)와 `music`(`14` → `17` → `15` 순으로 첫 명령)도 넣는다. Codex가 손으로 넣은 14개 항목과 `image`·`music`이 모두 같았다.

| op | 관찰한 매개변수 | 추정 |
| --- | --- | --- |
| `01` | 없음 | 장면 명령 묶음 끝·동기 |
| `07` / `04` | file, layer | 그림·영상(`.ipu .m2v .pss .mmv`) / 애니메이션(`.sab`) |
| `08` `09` `0A` | layer, data | 화면 효과 매개변수 |
| `0B` | layer, id | |
| `0C` | id, volume, pan, pitch, wait, fadeFrames | 효과음 재생(id는 십진 `뱅크×1000+번호` 꼴) |
| `0D` `0F` `10` `11` | id + fade·volume·pan·pitch | 효과음 정지·볼륨·팬·피치 |
| `12` `13` | wait, fadeFrames | |
| `14` `15` `17` | file/volume/wait/fade | BGM 시작·정지·볼륨(기존 확인) |
| `19` | id, file(u32), layer | |
| `1C` | file(`.osb`), motion(`.osa`), vector | 3D 모델 |
| `23` | data(문자열) | 스크립트 이벤트(예: 스태프롤 동기) |
| `24` | file(`.rgb .mgs .cmb`) | 마스크·스프라이트 |
