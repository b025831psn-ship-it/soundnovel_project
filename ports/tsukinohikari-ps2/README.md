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
