# 공통 세이브·동기화 설계

모든 포트(GBA·SFC·PS1·PS2·Zakuro 등)가 같은 저장소 계층과 같은 파일 형식을 쓰기 위한 설계 문서다.
상태: **초안.** 태우가 결정한 사항(2026-11-25)을 아래 "결정"에 옮겼고, 코드는 아직 없다.

## 결정

1. **PC↔모바일 이어하기**가 목표다. 세이브는 서버에 보관한다.
2. 기기 연결은 **동기화 코드**(QR 또는 문자열)로 시작한다. 로그인은 필요해지면 선택 기능으로 얹는다.
3. 세이브는 **원본 모양의 슬롯 + 논리 스냅샷**이다. GBA 책 3권, SFC·PS1·PS2는 각 원작의 슬롯 구성을 따른다. 원본 `.sav`·카드 이미지와의 호환은 목표가 아니다.
4. 웹 전용 **중단 저장**을 추가한다. 원작 슬롯과 별도 칸이며 기기 간 이어하기의 기본 경로다.
5. PS1·PS2 가상 메모리 카드는 **작품별**이다. 구조에 `cardId`를 남겨 나중에 작품 간 공유로 바꿀 수 있게 한다. 전작 데이터 이어받기 여부는 나중에 바이너리로 확인한다.
6. 세이브에는 번역문을 넣지 않는다(위치·플래그·선택 기록만). 일본어판과 한글판이 같은 세이브를 공유한다. (제안, 미확정)

## 계층

```
작품 포트 (GBA 책 3권 / SFC SRAM 슬롯 / PS 가상 카드 ...)   ← 작품별 SaveCodec
        │  SaveSlot 봉투(JSON)
SaveStore (공통)  ── IndexedDB(로컬 우선) ── Sync (서버)
```

- **SaveCodec**(작품별): `payload` 변환과 **슬롯 구성의 소유자**. Store·Sync는 슬롯 id를 해석하지 않고 불투명한 안정 id로만 다룬다. 새 포트가 생겨도 공통 코드를 고치지 않기 위해서다. 계약(이름은 가안, Codex 의견 반영):

```ts
interface SaveCodec<State, Payload> {
  readonly gameId: string;
  readonly currentSchema: number;
  slots(): readonly SlotDescriptor[];                       // 슬롯 목록·표시·허용 연산을 선언
  encode(snapshot: Snapshot, ctx: SaveContext): Payload;    // 실행 중 VM이 아니라 포트가 만든 불변 스냅샷을 받는다
  validate(payload: unknown, schema: number): ValidationResult;
  migrate(payload: unknown, fromSchema: number): MigrationResult<Payload>;
  decode(payload: Payload, ctx: LoadContext): LoadResult<State>;
  summarize(payload: Payload, ctx: DisplayContext): SlotSummary;  // 현재 언어의 제목, 완·종 횟수 등
}
type SlotDescriptor = {
  id: string;                          // 안정 id: manual-0, system, suspend
  group: "manual" | "system" | "suspend";
  ordinal?: number;
  canCopy?: boolean; canErase?: boolean; canWrite?: boolean;
  showInOriginalUi: boolean;           // suspend는 false
  original?: { containerId?: string; fileId?: string; blocks?: number };  // 카드 id, 원작 파일명 등은 표시용 메타데이터
};
```

  - 불러오기는 항상 `validate → migrate → decode` 순서다. 모두 예외를 던지지 않고 `unsupportedSchema`, `incompatibleDataVersion`, `corrupt` 같은 명시적 결과를 돌려주며, 이것이 "불러올 수 없음" 표시와 연결된다.
- **SaveStore**(공통): `list(gameId)`, `read(gameId, slot)`, `write(gameId, slot, envelope)`, `erase(gameId, slot)`, `exportAll()`, `importFile(file)`. 쓰기는 항상 로컬에 먼저 하고 동기화 대기열(outbox)에 넣는다.
- **Sync**(공통): 대기열을 서버로 보내고, 서버의 변경을 받아 온다. 서버가 없거나 실패해도 게임은 멈추지 않는다.

## 로컬 저장

IndexedDB 데이터베이스 `soundnovel` 하나.

