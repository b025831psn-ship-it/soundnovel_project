# shared/save

공통 세이브 저장소 구현. 설계는 `docs/save/README.md`.

- `envelope.js` 봉투 형식 검사. `backends.js` IndexedDB·메모리 저장 백엔드.
- `store.js` `SaveStore`: 동기 읽기(메모리 캐시) + 로컬 우선 쓰기 + 동기화 대기열 + 백업 파일 내보내기·가져오기.
- `codec.js` 작품별 `SaveCodec` 계약과 `validate → migrate → decode` 불러오기 순서(실패는 예외가 아닌 결과).
- `sync.js` 동기화 코드(26자 Crockford base32), HKDF 키 파생, AES-GCM 페이로드 암호화, `SyncClient`.
- `server/server.mjs` 의존성 없는 참조 서버(파일 보관). 같은 HTTP API를 구현하면 다른 호스트로 바꿀 수 있다. `node server/server.mjs [dir] [port]`.

테스트: `npm test`(노드), `NODE_PATH=$(npm root -g) node tests/browser.mjs`(Chromium의 실제 IndexedDB).

서버 한도: 본문 256KB, 보관함당 슬롯 200개. 요청 빈도 제한과 HTTPS 종단은 호스팅 쪽에서 맡는다(미구현).
