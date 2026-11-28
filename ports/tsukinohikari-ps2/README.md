# 月の光 PS2 시나리오 추출

일본판 SLPS-20196의 D1 디렉터리에 있는 ED 파일 18개를 디스크 순서대로 읽는다. Python 3.11 이상에서 실행한다.

    python extract.py "<원본 BIN>" "<비공개 출력 폴더>"

원본 파일명은 `Akagawa Jirou - Tsuki no Hikari - Shizumeru Kane no Satsujin (Japan)`이며 확장자는 .bin과 .cue다. TRACK 01 MODE2/2352, INDEX 01 00:00:00. SYSTEM.CNF의 BOOT2는 SLPS_201.96;1, VER는 1.40, VMODE는 NTSC다.

| 파일 | SHA-256 |
| --- | --- |
| BIN | 76b2384779c8b895b3712d2e2b3fd7114389f3ca09bd39e378cc379f2069edd5 |
| CUE | 7a076b10745ea18f9ef59bd012887781b492ec060789785cad79e3429abf94cd |

## 번역 인계 형식

ED 하나에 JSON 파일 하나를 생성한다. 페이지마다 장면명, ED 시작 기준 바이트 오프셋, 순서가 있는 items 배열을 담는다. 두 시나리오 계열 S0x와 S1x에서 반복되는 문장도 각각의 ID를 유지한다. 페이지 순서는 ED의 색인 순서다. 실제 진행 순서는 분기에 따라 달라진다.

- text와 choice의 ja가 번역 대상이다. ID는 ED 이름, 10진 페이지 번호, 페이지 시작 기준 16진 바이트 오프셋으로 구성된다.
- choice의 target은 같은 ED의 0부터 시작하는 목적지 페이지 번호다. 선택지 묶음 바로 앞의 command에 원래 인수를 보존한다.
- 중괄호 안의 16진 값은 원본 제어 코드와 인수다. 번역 후에도 순서와 값을 보존한다.
- command의 opcode는 10진수, args는 바이트 순서 그대로의 16진수다.

직접 작성한 형식 예문은 example.json에 있다. 실제 데이터는 비공개 저장소 tsuki-no-hikari-ps2-kor의 source/ja에 둔다. 기준 공통 가이드 커밋은 c3f480d58f688046813f035acad185342c9449c6이다.
## 로컬 그래픽

`python prepare_media.py "<원본 BIN>" "<로컬 리소스 디렉터리>"`로 디스크 경로를 보존한 리소스를 준비한다. image.mjs의 parts와 decodeImage는 CFP의 팔레트와 압축된 인덱스 이미지를 RGBA로 변환한다. SLPS-20196의 CFP 2,181개에서 압축 스트림 길이·픽셀 수·색 심도를 검사했다. 픽셀과 원본 화면의 대조는 별도 검증 항목이다.
로컬 리소스 폴더에 대해 python av.py "<로컬 리소스 디렉터리>"를 실행하면 movies에 H.264 MP4, sound에 원본 순서의 PCM WAV가 생성된다. FFmpeg가 필요하다. PSS의 독립 PCM 패킷에서 좌우 채널을 재배열한다.
## 시나리오 실행 코어

scenario.mjs는 ED 페이지·명령 커서, 두 플래그 뱅크, 선택지와 분기를 다룬다. SLPS_201.96의 STORY.BIN 심벌 eveComBranch, eveExeBranch, eveComFlag, eveFlagPointerGet을 기준으로 작성했다. 선택 확정 시 선택 번호는 1부터 기록한다. 비교 분기는 원본 순서대로 첫 일치 목적지를 사용한다. 선택 대기 중 저장한 상태를 복원할 수 있다.

검증은 `node scenario.test.mjs`와 `node audit-flow.mjs "<비공개 source/ja>"`로 실행한다. 후자는 원본 18개 ED의 분기·플래그 명령 위치에서 시작하여 목적지와 선택 후 커서를 검사한다. 특수 분기 0x51, 조건부 선택지 표시, 엔딩·연출 및 시스템 메뉴는 실행 코어 외부에 남아 있다.