| 저장소 | 키 | 내용 |
|---|---|---|
| `saves` | `[gameId, slot]` | 봉투 전체 |
| `outbox` | `[gameId, slot]` | 서버에 아직 못 올린 변경 표시 |
| `meta` | `deviceId`, `vault` | 기기 id, 동기화 코드에서 파생한 키 |

- 설정(볼륨, 음소거, 언어, 터치 옵션)은 세이브와 분리한다. 기본은 기기별 로컬이며 동기화하지 않는다.
- IndexedDB를 못 쓰면(일부 사생활 모드) 메모리 보관으로 내려가고 화면에 "저장되지 않음"을 표시한다. 쓰기 실패를 조용히 넘기지 않는다.
- 기존 `localStorage` 키(`kamaitachi-gba.book.N`, `soundnovel.webPlayer.<gameId>[.slots]`, `soundnovel.slps25132.opening.v1`)는 첫 실행에 한 번 새 형식으로 옮기고, 옮긴 뒤에도 한 버전 동안은 지우지 않는다.
- 모바일 Safari는 오래 방문하지 않은 사이트의 로컬 저장소를 지울 수 있다고 알려져 있다(홈 화면 앱은 예외로 알려짐). 구현 때 실기로 확인한다. 대응: `navigator.storage.persist()` 요청, 서버 동기화, 백업 파일 내보내기 안내.

## 봉투 형식 (format 1)

예시는 `examples/` 참고.

| 필드 | 설명 |
|---|---|
| `format` | 봉투 형식 번호. 지금은 `1`. |
| `gameId` | 작품+기종 고정 id (`kamaitachi-gba`, `kamaitachi-ps1` …). 한글판·원문판 구분 없음. |
| `slot` | 슬롯 id. Codec이 정하는 불투명한 안정 id(`manual-0`, `system`, `suspend` 등). 공통 코드는 해석하지 않는다. |
| `original` | 선택. 카드 id, 원작 파일명·제품 코드, 블록 수 같은 표시용 메타데이터. 저장 정체성에는 들어가지 않는다. |
| `schema` | 이 작품 `payload`의 스키마 버전. 작품별 이전 함수가 사용한다. |
| `dataVersion` | 시나리오·자산 구조 버전(위치가 유효한지 판단). 고정 ID 체계가 유지되는 한 올리지 않는다. |
| `edition` | 저장한 판본(`ja`, `ko`). 참고용이며 호환 조건이 아니다. |
| `revision` | 서버가 슬롯마다 매기는 증가 번호. 로컬에서는 마지막으로 받은 값(`baseRevision`)을 쓴다. |
| `savedAt` | 저장 시각(UTC ISO 8601). |
| `deviceId` | 저장한 기기. |
| `label` | `summarize` 결과의 최소 캐시(목록을 빨리 그리기 위한 것). 평문. 언어를 바꾸면 Codec이 현재 언어로 다시 만든다. |
| `payload` | 작품별 내용. 서버에는 암호화되어 올라간다. |

### 이전(migration)

- `format`이 오르면 공통 코드가, `schema`가 오르면 작품 코드가 이전한다. 이전 함수는 한 단계씩 이어 붙인다.
- 이전 직전의 원본 봉투를 슬롯당 하나 백업으로 남긴다.
- 이전할 수 없거나 `dataVersion`이 맞지 않는 슬롯은 지우지 않고 "불러올 수 없음"으로 표시한다.

## 동기화 코드

1. 처음 연결하는 기기가 무작위 128비트 비밀값 `K`를 만든다. 사람이 읽는 문자열(Crockford base32, 4글자씩 끊어 26자)과 QR(`#link=<코드>`)로 보여 준다.
2. 다른 기기가 코드를 입력하거나 QR을 찍으면 같은 `K`를 갖는다.
3. 키 파생(HKDF-SHA256): `vaultId = HKDF(K,"id")`, `authToken = HKDF(K,"auth")`, `encKey = HKDF(K,"enc")`.
4. 서버는 `vaultId`와 `authToken`의 해시만 안다. `payload`는 `encKey`로 AES-GCM 암호화해서 올리므로 서버는 위치·플래그를 읽지 못한다. `label`·`savedAt` 같은 봉투 메타는 평문이다.
5. 코드를 잃으면 서버의 보관함은 복구할 수 없다. 대신 백업 파일을 가져올 수 있다. 연결 해제는 기기에서 `K`를 지우는 것이고, "보관함 삭제"는 서버에 `DELETE`를 보낸다.

