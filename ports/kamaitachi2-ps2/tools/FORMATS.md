# SN4·ScenePack 전체 추출 형식

판본 SLPS_251.32(Special Box). 두 파일 모두 `ScenarioLink:Ver:3.25.2.157` 컨테이너다. `0xA0`에 u32 블록 수가 있고, `0xA4`부터 `(offset, size)` u32 쌍이 이어진다.

## scenario.sn4 → `sn4dump.py`

```sh
python3 sn4dump.py scenario.sn4 sn4.json [opcodes.md]
```

- SCR 블록 `+0x30`: u32 해시 버킷 256개. `+0x430`: 코드 시작.
- 버킷 체인 항목: `<u16 다음 항목까지 크기(0=끝)><u16 종류><u32 off><이름\0>`. 종류 `0x6F4E`는 `0x85` 헤더 라벨, `0xFFFF`는 `_로컬` 라벨이다. 위치는 `코드 시작 + off`.
- 라벨 헤더: `85 크기 종류 이름\0` 뒤의 `22`. 로컬 라벨은 `16`(선택지 응답 구분) 다음 명령을 가리킨다.
- 결과는 Codex VM(`sn4.js`) 형식인 `{entry, labels:[{label, offset, block, ops, next}]}`. 같은 위치의 이름은 별칭 라벨로 모두 만든다. 루비는 `0x106`으로 내보낸다. `0x65`(상대 이동)와 `0x66`(절대 좌표)은 따로 둔다.
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

## 효과음 → `sepack.py`, `se.js`

```sh
python3 sepack.py SOUND__SEP__sep.pac SOUND__WAVE_WD__wave_wd.dat SOUND__WAVE_WD__wave_wd.sec out/se [se-ids.json]
node test-se.mjs out/se scenepack.json          # 모든 ScenePack SE 번호 일괄 검사
node test-se.mjs out/se x --wav 538003 a.wav    # 한 효과음을 48 kHz WAV로 렌더
```

원본 IOP 드라이버 `IRX/IOPSOUND.IRX`("IopSoundDriver/SQUARE")를 역분석해 옮겼다. 주소는 `.text` 오프셋이다.

- `sep.pac`: `u16 n`, `u16 off/2[n]`, `u16 size[n]`, 2바이트, `u32 id[n]`(정렬됨, EE 0x1be248 이진 탐색), 데이터. 레코드 `[u32 id][u32 size][u8 트랙 수][u16 뱅크][u16 플래그][u16 트랙 길이×n][트랙]`.
- `wave_wd.sec`: 뱅크 번호별 시작 섹터(u32 4096개). 뱅크 `WD`: `u16 번호`, `u32 샘플 크기`, `u32 악기 수`, `u32 영역 수`, `+0x20` 악기별 영역 오프셋. 영역 32바이트: `+0 플래그`, `+4 샘플 오프셋`, `+8 루프`, `+0C ADSR1`, `+0E ADSR2`, `+10 i32>>16 조율(1/256 반음)`, `+14 키 상한`, `+15 벨로시티 상한`, `+16 볼륨`, `+17 팬(bit7=영역 팬 사용)`. 이 판본의 영역 플래그는 모두 0이라 악기당 영역 1개다.
- 타이밍: 하드웨어 타이머 36.864 MHz / 0x25800 = 240 Hz(0xd898). SE 트랙은 프레임마다 누산기 −120, 0 이하이면 +300 하고 1틱 진행(0x57ec) → 초당 96틱(120 BPM, 48 PPQN). BGM은 −BPM(0x08 명령)으로 같은 방식이다.
- 트랙: `[varlen 대기]` 다음 `[명령][인자][varlen 대기]` 반복(0x51d4, 0x4fe8). 명령표 `.data 0x147a0`, 미정의 명령은 트랙 종료.

| 명령 | 인자 | 의미(드라이버 처리) |
| --- | --- | --- |
| `00` | | 트랙 끝, 키오프 |
| `04` / `05 n` / `06` | | 반복 시작 / n회째 탈출(0=256) / 무한 반복 |
| `08 t` | | 템포(BGM) |
| `10` `11 k v` `12 k` `13 v` | | 키온(이전 값 / 키·벨로시티 / 키 / 벨로시티) |
| `18` `19 k v` | | 키오프 |
| `20 p` | | 악기 |
| `22 v` `23 t v` | s8 | 볼륨 / 볼륨 슬라이드(`v<<19`, 양수면 +0x7F000) |
| `24` `25` | | 익스프레션 / 슬라이드 |
| `26 v` `27 t v` | s8 | 팬 `(v+0x40)` / 슬라이드. 표 인덱스 0x80이 가운데 |
| `28 t` `29` | varlen | 레가토 포르타멘토 시간 / 해제 |
| `2A` `2B` | | 레가토 켬(키오프 무시, 같은 보이스 재사용) / 끔 |
| `2C t s` | | 피치 슬라이드(목표 s 반음) |
| `30` `31 a` `34 s` `35 r` | | ADSR 원복 / 어택 / 서스테인 / 릴리스 레이트 |
| `40` `48` `50` | 깊이·속도·파형 | 비브라토 / 트레몰로 / 팬 LFO |
| `56 w` `58 d` `5A s` | | 팬 LFO 파형 / 디튠 배율 / 반음 이조 |
| `78 k v` `79` `5B` `62` | | 드라이버 매개변수 칸(소리에 영향 미확인) |

- 음높이(0x2d4): `키×256 + 벤드 + 이조 + 장면 피치 + 영역 조율`을 표 0x13774(반음)·0x137a4(1/256)로 SPU 피치로 바꾼다. 키 60·조율 0 = 0x1000(48 kHz).
- 볼륨(0x3a4): `(마스터+1)·(익스프레션+1)>>9 · (벨로시티+1)>>7 · 볼륨>>14 · (영역 볼륨+1)>>7`, ±0x3FFF로 자른 뒤 팬 표 0x13d54(L=tab[p], R=tab[255−p])를 곱한다.
- 장면 SE(ScenePack `0C`): volume 0–100, pan −100–100, pitch 센트, fadeFrames(60 fps). EE가 정수 나눗셈(버림)으로 바꿔 IOP에 보낸다: 볼륨 `volume×127/100`(0x1be2e8, 드라이버 0x1838의 SE 경로 최대 127; BGM 기본 0x1FF보다 약 12 dB 낮음), 팬 `0x40 + pan×63/100`(오른쪽)·`0x40 + pan×64/100`(왼쪽)(0x1be338), 피치 `pitch×256/100`(1/256 반음, 0x1be3f0). 번호 1000 미만은 포트 0, 이상은 포트 1(0x1be2d8). 재생 RPC는 0x1e6738(함수 0x0D, `[포트, 일련번호, id, 값, 값]`).
- 근사: SPU2 가우스 보간 대신 4점 3차 보간, 트레몰로·팬 LFO의 세부 스케일, 리버브(영역 `+18`) 미구현.