## 서버 API (v1)

호스팅은 아직 정하지 않았으므로 어디에든 올릴 수 있는 최소 규격만 둔다. 모든 요청에 `Authorization: Bearer <authToken>`.

| 요청 | 설명 |
|---|---|
| `PUT /v1/vaults/{vaultId}` | 보관함 생성. 첫 요청에서 `authToken` 해시를 등록한다. 이미 있으면 `409`. |
| `GET /v1/vaults/{vaultId}/saves` | 슬롯 목록(메타만): `gameId, slot, revision, savedAt, size, deviceId, label`. |
| `GET /v1/vaults/{vaultId}/saves/{gameId}/{slot}` | 봉투 한 개. |
| `PUT /v1/vaults/{vaultId}/saves/{gameId}/{slot}` | 저장. `If-Match: <baseRevision>` 필수(처음 저장은 `0`). 성공하면 새 `revision`을 돌려준다. 맞지 않으면 `409`와 서버 쪽 봉투. |
| `DELETE /v1/vaults/{vaultId}/saves/{gameId}/{slot}` | 슬롯 삭제(삭제 표시를 `revision`과 함께 남긴다). |
| `DELETE /v1/vaults/{vaultId}` | 보관함 전체 삭제. |

한도(제안): 슬롯당 256KB, 보관함당 슬롯 200개, 요청 빈도 제한. 서버는 ROM·대사 원문을 받지 않는다.

### 충돌

- 기기 A와 B가 같은 슬롯을 서로 모르는 채 고쳐서 `If-Match`가 틀리면 서버는 `409`로 거절한다.
- 클라이언트는 덮어쓰지 않고 "이 기기 저장 / 다른 기기 저장" 중에서 고르게 한다. 지는 쪽은 슬롯당 하나의 백업으로 남긴다.
- 중단 저장(`suspend`)은 같은 흐름이되, 시작할 때 서버 쪽이 더 새로우면 "다른 기기에서 이어서 하시겠습니까?"를 먼저 묻는다.

## 슬롯 구성

슬롯은 작품 Codec이 `slots()`로 선언하고, 공통 그룹은 세 가지다: `manual`(원작의 수동 저장 N개), `system`(전역 진행도·해금 등 singleton, 해당 작품에 있을 때만), `suspend`(웹 전용 singleton, 원작 화면에는 나타나지 않음).

| 작품 | 슬롯 | 비고 |
|---|---|---|
| 카마이타치의 밤 GBA | `manual-0`..`manual-2`, `suspend` | 책 3권(저장·읽기·지우기·복사). `payload`는 페이지 시작 시점 VM 상태. 완·종 횟수는 `payload`에 포함. |
| SFC (카마이타치·석류의 맛 등) | `manual-N`, `system`?, `suspend` | 슬롯 수와 SRAM의 전역 진행도 유무는 작품별 ROM에서 확인한 뒤 채운다. |
| PS1·PS2 | `manual-N`, `system`?, `suspend` | 작품별 가상 카드. 카드 id·원작 파일명·블록 수는 `original` 메타데이터. |

PS 카드를 작품 간에 공유하거나 전작 데이터를 이어받는 일이 실제로 필요해지면, 파일 하나를 개별 슬롯처럼 동기화하면 여러 파일로 이루어진 저장이 부분 갱신될 수 있다. 그 경우에는 `카드 → 저장 항목들` 두 단계 모델과 카드 단위 원자적 쓰기를 따로 설계한다(지금은 하지 않음).

## 백업 파일

- 확장자 `.snsave`(내용은 JSON). 최상위: `{ "kind": "soundnovel-backup", "format": 1, "exportedAt": ..., "saves": [봉투...] }`.
- 암호화되지 않은 평문 봉투를 담는다(기기 안에서 만들어지므로).
- 모바일은 공유 시트로 내보내고, 가져올 때는 슬롯별로 덮어쓰기 여부를 묻는다.

## 아직 정하지 않은 것

- 서버 호스팅과 구현 언어(최소 API만 정해 둠).
- SFC·PS 작품별 슬롯 구성과 `system` 슬롯 유무(각 원본에서 확인 필요).
- 전작 데이터 이어받기 여부(PS1·PS2 바이너리에서 확인 예정).
- 계정 로그인(필요해지면 동기화 코드 위에 선택 기능으로).
